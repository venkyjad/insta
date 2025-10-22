'use client';

import { useState } from 'react';
import Link from 'next/link';
import db from '@/lib/instant';
import Auth from '@/components/Auth';

export default function Settings() {
  const { isLoading, user, error } = db.useAuth();
  const [supadataKey, setSupadataKey] = useState('');
  const [apifyKey, setApifyKey] = useState('');
  const [saved, setSaved] = useState(false);

  // Fetch user's saved API keys
  const { data: userData } = db.useQuery({
    users: {
      $: {
        where: {
          id: user?.id,
        },
      },
    },
  });

  const currentUser = userData?.users?.[0];

  const handleSave = async () => {
    if (!user) return;

    try {
      await db.transact([
        db.tx.users[user.id].update({
          supadataApiKey: supadataKey || currentUser?.supadataApiKey,
          apifyApiKey: apifyKey || currentUser?.apifyApiKey,
        }),
      ]);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving API keys:', err);
      alert('Failed to save API keys');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
        <Link
          href="/dashboard"
          className="mb-8 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          ← Back to home
        </Link>
        <Auth />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-neutral-400">Manage your API keys and preferences</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-all"
            >
              ← Back to Dashboard
            </Link>
            <button
              onClick={() => db.auth.signOut()}
              className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-all"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Account</h2>
          <div className="space-y-2 text-sm">
            <p className="text-neutral-400">Email:</p>
            <p className="text-white font-medium">{user.email}</p>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">API Keys</h2>
          <p className="text-sm text-neutral-400 mb-6">
            Store your own API keys to bypass rate limits. Your keys are encrypted and never shared.
          </p>

          <div className="space-y-6">
            <div>
              <label htmlFor="supadata" className="block text-sm font-medium text-neutral-300 mb-2">
                Supadata API Key
              </label>
              <input
                id="supadata"
                type="text"
                value={supadataKey}
                onChange={(e) => setSupadataKey(e.target.value)}
                placeholder={currentUser?.supadataApiKey ? '••••••••••••••••' : 'sd_...'}
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
              />
              <p className="mt-2 text-xs text-neutral-500">
                Get your key from{' '}
                <a
                  href="https://supadata.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-400 hover:text-white underline"
                >
                  supadata.ai
                </a>
              </p>
            </div>

            <div>
              <label htmlFor="apify" className="block text-sm font-medium text-neutral-300 mb-2">
                Apify API Key (Optional)
              </label>
              <input
                id="apify"
                type="text"
                value={apifyKey}
                onChange={(e) => setApifyKey(e.target.value)}
                placeholder={currentUser?.apifyApiKey ? '••••••••••••••••' : 'apify_api_...'}
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
              />
              <p className="mt-2 text-xs text-neutral-500">
                Get your key from{' '}
                <a
                  href="https://apify.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-400 hover:text-white underline"
                >
                  apify.com
                </a>
              </p>
            </div>

            <button
              onClick={handleSave}
              className="w-full px-4 py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-all"
            >
              {saved ? '✓ Saved!' : 'Save API Keys'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
