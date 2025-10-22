'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import db from '@/lib/instant';
import SavedReelDetailView from '@/components/SavedReelDetailView';

export default function SavedReels() {
  const router = useRouter();
  const { isLoading, user } = db.useAuth();
  const { data: savedReelsData } = db.useQuery({ savedReels: {} });
  const savedReels = savedReelsData?.savedReels || [];
  const [selectedReel, setSelectedReel] = useState<any | null>(null);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [isLoading, user, router]);

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleDelete = async (reelId: string) => {
    try {
      await db.transact([
        db.tx.savedReels[reelId].delete(),
      ]);
    } catch (error) {
      console.error('Error deleting reel:', error);
    }
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // Sort by most recently saved
  const sortedReels = [...savedReels].sort((a: any, b: any) => b.createdAt - a.createdAt);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-8">
      {/* Header */}
      <div className="w-full max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-white mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h2 className="text-2xl font-bold">Saved Reels</h2>
          <p className="text-sm text-neutral-400 mt-1">
            {sortedReels.length} {sortedReels.length === 1 ? 'reel' : 'reels'} saved
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-400">{user.email}</span>
          <Link
            href="/settings"
            className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-all text-sm"
          >
            Settings
          </Link>
          <button
            onClick={() => db.auth.signOut()}
            className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-all text-sm"
          >
            Sign out
          </button>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto">
        {sortedReels.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-neutral-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <h3 className="text-xl font-semibold text-neutral-300 mb-2">No saved reels yet</h3>
            <p className="text-neutral-500 mb-6">
              Save reels from profile analysis to view them here
            </p>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-all inline-block"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="flex gap-4 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden" style={{ height: '75vh' }}>
            {/* Left Panel - Saved Reels List */}
            <div className={`flex-shrink-0 border-r border-neutral-800 overflow-y-auto ${selectedReel ? 'w-80' : 'w-full'}`}>
              <div className="space-y-1 p-2">
                {sortedReels.map((reel: any) => {
                  const isSelected = selectedReel?.id === reel.id;
                  const thumbnailUrl = reel.thumbnail 
                    ? `/api/image-proxy?url=${encodeURIComponent(reel.thumbnail)}`
                    : null;

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
                        {/* Thumbnail */}
                        <div className="flex-shrink-0">
                          {thumbnailUrl ? (
                            <div className="relative w-16 h-16 bg-neutral-950 rounded-lg overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={thumbnailUrl}
                                alt="Reel thumbnail"
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
                            {reel.caption || 'No caption'}
                          </p>
                          {reel.username && (
                            <p className="text-xs text-neutral-500 mb-2">
                              @{reel.username}
                            </p>
                          )}
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
                <SavedReelDetailView 
                  reel={selectedReel}
                  onClose={() => setSelectedReel(null)}
                  onDelete={handleDelete}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
                    <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold mb-2">Select a Reel</h3>
                  <p className="text-neutral-400 text-sm">
                    Click on any saved reel to view details and transcript
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="mt-auto pt-12 pb-6 text-center text-neutral-500 text-sm">
        <p>Powered by Supadata API & Apify</p>
      </footer>
    </div>
  );
}
