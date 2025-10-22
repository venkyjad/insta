// Supadata API Response Types

export interface TranscriptChunk {
  text: string;
  offset: number;
  duration: number;
}

export interface TranscriptResponse {
  content?: string | TranscriptChunk[]; // Can be either string or array of chunks
  lang?: string;
  availableLangs?: string[];
  chunks?: TranscriptChunk[];
}

export interface AsyncJobResponse {
  jobId: string;
}

export interface JobStatusResponse extends TranscriptResponse {
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ErrorResponse {
  error: string;
  message?: string;
}

export type SupadataResponse = TranscriptResponse | AsyncJobResponse;

// Instagram Metadata Types

export interface InstagramMetadata {
  url: string;
  username?: string;
  thumbnail?: string;
  title?: string;
  description?: string;
  // Note: likes and views require authentication/paid API
  // Using publicly available Open Graph data only
}

// Instagram Profile Reels Types

export interface InstagramReel {
  id: string;
  url: string;
  caption?: string;
  thumbnail?: string;
  likesCount?: number;
  viewsCount?: number;
  commentsCount?: number;
  timestamp?: string;
  posted_time?: string; // Alternative field name for timestamp
  videoUrl?: string;
  hashtags?: string[]; // Extracted hashtags from caption
  music_title?: string; // Music/audio title used in the reel
}

export interface InstagramReelWithTranscript extends InstagramReel {
  transcript?: TranscriptResponse;
}

export interface ProfileTopReelsResponse {
  username: string;
  profileUrl: string;
  topReels: InstagramReelWithTranscript[];
  totalReelsAnalyzed: number;
}

// Repurposing Types

export type RepurposingGoal =
  | 'repost-language'
  | 'create-version'
  | 'extract-message'
  | 'carousel-caption'
  | 'brand-voice';

export type TargetPlatform = 'instagram' | 'youtube' | 'tiktok' | 'linkedin' | 'twitter';

export type ContentTone =
  | 'motivational'
  | 'educational'
  | 'conversational'
  | 'humorous'
  | 'inspirational'
  | 'persuasive'
  | 'calm'
  | 'empathetic';

export type VisualPreference =
  | 'text-only'
  | 'b-roll-ideas'
  | 'carousel-prompts'
  | 'thumbnail-suggestions';

export interface PlatformConfig {
  name: string;
  idealDuration: string;
  tone: string;
  captionLimit: number;
  hashtagLimit: number;
  description: string;
}

export interface RepurposingRequest {
  goal: RepurposingGoal;
  targetPlatform: TargetPlatform;
  tone: ContentTone;
  visualPreference: VisualPreference;
  targetLanguage?: string;
  customInstructions?: string;
  originalTranscript: string;
  originalCaption?: string;
  originalHashtags?: string[];
}

export interface RepurposedContent {
  id: string;
  userId: string;
  originalReelId: string;
  goal: RepurposingGoal;
  targetPlatform: TargetPlatform;
  tone: ContentTone;
  visualPreference: VisualPreference;
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
}
