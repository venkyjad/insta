import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Text and target language are required' },
        { status: 400 }
      );
    }

    const languageNames: Record<string, string> = {
      es: 'Spanish',
      ar: 'Arabic',
      fr: 'French',
      de: 'German',
      pt: 'Portuguese',
      hi: 'Hindi',
      kn: 'Kannada',
      te: 'Telugu',
      ta: 'Tamil',
    };

    const targetLangName = languageNames[targetLanguage] || targetLanguage;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following text to ${targetLangName}. Only return the translated text, nothing else. Maintain the same tone and style.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const translatedText = completion.choices[0]?.message?.content || '';

    return NextResponse.json({
      translatedText,
      targetLanguage,
      originalLength: text.length,
      translatedLength: translatedText.length,
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to translate text',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

