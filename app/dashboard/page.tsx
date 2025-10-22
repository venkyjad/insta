'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import db from '@/lib/instant';
import TranscriptForm from '@/components/TranscriptForm';
import TranscriptDisplay from '@/components/TranscriptDisplay';
import TopReelsDisplay from '@/components/TopReelsDisplay';
import type { TranscriptResponse, AsyncJobResponse, ErrorResponse, InstagramMetadata, InstagramReel, ProfileTopReelsResponse } from '@/lib/types';

type ViewMode = 'single' | 'profile';

export default function Dashboard() {
  const router = useRouter();
  const { isLoading, user } = db.useAuth();
  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null);
  const [metadata, setMetadata] = useState<InstagramMetadata | null>(null);
  const [reelMetadata, setReelMetadata] = useState<InstagramReel | null>(null);
  const [profileData, setProfileData] = useState<ProfileTopReelsResponse | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [isLoading, user, router]);

  const isProfileUrl = (url: string): boolean => {
    return /instagram\.com\/[a-zA-Z0-9._]+\/?$/.test(url) &&
           !url.includes('/p/') &&
           !url.includes('/reel/');
  };

  const pollJobStatus = async (jobId: string): Promise<TranscriptResponse> => {
    const maxAttempts = 30;
    const pollInterval = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(`/api/transcript/${jobId}`);
      const data = await response.json();

      if (response.ok && (data.content || data.chunks)) {
        return data as TranscriptResponse;
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Transcript processing timed out. Please try again.');
  };

  const handleSubmit = async (url: string) => {
    setLoading(true);
    setError(null);
    setTranscript(null);
    setMetadata(null);
    setReelMetadata(null);
    setProfileData(null);

    try {
      if (isProfileUrl(url)) {
        setViewMode('profile');
        const response = await fetch(`/api/profile-top-reels?url=${encodeURIComponent(url)}`);
        const data = await response.json();

        if (!response.ok) {
          const errorData = data as ErrorResponse;
          throw new Error(errorData.message || errorData.error);
        }

        setProfileData(data as ProfileTopReelsResponse);
      } else {
        setViewMode('single');

        // Fetch both transcript and metadata (using Apify for full metadata)
        const [transcriptResponse, reelMetadataResponse] = await Promise.allSettled([
          fetch(`/api/transcript?url=${encodeURIComponent(url)}`),
          fetch(`/api/reel-metadata?url=${encodeURIComponent(url)}`),
        ]);

        if (transcriptResponse.status === 'fulfilled') {
          const response = transcriptResponse.value;
          const data = await response.json();

          if (!response.ok) {
            const errorData = data as ErrorResponse;
            throw new Error(errorData.message || errorData.error);
          }

          if (response.status === 202) {
            const asyncJob = data as AsyncJobResponse;
            const result = await pollJobStatus(asyncJob.jobId);
            setTranscript(result);
          } else {
            setTranscript(data as TranscriptResponse);
          }
        } else {
          throw transcriptResponse.reason;
        }

        // Use Apify-based reel metadata (includes likes, views, comments, hashtags, music)
        if (reelMetadataResponse.status === 'fulfilled') {
          const response = reelMetadataResponse.value;
          if (response.ok) {
            const data = await response.json();
            setReelMetadata(data as InstagramReel);
            // Also set basic metadata for backward compatibility
            setMetadata({
              url: data.url,
              username: data.username,
              thumbnail: data.thumbnail,
              title: data.caption,
            });
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-8">
      {/* Header */}
      <div className="w-full max-w-6xl mx-auto mb-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-400">{user.email}</span>
          <Link
            href="/saved"
            className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-all text-sm"
          >
            Saved Reels
          </Link>
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

      <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col">
        {/* Show form only when no results */}
        {!loading && !transcript && !profileData && !error && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-3 tracking-tight">
                Instagram Transcript Extractor
              </h1>
              <p className="text-neutral-400 text-lg">
                Extract transcripts from Instagram reels and posts instantly
              </p>
            </div>

            <TranscriptForm onSubmit={handleSubmit} loading={loading} />
          </div>
        )}

        {/* Compact header when results are shown */}
        {(transcript || profileData || loading || error) && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {viewMode === 'profile' ? 'Profile Analysis' : 'Transcript Result'}
                </h2>
                <p className="text-sm text-neutral-400">
                  {viewMode === 'profile' ? 'Top performing reels' : 'Single reel transcript'}
                </p>
              </div>
              <button
                onClick={() => {
                  setTranscript(null);
                  setProfileData(null);
                  setError(null);
                  setMetadata(null);
                }}
                className="px-4 py-2 bg-neutral-800 text-white text-sm rounded-lg hover:bg-neutral-700 transition-all"
              >
                New Analysis
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-2 border-neutral-700 border-t-white rounded-full animate-spin mb-4" />
            <p className="text-neutral-400 text-sm">
              {viewMode === 'profile' ? 'Analyzing profile and fetching top reels...' : 'Extracting transcript...'}
            </p>
          </div>
        )}

        {error && (
          <div className="w-full max-w-2xl mx-auto p-4 bg-red-950 border border-red-900 rounded-lg">
            <p className="text-red-200 text-sm">
              <span className="font-semibold">Error:</span> {error}
            </p>
          </div>
        )}

        {!loading && viewMode === 'single' && transcript && (
          <TranscriptDisplay
            transcript={transcript}
            metadata={metadata || undefined}
            reelMetadata={reelMetadata || undefined}
          />
        )}

        {!loading && viewMode === 'profile' && profileData && (
          <TopReelsDisplay data={profileData} />
        )}
      </main>

      <footer className="mt-auto pt-12 pb-6 text-center text-neutral-500 text-sm">
        <p>Powered by Supadata API & Apify</p>
      </footer>
    </div>
  );
}
