'use client';

import { useState } from 'react';
import Image from 'next/image';
import TranscriptTranslator from './TranscriptTranslator';
import type { TranscriptResponse, InstagramMetadata, InstagramReel } from '@/lib/types';

interface TranscriptDisplayProps {
  transcript: TranscriptResponse;
  metadata?: InstagramMetadata;
  reelMetadata?: InstagramReel;
}

export default function TranscriptDisplay({ transcript, metadata, reelMetadata }: TranscriptDisplayProps) {
  const [copied, setCopied] = useState(false);

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Safely extract text from transcript response
  const displayText = (() => {
    // Handle content as string
    if (transcript.content && typeof transcript.content === 'string') {
      return transcript.content;
    }

    // Handle content as array of chunks
    if (transcript.content && Array.isArray(transcript.content)) {
      return transcript.content.map(chunk => {
        if (chunk && typeof chunk.text === 'string') {
          return chunk.text;
        }
        return '';
      }).join(' ');
    }

    // Handle separate chunks array (legacy format)
    if (transcript.chunks && Array.isArray(transcript.chunks)) {
      return transcript.chunks.map(chunk => {
        if (chunk && typeof chunk.text === 'string') {
          return chunk.text;
        }
        return '';
      }).join(' ');
    }

    return '';
  })();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="w-full max-w-4xl mt-8">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        {/* Layout: Thumbnail on left, Content on right */}
        <div className="flex flex-col md:flex-row">
          {/* Left Side: Thumbnail */}
          <div className="md:w-72 flex-shrink-0 bg-black border-b md:border-b-0 md:border-r border-neutral-800">
            {metadata?.thumbnail ? (
              <div className="relative aspect-[3/4] md:aspect-square w-full">
                <Image
                  src={metadata.thumbnail}
                  alt="Instagram post thumbnail"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="aspect-[3/4] md:aspect-square w-full flex items-center justify-center bg-neutral-950">
                <div className="text-center p-4">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-lg bg-neutral-800 flex items-center justify-center">
                    <svg className="w-8 h-8 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-xs text-neutral-500">No thumbnail available</p>
                </div>
              </div>
            )}

            {/* Metadata Section */}
            <div className="p-4 border-t border-neutral-800 space-y-3">
              {metadata?.username ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">@</span>
                  <span className="text-sm text-white font-medium">{metadata.username}</span>
                </div>
              ) : (
                <div className="text-xs text-neutral-500">
                  <p>Username unavailable</p>
                </div>
              )}

              {/* Show Apify metadata if available */}
              {reelMetadata && (
                <div className="space-y-2">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center py-2">
                    <div>
                      <div className="text-white font-semibold">{formatNumber(reelMetadata.viewsCount)}</div>
                      <div className="text-[10px] text-neutral-500">Views</div>
                    </div>
                    <div>
                      <div className="text-white font-semibold">{formatNumber(reelMetadata.likesCount)}</div>
                      <div className="text-[10px] text-neutral-500">Likes</div>
                    </div>
                    <div>
                      <div className="text-white font-semibold">{formatNumber(reelMetadata.commentsCount)}</div>
                      <div className="text-[10px] text-neutral-500">Comments</div>
                    </div>
                  </div>

                  {/* Hashtags */}
                  {reelMetadata.hashtags && reelMetadata.hashtags.length > 0 && (
                    <div>
                      <p className="text-[10px] text-neutral-500 mb-1">Hashtags:</p>
                      <div className="flex flex-wrap gap-1">
                        {reelMetadata.hashtags.slice(0, 5).map((tag, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-neutral-900 text-neutral-400 text-[10px] rounded">
                            #{tag}
                          </span>
                        ))}
                        {reelMetadata.hashtags.length > 5 && (
                          <span className="text-[10px] text-neutral-500">+{reelMetadata.hashtags.length - 5} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Music */}
                  {reelMetadata.music_title && (
                    <div className="text-[11px] text-neutral-400">
                      <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                      </svg>
                      {reelMetadata.music_title}
                    </div>
                  )}

                  {/* Posted time */}
                  {reelMetadata.posted_time && (
                    <div className="text-[11px] text-neutral-500">
                      Posted: {new Date(reelMetadata.posted_time).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}

              {/* Show limitations warning only if no Apify metadata */}
              {!reelMetadata && (
                <div className="p-3 bg-neutral-950 border border-neutral-800 rounded text-xs text-neutral-400 space-y-2">
                  <p className="font-semibold text-neutral-300">ℹ️ Metadata Limitations</p>
                  <ul className="list-disc list-inside space-y-1 text-[11px]">
                    <li>Thumbnail: Instagram blocks public access</li>
                    <li>Likes/Views: Requires Instagram Graph API</li>
                    <li>Username: Limited availability</li>
                  </ul>
                  <p className="text-[11px] italic pt-1">
                    Consider using a paid Instagram API (RapidAPI, Apify) for full metadata
                  </p>
                </div>
              )}

              {transcript.lang && (
                <div className="flex items-center gap-2 text-xs pt-1">
                  <span className="text-neutral-500">Language:</span>
                  <span className="text-neutral-300">{transcript.lang}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Transcript */}
          <div className="flex-1 p-6 space-y-6">
            {/* Original Transcript */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Transcript</h2>
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-neutral-800 text-white text-sm rounded-md hover:bg-neutral-700 transition-all"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="bg-black border border-neutral-800 rounded-md p-4 max-h-96 overflow-y-auto">
                <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed text-sm">
                  {displayText || 'No transcript available'}
                </p>
              </div>

              {transcript.availableLangs && transcript.availableLangs.length > 0 && (
                <div className="mt-4 flex items-start gap-2 text-xs">
                  <span className="text-neutral-500">Available languages:</span>
                  <span className="text-neutral-300">{transcript.availableLangs.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Translation Section */}
            {displayText && (
              <div className="pt-6 border-t border-neutral-800">
                <TranscriptTranslator originalText={displayText} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
