'use client';

import { useState } from 'react';
import db from '@/lib/instant';
import ReelDetailView from './ReelDetailView';
import ProfileAnalyticsView from './ProfileAnalyticsView';
import type { ProfileTopReelsResponse, TranscriptResponse, InstagramReel, InstagramReelWithTranscript } from '@/lib/types';

interface TopReelsDisplayProps {
  data: ProfileTopReelsResponse;
}

export default function TopReelsDisplay({ data }: TopReelsDisplayProps) {
  const { user } = db.useAuth();
  const { data: savedReelsData } = db.useQuery({ savedReels: {} });
  const savedReels = savedReelsData?.savedReels || [];

  const [selectedReel, setSelectedReel] = useState<InstagramReel | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [loadingTranscripts, setLoadingTranscripts] = useState(false);
  const [reelsWithTranscripts, setReelsWithTranscripts] = useState<InstagramReelWithTranscript[]>([]);

  // Debug: Log thumbnail URLs
  console.log('Reels data:', data.topReels.map(r => ({ id: r.id, thumbnail: r.thumbnail })));

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleViewAnalytics = async () => {
    if (!user) return;

    setLoadingTranscripts(true);

    try {
      // Fetch transcripts for all top reels in parallel
      const reelsWithTranscriptsPromises = data.topReels.map(async (reel) => {
        try {
          const response = await fetch(`/api/reel-transcript?url=${encodeURIComponent(reel.url)}`);
          if (response.ok) {
            const transcript = await response.json();
            return { ...reel, transcript };
          }
        } catch (error) {
          console.error(`Failed to fetch transcript for reel ${reel.id}:`, error);
        }
        return reel;
      });

      const results = await Promise.all(reelsWithTranscriptsPromises);
      setReelsWithTranscripts(results);
      setShowAnalytics(true);
    } catch (error) {
      console.error('Error fetching transcripts:', error);
      // Show analytics anyway with whatever data we have
      setReelsWithTranscripts(data.topReels);
      setShowAnalytics(true);
    } finally {
      setLoadingTranscripts(false);
    }
  };

  if (showAnalytics && user) {
    return (
      <ProfileAnalyticsView
        username={data.username}
        topReels={reelsWithTranscripts}
        userId={user.id}
        profileUrl={data.profileUrl}
        onClose={() => setShowAnalytics(false)}
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mt-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Top 5 Reels from @{data.username}
          </h2>
          <p className="text-neutral-400 text-sm">
            Analyzed {data.totalReelsAnalyzed} reels • Sorted by: 1️⃣ Views, 2️⃣ Comments, 3️⃣ Likes
          </p>
        </div>
        <button
          onClick={handleViewAnalytics}
          disabled={loadingTranscripts}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loadingTranscripts ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              View Full Analytics
            </>
          )}
        </button>
      </div>

      {/* Split View Layout */}
      <div className="flex gap-4 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden" style={{ height: '70vh' }}>
        {/* Left Panel - Reels List */}
        <div className={`flex-shrink-0 border-r border-neutral-800 overflow-y-auto ${selectedReel ? 'w-80' : 'w-full'}`}>
          <div className="space-y-1 p-2">
            {data.topReels.map((reel, index) => {
              const thumbnailUrl = reel.thumbnail 
                ? `/api/image-proxy?url=${encodeURIComponent(reel.thumbnail)}`
                : null;
              const isSelected = selectedReel?.id === reel.id;

              return (
                <button
                  key={reel.id}
                  onClick={() => setSelectedReel(reel)}
                  className={`w-full p-3 rounded-lg transition-all text-left ${
                    isSelected 
                      ? 'bg-neutral-800 border border-neutral-700' 
                      : 'bg-neutral-950 hover:bg-neutral-900 border border-transparent'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Rank Badge */}
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-neutral-700 to-neutral-900 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-white">#{index + 1}</span>
                    </div>

                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                      {thumbnailUrl ? (
                        <div className="relative w-16 h-16 bg-neutral-950 rounded-lg overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumbnailUrl}
                            alt={`Reel ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-neutral-950 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Reel Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-300 line-clamp-2 mb-1">
                        {typeof reel.caption === 'string'
                          ? reel.caption
                          : (reel.caption ? JSON.stringify(reel.caption) : 'No caption')}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          {formatNumber(reel.viewsCount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                          </svg>
                          {formatNumber(reel.commentsCount)}
                        </span>
                      </div>
                    </div>

                    {/* View Button */}
                    <div className="flex-shrink-0">
                      <div className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 transition-all">
                        View
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Panel - Detail View */}
        {selectedReel ? (
          <div className="flex-1 overflow-hidden">
            <ReelDetailView 
              reel={selectedReel}
              username={data.username}
              onClose={() => setSelectedReel(null)}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-2">Select a Reel</h3>
              <p className="text-neutral-400 text-sm">
                Click on any reel from the list to view details
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
