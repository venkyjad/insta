import { init } from '@instantdb/react';

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID!;

if (!APP_ID) {
  throw new Error('NEXT_PUBLIC_INSTANT_APP_ID is not set');
}

// Define your schema
type Schema = {
  users: {
    id: string;
    email: string;
    supadataApiKey?: string;
    apifyApiKey?: string;
    createdAt: number;
  };
  transcripts: {
    id: string;
    userId: string;
    url: string;
    type: 'single' | 'profile';
    transcript: string;
    metadata?: any;
    createdAt: number;
  };
  savedReels: {
    id: string;
    userId: string;
    reelId: string;
    url: string;
    caption?: string;
    thumbnail?: string;
    likesCount?: number;
    viewsCount?: number;
    commentsCount?: number;
    hashtags?: string[]; // Extracted hashtags from caption
    music_title?: string; // Music/audio title used in the reel
    posted_time?: string; // When the reel was posted
    transcript?: string;
    transcriptLang?: string;
    username?: string;
    translations?: Record<string, string>; // { 'es': 'translated text', 'hi': 'translated text' }
    createdAt: number;
  };
  repurposedContent: {
    id: string;
    userId: string;
    originalReelId: string;
    goal: string; // RepurposingGoal type
    targetPlatform: string; // TargetPlatform type
    tone: string; // ContentTone type
    visualPreference: string; // VisualPreference type
    generatedScript?: string;
    generatedCaption?: string;
    suggestedHashtags?: string[];
    visualSuggestions?: string[];
    thumbnailIdeas?: string[];
    bRollSuggestions?: string[];
    carouselSlides?: string[];
    duration?: string;
    targetLanguage?: string;
    createdAt: number;
  };
};

const db = init<Schema>({ appId: APP_ID });

export default db;
