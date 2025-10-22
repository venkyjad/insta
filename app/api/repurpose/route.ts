import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { RepurposingRequest, ErrorResponse } from '@/lib/types';
import { PLATFORM_CONFIGS } from '@/lib/repurposing-config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body: RepurposingRequest = await request.json();

    const {
      goal,
      targetPlatform,
      tone,
      visualPreference,
      targetLanguage,
      customInstructions,
      originalTranscript,
      originalCaption,
      originalHashtags,
    } = body;

    // Validate required fields
    if (!goal || !targetPlatform || !tone || !visualPreference || !originalTranscript) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const platformConfig = PLATFORM_CONFIGS[targetPlatform];

    // Build the AI prompt based on the repurposing goal
    const systemPrompt = buildSystemPrompt(goal, platformConfig, tone, visualPreference, targetLanguage);
    const userPrompt = buildUserPrompt(
      originalTranscript,
      originalCaption,
      originalHashtags,
      customInstructions
    );

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const generatedContent = completion.choices[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('Failed to generate content from OpenAI');
    }

    // Parse the structured response
    const parsedContent = parseGeneratedContent(generatedContent, visualPreference);

    return NextResponse.json(parsedContent, { status: 200 });
  } catch (error) {
    console.error('Repurposing error:', error);
    return NextResponse.json<ErrorResponse>(
      {
        error: 'Failed to repurpose content',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(
  goal: string,
  platformConfig: typeof PLATFORM_CONFIGS[keyof typeof PLATFORM_CONFIGS],
  tone: string,
  visualPreference: string,
  targetLanguage?: string
): string {
  let basePrompt = `You are an expert content repurposing strategist specializing in social media optimization.

Platform: ${platformConfig.name}
Platform characteristics:
- Ideal Duration: ${platformConfig.idealDuration}
- Platform Tone: ${platformConfig.tone}
- Caption Limit: ${platformConfig.captionLimit} characters
- Hashtag Limit: ${platformConfig.hashtagLimit} hashtags
- Description: ${platformConfig.description}

Desired Tone: ${tone}
Visual Preference: ${visualPreference}

`;

  // Add goal-specific instructions
  switch (goal) {
    case 'repost-language':
      basePrompt += `Goal: Translate and adapt the content to ${targetLanguage || 'the target language'}.
- Maintain cultural relevance and idioms appropriate for the target language
- Adapt jokes, references, and examples to resonate with the target audience
- Keep the core message and value intact\n\n`;
      break;

    case 'create-version':
      basePrompt += `Goal: Create a ${platformConfig.idealDuration} version optimized for ${platformConfig.name}.
- Adapt the pacing to match platform expectations
- Restructure the hook and CTA for the platform
- Adjust content density based on ideal duration\n\n`;
      break;

    case 'extract-message':
      basePrompt += `Goal: Extract the key message and create a new script.
- Identify the core value proposition
- Create a fresh angle or perspective on the same topic
- Write a complete new script that conveys the same message differently\n\n`;
      break;

    case 'carousel-caption':
      basePrompt += `Goal: Transform into a carousel post or caption format.
- Break down content into digestible slides (if carousel)
- Create engaging slide headlines
- Structure information for static visual consumption\n\n`;
      break;

    case 'brand-voice':
      basePrompt += `Goal: Recreate in the user's brand voice.
- Adapt language, terminology, and style
- Maintain authenticity while covering the same topic
- Infuse personality and unique perspective\n\n`;
      break;
  }

  // Add visual-specific instructions
  switch (visualPreference) {
    case 'text-only':
      basePrompt += `Visual: Provide text-only content with no visual suggestions.\n\n`;
      break;
    case 'b-roll-ideas':
      basePrompt += `Visual: Suggest 5-7 B-roll shot ideas that would accompany each section of the script.\n\n`;
      break;
    case 'carousel-prompts':
      basePrompt += `Visual: Create 5-10 carousel slide prompts with headlines and key points for each slide.\n\n`;
      break;
    case 'thumbnail-suggestions':
      basePrompt += `Visual: Provide 3-5 AI-generated thumbnail concepts with detailed descriptions for DALL-E or Midjourney.\n\n`;
      break;
  }

  basePrompt += `Format your response as a JSON object with the following structure:
{
  "script": "The repurposed script/content",
  "caption": "Social media caption (within ${platformConfig.captionLimit} chars)",
  "hashtags": ["hashtag1", "hashtag2", ...] (max ${platformConfig.hashtagLimit}),
  "duration": "Estimated duration",
  "visualSuggestions": [] // Array of visual suggestions based on preference
}`;

  return basePrompt;
}

function buildUserPrompt(
  transcript: string,
  caption?: string,
  hashtags?: string[],
  customInstructions?: string
): string {
  let prompt = `Original Content:\n\nTranscript:\n${transcript}\n\n`;

  if (caption) {
    prompt += `Original Caption:\n${caption}\n\n`;
  }

  if (hashtags && hashtags.length > 0) {
    prompt += `Original Hashtags:\n${hashtags.map((h) => `#${h}`).join(' ')}\n\n`;
  }

  if (customInstructions) {
    prompt += `Custom Instructions:\n${customInstructions}\n\n`;
  }

  prompt += `Please repurpose this content according to the specifications above. Return a valid JSON object.`;

  return prompt;
}

function parseGeneratedContent(content: string, visualPreference: string) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Ensure all required fields exist
    return {
      generatedScript: parsed.script || '',
      generatedCaption: parsed.caption || '',
      suggestedHashtags: parsed.hashtags || [],
      duration: parsed.duration || '',
      visualSuggestions: parsed.visualSuggestions || [],
      thumbnailIdeas: visualPreference === 'thumbnail-suggestions' ? parsed.visualSuggestions : undefined,
      bRollSuggestions: visualPreference === 'b-roll-ideas' ? parsed.visualSuggestions : undefined,
      carouselSlides: visualPreference === 'carousel-prompts' ? parsed.visualSuggestions : undefined,
    };
  } catch (error) {
    console.error('Failed to parse generated content:', error);
    // Fallback: return raw content
    return {
      generatedScript: content,
      generatedCaption: '',
      suggestedHashtags: [],
      duration: '',
      visualSuggestions: [],
    };
  }
}
