'use client';

import { useState } from 'react';
import db from '@/lib/instant';
import TranscriptTranslator from './TranscriptTranslator';
import RepurposingWizard, { type RepurposingFormData } from './RepurposingWizard';
import type { InstagramReel, TranscriptResponse } from '@/lib/types';

interface ReelDetailViewProps {
  reel: InstagramReel;
  username: string;
  onClose: () => void;
}

type TabType = 'transcript' | 'repurpose' | 'history';

export default function ReelDetailView({ reel, username, onClose }: ReelDetailViewProps) {
  const { user } = db.useAuth();
  const { data: savedReelsData } = db.useQuery({ savedReels: {} });
  const savedReels = savedReelsData?.savedReels || [];

  const [activeTab, setActiveTab] = useState<TabType>('transcript');
  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [reelTranslations, setReelTranslations] = useState<Record<string, string>>({});

  // Repurposing state
  const [isRepurposing, setIsRepurposing] = useState(false);
  const [repurposedContent, setRepurposedContent] = useState<any>(null);
  const [repurposingError, setRepurposingError] = useState<string | null>(null);

  const isReelSaved = savedReels.some((saved: any) => saved.reelId === reel.id);
  const thumbnailUrl = reel.thumbnail 
    ? `/api/image-proxy?url=${encodeURIComponent(reel.thumbnail)}`
    : null;

  const fetchTranscript = async () => {
    setIsLoadingTranscript(true);
    setTranscriptError(null);

    try {
      const response = await fetch(`/api/reel-transcript?url=${encodeURIComponent(reel.url)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to fetch transcript');
      }

      setTranscript(data as TranscriptResponse);
    } catch (error) {
      console.error('Error fetching transcript:', error);
      setTranscriptError(error instanceof Error ? error.message : 'Failed to fetch transcript');
    } finally {
      setIsLoadingTranscript(false);
    }
  };

  const handleGenerateTranscript = () => {
    if (!transcript && !isLoadingTranscript) {
      fetchTranscript();
    }
  };

  const getTranscriptText = () => {
    if (!transcript) return '';
    
    const content = transcript.content;
    if (typeof content === 'string') {
      return content;
    }
    if (Array.isArray(content)) {
      return content.map(chunk => chunk.text).join(' ');
    }
    return '';
  };

  const handleTranslationGenerated = (translatedText: string, languageCode: string) => {
    setReelTranslations(prev => ({
      ...prev,
      [languageCode]: translatedText,
    }));
  };

  const handleSave = async () => {
    if (!user || !transcript) return;

    setIsSaving(true);

    try {
      const transcriptText = getTranscriptText();

      await db.transact([
        db.tx.savedReels[crypto.randomUUID()].update({
          userId: user.id,
          reelId: reel.id,
          url: reel.url,
          caption: reel.caption,
          thumbnail: reel.thumbnail,
          likesCount: reel.likesCount,
          viewsCount: reel.viewsCount,
          commentsCount: reel.commentsCount,
          hashtags: reel.hashtags,
          music_title: reel.music_title,
          posted_time: reel.posted_time || reel.timestamp,
          transcript: transcriptText,
          transcriptLang: transcript.lang,
          username: username,
          translations: reelTranslations,
          createdAt: Date.now(),
        }),
      ]);
    } catch (error) {
      console.error('Error saving reel:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnsave = async () => {
    const savedReel = savedReels.find((saved: any) => saved.reelId === reel.id);
    if (!savedReel) return;

    setIsSaving(true);

    try {
      await db.transact([
        db.tx.savedReels[savedReel.id].delete(),
      ]);
    } catch (error) {
      console.error('Error unsaving reel:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const copyTranscript = async () => {
    const text = getTranscriptText();
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRepurpose = async (formData: RepurposingFormData) => {
    if (!user) return;

    setIsRepurposing(true);
    setRepurposingError(null);

    try {
      const transcriptText = getTranscriptText();

      const response = await fetch('/api/repurpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          originalTranscript: transcriptText,
          originalCaption: reel.caption,
          originalHashtags: reel.hashtags,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Server returned an invalid response. Please check your environment variables.');
      }

      if (!response.ok) {
        // Show detailed error message from the server
        const errorMessage = data.message || data.error || 'Failed to repurpose content';
        throw new Error(errorMessage);
      }

      setRepurposedContent(data);

      // Save to database
      await db.transact([
        db.tx.repurposedContent[crypto.randomUUID()].update({
          userId: user.id,
          originalReelId: reel.id,
          goal: formData.goal,
          targetPlatform: formData.targetPlatform,
          tone: formData.tone,
          visualPreference: formData.visualPreference,
          targetLanguage: formData.targetLanguage,
          generatedScript: data.generatedScript,
          generatedCaption: data.generatedCaption,
          suggestedHashtags: data.suggestedHashtags,
          visualSuggestions: data.visualSuggestions,
          thumbnailIdeas: data.thumbnailIdeas,
          bRollSuggestions: data.bRollSuggestions,
          carouselSlides: data.carouselSlides,
          duration: data.duration,
          createdAt: Date.now(),
        }),
      ]);
    } catch (error) {
      console.error('Error repurposing content:', error);
      setRepurposingError(error instanceof Error ? error.message : 'Failed to repurpose content');
    } finally {
      setIsRepurposing(false);
    }
  };

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const transcriptText = getTranscriptText();

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-neutral-800 bg-neutral-900 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-800 rounded-lg transition-all"
            >
              <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div>
              <h3 className="text-white font-semibold">Reel Details</h3>
              <p className="text-xs text-neutral-400">@{username}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <a
              href={reel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-neutral-800 text-white text-sm rounded-lg hover:bg-neutral-700 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View
            </a>
            <button
              onClick={isReelSaved ? handleUnsave : handleSave}
              disabled={(!transcript && !isReelSaved) || isSaving}
              className={`px-4 py-2 text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                isReelSaved
                  ? 'bg-green-700 text-white hover:bg-green-600'
                  : 'bg-neutral-800 text-white hover:bg-neutral-700'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : isReelSaved ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="flex-shrink-0 border-b border-neutral-800 bg-neutral-900">
        <div className="flex">
          <button
            onClick={() => setActiveTab('transcript')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'transcript'
                ? 'text-white border-b-2 border-white'
                : 'text-neutral-400 hover:text-neutral-300'
            }`}
          >
            Transcription
          </button>
          <button
            onClick={() => setActiveTab('repurpose')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'repurpose'
                ? 'text-white border-b-2 border-white'
                : 'text-neutral-400 hover:text-neutral-300'
            }`}
          >
            Repurpose
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'history'
                ? 'text-white border-b-2 border-white'
                : 'text-neutral-400 hover:text-neutral-300'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Thumbnail and Stats */}
        <div className="p-6 border-b border-neutral-800">
          <div className="flex gap-4">
            {/* Thumbnail */}
            <div className="flex-shrink-0">
              {thumbnailUrl ? (
                <div className="relative w-32 h-32 bg-neutral-950 rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbnailUrl}
                    alt="Reel thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 bg-neutral-950 rounded-lg flex items-center justify-center">
                  <svg className="w-12 h-12 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Caption and Stats */}
            <div className="flex-1">
              <p className="text-neutral-300 text-sm mb-3 line-clamp-3">
                {typeof reel.caption === 'string'
                  ? reel.caption
                  : (reel.caption ? JSON.stringify(reel.caption) : 'No caption')}
              </p>
              <div className="flex items-center gap-4 text-xs text-neutral-500 mb-2">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  {formatNumber(reel.viewsCount)} views
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  {formatNumber(reel.commentsCount)} comments
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                  {formatNumber(reel.likesCount)} likes
                </span>
              </div>
              {reel.hashtags && Array.isArray(reel.hashtags) && reel.hashtags.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-neutral-500 mb-1">Hashtags:</p>
                  <div className="flex flex-wrap gap-1">
                    {reel.hashtags.map((tag: any, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 bg-neutral-900 text-neutral-400 text-xs rounded">
                        #{typeof tag === 'string' ? tag : (tag.headline || tag.keyPoints || JSON.stringify(tag))}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {reel.music_title && (
                <p className="text-xs text-neutral-500 mb-2">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                    Music: {reel.music_title}
                  </span>
                </p>
              )}
              {reel.posted_time && (
                <p className="text-xs text-neutral-600">
                  Posted: {new Date(reel.posted_time).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'transcript' && (
            <div className="space-y-6">
              {!transcript && !isLoadingTranscript && !transcriptError && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-900 flex items-center justify-center">
                    <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold mb-2">Generate Transcript</h3>
                  <p className="text-neutral-400 text-sm mb-6">
                    Extract the transcript from this reel
                  </p>
                  <button
                    onClick={handleGenerateTranscript}
                    className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-all"
                  >
                    Generate Transcription
                  </button>
                </div>
              )}

              {isLoadingTranscript && (
                <div className="text-center py-12">
                  <div className="w-12 h-12 mx-auto mb-4 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
                  <p className="text-neutral-400 text-sm">Generating transcript...</p>
                </div>
              )}

              {transcriptError && (
                <div className="p-4 bg-red-950 border border-red-900 rounded-lg">
                  <p className="text-red-300 text-sm">{transcriptError}</p>
                </div>
              )}

              {transcript && transcriptText && (
                <div className="space-y-6">
                  {/* Original Transcript */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-semibold">Transcript</h3>
                      <button
                        onClick={copyTranscript}
                        className="px-3 py-1 bg-neutral-800 text-white text-xs rounded hover:bg-neutral-700 transition-all"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 max-h-80 overflow-y-auto">
                      <p className="text-neutral-300 text-sm whitespace-pre-wrap leading-relaxed">
                        {transcriptText}
                      </p>
                    </div>
                    {transcript.lang && (
                      <p className="mt-2 text-xs text-neutral-500">
                        Language: {transcript.lang}
                      </p>
                    )}
                  </div>

                  {/* Translation Section */}
                  <div className="pt-6 border-t border-neutral-800">
                    <TranscriptTranslator 
                      originalText={transcriptText}
                      onTranslate={handleTranslationGenerated}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'repurpose' && (
            <div>
              {!transcript && !repurposedContent && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-900 flex items-center justify-center">
                    <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold mb-2">Generate Transcript First</h3>
                  <p className="text-neutral-400 text-sm mb-4">
                    You need to generate a transcript before repurposing content
                  </p>
                  <button
                    onClick={() => setActiveTab('transcript')}
                    className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-all"
                  >
                    Go to Transcript Tab
                  </button>
                </div>
              )}

              {transcript && !repurposedContent && (
                <RepurposingWizard
                  originalTranscript={transcriptText}
                  originalCaption={reel.caption}
                  originalHashtags={reel.hashtags}
                  onGenerate={handleRepurpose}
                  onCancel={() => setActiveTab('transcript')}
                  isLoading={isRepurposing}
                />
              )}

              {repurposingError && (
                <div className="p-6">
                  <div className="p-4 bg-red-950 border border-red-900 rounded-lg space-y-3">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="text-red-300 font-semibold text-sm mb-1">Failed to Generate Content</h4>
                        <p className="text-red-200 text-sm">{repurposingError}</p>
                      </div>
                    </div>

                    {repurposingError.includes('API key') && (
                      <div className="mt-3 p-3 bg-red-900/30 rounded border border-red-800">
                        <p className="text-xs text-red-200 mb-2 font-semibold">How to fix:</p>
                        <ol className="text-xs text-red-200 space-y-1 list-decimal list-inside">
                          <li>Check if you have a <code className="bg-red-950 px-1 py-0.5 rounded">.env.local</code> file</li>
                          <li>Make sure it contains: <code className="bg-red-950 px-1 py-0.5 rounded">OPENAI_API_KEY=sk-...</code></li>
                          <li>Get an API key from: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a></li>
                          <li>Restart the development server after adding the key</li>
                        </ol>
                      </div>
                    )}

                    {repurposingError.includes('quota') || repurposingError.includes('rate limit') && (
                      <div className="mt-3 p-3 bg-red-900/30 rounded border border-red-800">
                        <p className="text-xs text-red-200">
                          You have exceeded your OpenAI API quota. Check your billing at{' '}
                          <a href="https://platform.openai.com/account/billing" target="_blank" rel="noopener noreferrer" className="underline">
                            OpenAI Billing Dashboard
                          </a>
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => setRepurposingError(null)}
                      className="text-xs text-red-300 hover:text-red-200 underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {repurposedContent && (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Repurposed Content</h3>
                    <button
                      onClick={() => {
                        setRepurposedContent(null);
                        setRepurposingError(null);
                      }}
                      className="px-4 py-2 bg-neutral-800 text-white text-sm rounded-lg hover:bg-neutral-700 transition-all"
                    >
                      Create New
                    </button>
                  </div>

                  {/* Generated Script */}
                  {repurposedContent.generatedScript && (
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Generated Script</h4>
                      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                        <p className="text-neutral-300 text-sm whitespace-pre-wrap leading-relaxed">
                          {repurposedContent.generatedScript}
                        </p>
                      </div>
                      {repurposedContent.duration && (
                        <p className="mt-2 text-xs text-neutral-500">
                          Estimated Duration: {repurposedContent.duration}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Generated Caption */}
                  {repurposedContent.generatedCaption && (
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Generated Caption</h4>
                      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                        <p className="text-neutral-300 text-sm">{repurposedContent.generatedCaption}</p>
                      </div>
                    </div>
                  )}

                  {/* Suggested Hashtags */}
                  {repurposedContent.suggestedHashtags && repurposedContent.suggestedHashtags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Suggested Hashtags</h4>
                      <div className="flex flex-wrap gap-2">
                        {repurposedContent.suggestedHashtags.map((tag: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-neutral-900 text-neutral-300 text-sm rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Visual Suggestions */}
                  {repurposedContent.visualSuggestions && repurposedContent.visualSuggestions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2">Visual Suggestions</h4>
                      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 space-y-3">
                        {repurposedContent.visualSuggestions.map((suggestion: any, idx: number) => {
                          // Handle carousel slides (objects with slideHeadline and keyPoints)
                          if (typeof suggestion === 'object' && suggestion.slideHeadline) {
                            return (
                              <div key={idx} className="border-l-2 border-neutral-700 pl-3">
                                <p className="text-white font-medium text-sm mb-1">
                                  Slide {idx + 1}: {suggestion.slideHeadline}
                                </p>
                                {suggestion.keyPoints && (
                                  <ul className="list-disc list-inside text-neutral-400 text-xs space-y-0.5">
                                    {Array.isArray(suggestion.keyPoints) ? (
                                      suggestion.keyPoints.map((point: string, pIdx: number) => (
                                        <li key={pIdx}>{point}</li>
                                      ))
                                    ) : (
                                      <li>{String(suggestion.keyPoints)}</li>
                                    )}
                                  </ul>
                                )}
                              </div>
                            );
                          }

                          // Handle regular string suggestions
                          return (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-neutral-500 text-xs mt-0.5">{idx + 1}.</span>
                              <p className="text-neutral-300 text-sm flex-1">
                                {typeof suggestion === 'string' ? suggestion : JSON.stringify(suggestion)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-900 flex items-center justify-center">
                <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Repurposing History</h3>
              <p className="text-neutral-400 text-sm">
                View all previously generated repurposed content for this reel
              </p>
              <p className="text-neutral-500 text-xs mt-4">
                Coming soon
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

