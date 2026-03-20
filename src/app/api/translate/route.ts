import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const langNames: Record<string, string> = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
};

// POST /api/translate — Traduire du texte via Claude (haute qualité)
export async function POST(request: NextRequest) {
  try {
    const { text, from, to } = await request.json();

    if (!text || !from || !to) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (from === to) {
      return NextResponse.json({ translated: text });
    }

    // Limiter à 1000 caractères pour contrôler les coûts
    const trimmedText = text.slice(0, 1000);
    const fromLang = langNames[from] || from;
    const toLang = langNames[to] || to;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Translate the following text from ${fromLang} to ${toLang}. Return ONLY the translation, nothing else. Do not add quotes or explanations.\n\nText to translate:\n${trimmedText}`,
        },
      ],
    });

    const translated = message.content[0].type === 'text' ? message.content[0].text : '';

    if (!translated) {
      return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
    }

    return NextResponse.json({ translated: translated.trim() });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
