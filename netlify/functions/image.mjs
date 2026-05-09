// Netlify Function — Gemini Image Generation Proxy
export default async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('', { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } });
    }
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'POST only' }), { status: 405 });
    }

    const keysStr = Netlify.env.get('GEMINI_API_KEYS') || '';
    const keys = keysStr.split(',').map(k => k.trim()).filter(Boolean);
    if (!keys.length) {
        return new Response(JSON.stringify({ error: 'No API keys configured' }), { status: 500 });
    }

    const body = await req.json();
    const prompt = body.prompt || 'Generate an image';

    const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            responseModalities: ["TEXT", "IMAGE"]
        }
    };

    // Try each key
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${key}`;

        try {
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (resp.status === 429 || resp.status === 403) {
                console.log(`Key ${i + 1} rate limited, trying next...`);
                continue;
            }

            if (!resp.ok) {
                const errText = await resp.text();
                console.log(`Key ${i + 1} error:`, errText);
                continue;
            }

            const data = await resp.json();
            const parts = data.candidates?.[0]?.content?.parts || [];

            let imageData = null;
            let textResponse = '';

            for (const part of parts) {
                if (part.inlineData) {
                    imageData = {
                        mimeType: part.inlineData.mimeType,
                        data: part.inlineData.data
                    };
                }
                if (part.text) {
                    textResponse += part.text;
                }
            }

            return new Response(JSON.stringify({
                image: imageData,
                text: textResponse
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });

        } catch (err) {
            console.log(`Key ${i + 1} fetch error:`, err.message);
            continue;
        }
    }

    return new Response(JSON.stringify({ error: 'All API keys exhausted. Please try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
};

export const config = { path: "/api/image" };
