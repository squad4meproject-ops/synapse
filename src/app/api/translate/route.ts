import { NextRequest, NextResponse } from 'next/server';

const langNames: Record<string, string> = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
};

// POST /api/translate — Traduire du texte via Claude
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json({ error: 'Translation service not configured' }, { status: 503 });
    }

    const { text, from, to } = await request.json();

    if (!text || !from || !to) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (from === to) {
      return NextResponse.json({ translated: text });
    }

    // Limiter à 1000 caractères
    const trimmedText = text.slice(0, 1000);
    const fromLang = langNames[from] || from;
    const toLang = langNames[to] || to;

    // Appel direct à l'API Anthropic (sans SDK pour éviter les problèmes d'import)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Translate the following text from ${fromLang} to ${toLang}. Return ONLY the translation, nothing else. Do not add quotes or explanations.\n\nText to translate:\n${trimmedText}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Anthropic API error:', response.status, errorBody);

      if (response.status === 401) {
        return NextResponse.json({ error: 'Translation service unavailable (invalid API key)' }, { status: 503 });
      }
      if (response.status === 429) {
        return NextResponse.json({ error: 'Too many translation requests' }, { status: 429 });
      }
      return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
    }

    const data = await response.json();
    const translated = data.content?.[0]?.type === 'text' ? data.content[0].text : '';

    if (!translated) {
      return NextResponse.json({ error: 'Translation returned empty result' }, { status: 500 });
    }

    return NextResponse.json({ translated: translated.trim() });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Translation error:', errMsg);
    return NextResponse.json({ error: `Translation failed: ${errMsg}` }, { status: 500 });
  }
}
