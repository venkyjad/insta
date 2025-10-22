'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import db from '@/lib/instant';
import Auth from '@/components/Auth';

export default function Home() {
  const router = useRouter();
  const { isLoading, user } = db.useAuth();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render if authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-6xl mx-auto text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 tracking-tight">
          Instagram Transcript Extractor
        </h1>
        <p className="text-neutral-400 text-xl mb-2">
          Extract transcripts from Instagram reels and posts instantly
        </p>
        <p className="text-neutral-500 text-sm">
          Analyze profiles • Get top performing reels • Extract transcripts
        </p>
      </div>

      <Auth />

      <footer className="mt-16 text-center text-neutral-500 text-sm">
        <p>Powered by Supadata API & Apify</p>
      </footer>
    </div>
  );
}
