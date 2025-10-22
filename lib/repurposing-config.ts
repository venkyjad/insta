import type { PlatformConfig, TargetPlatform } from './types';

export const PLATFORM_CONFIGS: Record<TargetPlatform, PlatformConfig> = {
  instagram: {
    name: 'Instagram',
    idealDuration: '15-60 seconds',
    tone: 'Authentic + Visual-first',
    captionLimit: 2200,
    hashtagLimit: 30,
    description: 'Short, engaging videos with strong visual appeal. Focus on the first 3 seconds to hook viewers.',
  },
  youtube: {
    name: 'YouTube',
    idealDuration: '8-15 minutes (Shorts: 60 seconds)',
    tone: 'In-depth + Educational',
    captionLimit: 5000,
    hashtagLimit: 15,
    description: 'Longer-form content with detailed explanations. Optimize for search with keywords in title and description.',
  },
  tiktok: {
    name: 'TikTok',
    idealDuration: '15-60 seconds',
    tone: 'Energetic + Trend-focused',
    captionLimit: 2200,
    hashtagLimit: 30,
    description: 'Fast-paced, trending content with immediate hooks. Use popular sounds and challenges.',
  },
  linkedin: {
    name: 'LinkedIn',
    idealDuration: '30-90 seconds',
    tone: 'Professional + Storytelling',
    captionLimit: 3000,
    hashtagLimit: 5,
    description: 'Professional insights and thought leadership. Share lessons, experiences, and industry knowledge.',
  },
  twitter: {
    name: 'Twitter (X)',
    idealDuration: '30-45 seconds',
    tone: 'Concise + Conversational',
    captionLimit: 280,
    hashtagLimit: 2,
    description: 'Quick, punchy content. Get to the point immediately and spark conversation.',
  },
};

export const GOAL_LABELS = {
  'repost-language': 'Repost in Other Language',
  'create-version': 'Create Shorter/Longer Version',
  'extract-message': 'Extract Key Message for New Script',
  'carousel-caption': 'Turn into Carousel or Post Caption',
  'brand-voice': 'Recreate in Your Own Brand Voice',
};

export const TONE_LABELS = {
  motivational: 'Motivational',
  educational: 'Educational',
  conversational: 'Conversational',
  humorous: 'Humorous',
  inspirational: 'Inspirational',
  persuasive: 'Persuasive',
  calm: 'Calm',
  empathetic: 'Empathetic',
};

export const VISUAL_PREFERENCE_LABELS = {
  'text-only': 'Text-Only',
  'b-roll-ideas': 'B-Roll Ideas',
  'carousel-prompts': 'Carousel Prompts',
  'thumbnail-suggestions': 'AI-Generated Thumbnail Suggestions',
};

export const TONE_DESCRIPTIONS: Record<string, string> = {
  motivational: 'Inspire action and drive change',
  educational: 'Teach and inform with clarity',
  conversational: 'Friendly and approachable',
  humorous: 'Light-hearted and entertaining',
  inspirational: 'Uplift and encourage',
  persuasive: 'Convince and influence',
  calm: 'Soothing and reassuring',
  empathetic: 'Understanding and compassionate',
};

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
];
