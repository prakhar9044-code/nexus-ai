// Netlify Serverless Function — Proxies Gemini API calls
// API key is read from Netlify environment variable (never exposed)
export default async (req) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    const model = body.model || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: body.system_instruction,
        contents: body.contents,
        generationConfig: body.generationConfig,
        safetySettings: body.safetySettings
      })
    });

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
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = {
  path: "/api/chat"
};
