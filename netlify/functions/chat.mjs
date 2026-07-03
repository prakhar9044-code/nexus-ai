// Netlify Serverless Function — Gemini API Proxy with Multi-Key Rotation
// Keys are stored in GEMINI_API_KEYS env var as comma-separated values
// Uses random key selection + per-key cooldown tracking via global state

// In-memory cooldown map (per warm instance)
const cooldowns = new Map(); // key => timestamp when cooldown expires

function getKeys() {
  // Support both: single key (GEMINI_API_KEY) and multiple keys (GEMINI_API_KEYS)
  const multi = process.env.GEMINI_API_KEYS || '';
  const single = process.env.GEMINI_API_KEY || '';
  const raw = multi || single;
  return raw.split(',').map(k => k.trim()).filter(Boolean);
}

function getAvailableKeys(keys) {
  const now = Date.now();
  return keys.filter((key, i) => {
    const cooldownEnd = cooldowns.get(i) || 0;
    return now >= cooldownEnd;
  });
}

function cooldownKey(keyIndex, durationMs = 65000) {
  // Cool down for 65 seconds (slightly over 1 min to be safe)
  cooldowns.set(keyIndex, Date.now() + durationMs);
}

export default async (req) => {
  const keys = getKeys();

  if (keys.length === 0) {
    return new Response(JSON.stringify({ error: 'No API keys configured. Add GEMINI_API_KEYS in Netlify env.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const model = body.model || 'gemini-2.5-flash';
  const payload = JSON.stringify({
    system_instruction: body.system_instruction,
    contents: body.contents,
    generationConfig: body.generationConfig,
    safetySettings: body.safetySettings
  });

  // Get keys that aren't on cooldown first, fall back to all keys
  let availableKeys = getAvailableKeys(keys);
  const keysToTry = availableKeys.length > 0 ? availableKeys : keys;

  // Shuffle keys randomly so we don't always hit key #1 first
  const shuffledIndices = keys.map((_, i) => i)
    .filter(i => keysToTry.includes(keys[i]))
    .sort(() => Math.random() - 0.5);

  for (const keyIndex of shuffledIndices) {
    const apiKey = keys[keyIndex];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    try {
      const geminiResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });

      // If rate limited (429) or quota exceeded (403), cooldown this key and try next
      if (geminiResponse.status === 429 || geminiResponse.status === 403) {
        console.log(`Key #${keyIndex + 1} rate limited (${geminiResponse.status}), cooling down for 65s`);
        cooldownKey(keyIndex);
        continue;
      }

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        return new Response(errorText, {
          status: geminiResponse.status,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      // Stream the SSE response back to the client
      return new Response(geminiResponse.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (err) {
      console.log(`Key #${keyIndex + 1} fetch error: ${err.message}, trying next...`);
      cooldownKey(keyIndex, 10000); // shorter cooldown for fetch errors
      continue;
    }
  }

  // All keys exhausted — tell client to retry after a delay
  return new Response(JSON.stringify({
    error: 'All API keys are rate limited. Please try again in a minute. 🔄',
    retryAfter: 30
  }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': '30'
    }
  });
};

export const config = {
  path: "/api/chat"
};
