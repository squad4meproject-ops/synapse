import { NextRequest, NextResponse } from 'next/server';

// POST /api/translate — Traduire du texte via MyMemory API (gratuit, pas de clé)
export async function POST(request: NextRequest) {
  try {
    const { text, from, to } = await request.json();

    if (!text || !from || !to) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Limiter à 500 caractères pour rester dans les limites gratuites
    const trimmedText = text.slice(0, 500);

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmedText)}&langpair=${from}|${to}`;

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: 'Translation failed' }, { status: 502 });
    }

    const data = await res.json();
    const translated = data?.responseData?.translatedText;

    if (!translated) {
      return NextResponse.json({ error: 'No translation' }, { status: 502 });
    }

    return NextResponse.json({ translated });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
