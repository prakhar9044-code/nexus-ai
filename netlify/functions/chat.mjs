// Netlify Serverless Function — Gemini API Proxy with Multi-Key Rotation
// Keys are stored in GEMINI_API_KEYS env var as comma-separated values
// If one key hits rate limit (429), it automatically tries the next key

let currentKeyIndex = 0; // Round-robin starting index

function getKeys() {
  // Support both: single key (GEMINI_API_KEY) and multiple keys (GEMINI_API_KEYS)
  const multi = process.env.GEMINI_API_KEYS || '';
  const single = process.env.GEMINI_API_KEY || '';
  const raw = multi || single;
  return raw.split(',').map(k => k.trim()).filter(Boolean);
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

  // Try each key, starting from current index (round-robin)
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const keyIndex = (currentKeyIndex + attempt) % keys.length;
    const apiKey = keys[keyIndex];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    try {
      const geminiResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });

      // If rate limited (429) or quota exceeded (403), try the next key
      if (geminiResponse.status === 429 || geminiResponse.status === 403) {
        console.log(`Key #${keyIndex + 1} rate limited (${geminiResponse.status}), trying next...`);
        continue;
      }

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        return new Response(errorText, {
          status: geminiResponse.status,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      // Success! Advance round-robin to next key for load balancing
      currentKeyIndex = (keyIndex + 1) % keys.length;

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
      continue;
    }
  }

  // All keys exhausted
  return new Response(JSON.stringify({
    error: 'All API keys are rate limited. Please try again in a minute. 🔄'
  }), {
    status: 429,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const config = {
  path: "/api/chat"
};
