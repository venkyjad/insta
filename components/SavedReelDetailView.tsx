'use client';

import { useState } from 'react';
import db from '@/lib/instant';
import TranscriptTranslator from './TranscriptTranslator';
import RepurposingWizard from './RepurposingWizard';
import type { RepurposingFormData } from '@/lib/types';

interface SavedReelDetailViewProps {
  reel: any;
  onClose: () => void;
  onDelete: (reelId: string) => void;
}

type Tab = 'details' | 'repurpose';

export default function SavedReelDetailView({ reel, onClose, onDelete }: SavedReelDetailViewProps) {
  const { user } = db.useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [showRepurposeWizard, setShowRepurposeWizard] = useState(false);
  const [isRepurposing, setIsRepurposing] = useState(false);
  const [repurposedContent, setRepurposedContent] = useState<any>(null);
  const [repurposingError, setRepurposingError] = useState<string | null>(null);

  const thumbnailUrl = reel.thumbnail 
    ? `/api/image-proxy?url=${encodeURIComponent(reel.thumbnail)}`
    : null;

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const copyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(reel.transcript);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(reel.id);
    setIsDeleting(false);
    onClose();
  };

  const handleRepurpose = async (formData: RepurposingFormData) => {
    if (!user) {
      setRepurposingError('Please sign in to repurpose content');
      return;
    }

    setIsRepurposing(true);
    setRepurposingError(null);

    try {
      const response = await fetch('/api/repurpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          originalTranscript: reel.transcript,
          originalCaption: typeof reel.caption === 'string' ? reel.caption : '',
          originalHashtags: Array.isArray(reel.hashtags) ? reel.hashtags.filter((tag: any) => typeof tag === 'string') : [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to generate content: ${response.status}`);
      }

      const data = await response.json();
      setRepurposedContent(data);

      // Save to database
      const newRepurposedContent = {
        id: crypto.randomUUID(),
        userId: user.id,
        originalReelId: reel.reelId || reel.id,
        goal: formData.goal,
        targetPlatform: formData.targetPlatform,
        tone: formData.tone,
        visualPreference: formData.visualPreference,
        generatedScript: data.script,
        generatedCaption: data.caption,
        suggestedHashtags: data.hashtags,
        visualSuggestions: data.visualSuggestions,
        thumbnailIdeas: data.thumbnailIdeas,
        bRollSuggestions: data.bRollSuggestions,
        carouselSlides: data.carouselSlides,
        duration: data.duration,
        targetLanguage: formData.targetLanguage,
        createdAt: Date.now(),
      };

      await db.transact([
        db.tx.repurposedContent[newRepurposedContent.id].update(newRepurposedContent),
      ]);

      setShowRepurposeWizard(false);
    } catch (error: any) {
      console.error('Repurposing error:', error);
      setRepurposingError(error.message || 'Failed to generate repurposed content');
    } finally {
      setIsRepurposing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-neutral-800 bg-neutral-900">
        <div className="p-4 flex items-center justify-between">
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
              <h3 className="text-white font-semibold">Saved Reel</h3>
              {reel.username && (
                <p className="text-xs text-neutral-400">@{reel.username}</p>
              )}
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
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-900 text-white text-sm rounded-lg hover:bg-red-800 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-neutral-800">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'details'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-neutral-400 hover:text-neutral-300'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('repurpose')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'repurpose'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-neutral-400 hover:text-neutral-300'
            }`}
            disabled={!reel.transcript}
            title={!reel.transcript ? 'Transcript required for repurposing' : ''}
          >
            Repurpose {!reel.transcript && '(No Transcript)'}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'details' ? (
          <>
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
              <p className="text-xs text-neutral-600">
                {reel.posted_time && (
                  <span className="mr-3">Posted: {new Date(reel.posted_time).toLocaleDateString()}</span>
                )}
                Saved: {new Date(reel.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Transcript Section */}
        <div className="p-6 space-y-6">
          {reel.transcript && (
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
                  {reel.transcript}
                </p>
              </div>
              {reel.transcriptLang && (
                <p className="mt-2 text-xs text-neutral-500">
                  Language: {reel.transcriptLang}
                </p>
              )}
            </div>
          )}

          {/* Translation Section */}
          {reel.transcript && (
            <div className="pt-6 border-t border-neutral-800">
              <TranscriptTranslator
                originalText={reel.transcript}
                preloadedTranslations={reel.translations || {}}
              />
            </div>
          )}
        </div>
          </>
        ) : activeTab === 'repurpose' ? (
          <div className="p-6">
            {!reel.transcript ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold mb-2">No Transcript Available</h3>
                <p className="text-neutral-400 text-sm">
                  This reel doesn't have a transcript. Transcripts are required for repurposing content.
                </p>
              </div>
            ) : showRepurposeWizard ? (
              <RepurposingWizard
                originalTranscript={reel.transcript}
                originalCaption={typeof reel.caption === 'string' ? reel.caption : ''}
                originalHashtags={Array.isArray(reel.hashtags) ? reel.hashtags.filter((tag: any) => typeof tag === 'string') : []}
                onGenerate={handleRepurpose}
                onCancel={() => {
                  setShowRepurposeWizard(false);
                  setRepurposingError(null);
                }}
                isLoading={isRepurposing}
              />
            ) : repurposedContent ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Repurposed Content</h3>
                  <button
                    onClick={() => {
                      setRepurposedContent(null);
                      setShowRepurposeWizard(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 transition-all"
                  >
                    Create New
                  </button>
                </div>

                {/* Generated Script */}
                {repurposedContent.script && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-semibold">Generated Script</h4>
                      <button
                        onClick={() => navigator.clipboard.writeText(repurposedContent.script)}
                        className="px-3 py-1 bg-neutral-800 text-white text-xs rounded hover:bg-neutral-700 transition-all"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                      <p className="text-neutral-300 text-sm whitespace-pre-wrap leading-relaxed">
                        {repurposedContent.script}
                      </p>
                    </div>
                  </div>
                )}

                {/* Generated Caption */}
                {repurposedContent.caption && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-semibold">Caption</h4>
                      <button
                        onClick={() => navigator.clipboard.writeText(repurposedContent.caption)}
                        className="px-3 py-1 bg-neutral-800 text-white text-xs rounded hover:bg-neutral-700 transition-all"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                      <p className="text-neutral-300 text-sm whitespace-pre-wrap leading-relaxed">
                        {repurposedContent.caption}
                      </p>
                    </div>
                  </div>
                )}

                {/* Hashtags */}
                {repurposedContent.hashtags && repurposedContent.hashtags.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-semibold">Suggested Hashtags</h4>
                      <button
                        onClick={() => navigator.clipboard.writeText(repurposedContent.hashtags.map((tag: string) => `#${tag}`).join(' '))}
                        className="px-3 py-1 bg-neutral-800 text-white text-xs rounded hover:bg-neutral-700 transition-all"
                      >
                        Copy All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {repurposedContent.hashtags.map((tag: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-blue-900/30 text-blue-300 text-sm rounded-lg border border-blue-800">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visual Suggestions */}
                {repurposedContent.visualSuggestions && repurposedContent.visualSuggestions.length > 0 && (
                  <div>
                    <h4 className="text-white font-semibold mb-3">Visual Suggestions</h4>
                    <div className="space-y-3">
                      {repurposedContent.visualSuggestions.map((suggestion: any, idx: number) => {
                        // Handle carousel objects
                        if (typeof suggestion === 'object' && suggestion.slideHeadline) {
                          return (
                            <div key={idx} className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                              <p className="text-white font-medium mb-2">Slide {idx + 1}: {suggestion.slideHeadline}</p>
                              {suggestion.keyPoints && suggestion.keyPoints.length > 0 && (
                                <ul className="list-disc list-inside text-neutral-300 text-sm space-y-1">
                                  {suggestion.keyPoints.map((point: string, pointIdx: number) => (
                                    <li key={pointIdx}>{point}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        }
                        // Handle string suggestions
                        return (
                          <div key={idx} className="bg-neutral-950 border border-neutral-800 rounded-lg p-4">
                            <p className="text-neutral-300 text-sm">
                              {typeof suggestion === 'string' ? suggestion : JSON.stringify(suggestion)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Duration */}
                {repurposedContent.duration && (
                  <div>
                    <h4 className="text-white font-semibold mb-2">Recommended Duration</h4>
                    <p className="text-neutral-300 text-sm">{repurposedContent.duration}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="text-white font-semibold mb-2">Repurpose This Reel</h3>
                <p className="text-neutral-400 text-sm mb-6">
                  Transform this content for different platforms, tones, and formats
                </p>
                {repurposingError && (
                  <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-300 text-sm">
                    {repurposingError}
                  </div>
                )}
                <button
                  onClick={() => setShowRepurposeWizard(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all"
                >
                  Start Repurposing
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}


