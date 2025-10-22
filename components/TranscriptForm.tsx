'use client';

import { useState, FormEvent } from 'react';

interface TranscriptFormProps {
  onSubmit: (url: string) => void;
  loading: boolean;
}

export default function TranscriptForm({ onSubmit, loading }: TranscriptFormProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="flex flex-col gap-4">
        <label htmlFor="url" className="text-sm font-medium text-neutral-300">
          Instagram URL
        </label>
        <div className="flex gap-2">
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Profile (instagram.com/username) or Reel URL"
            className="flex-1 px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
            disabled={loading}
            required
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Processing...' : 'Analyze'}
          </button>
        </div>
        <p className="text-xs text-neutral-500">
          Paste a <span className="text-neutral-400 font-medium">profile URL</span> to get top 5 reels with transcripts, or a <span className="text-neutral-400 font-medium">reel/post URL</span> for single transcript
        </p>
      </div>
    </form>
  );
}
