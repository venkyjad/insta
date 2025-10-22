'use client';

import { useState } from 'react';
import db from '@/lib/instant';
import TranscriptTranslator from './TranscriptTranslator';

interface SavedReelDetailViewProps {
  reel: any;
  onClose: () => void;
  onDelete: (reelId: string) => void;
}

export default function SavedReelDetailView({ reel, onClose, onDelete }: SavedReelDetailViewProps) {
  const [isDeleting, setIsDeleting] = useState(false);

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
                {reel.caption || 'No caption'}
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
              {reel.hashtags && reel.hashtags.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-neutral-500 mb-1">Hashtags:</p>
                  <div className="flex flex-wrap gap-1">
                    {reel.hashtags.map((tag: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 bg-neutral-900 text-neutral-400 text-xs rounded">
                        #{tag}
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
      </div>
    </div>
  );
}


