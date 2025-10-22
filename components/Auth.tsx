'use client';

import { useState } from 'react';
import db from '@/lib/instant';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    db.auth.sendMagicCode({ email }).catch((err) => {
      alert('Error sending magic code: ' + err.body?.message);
    });

    setSentEmail(email);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setIsVerifying(true);
    db.auth.signInWithMagicCode({ email: sentEmail, code }).catch((err) => {
      alert('Error verifying code: ' + err.body?.message);
      setIsVerifying(false);
    });
  };

  if (sentEmail) {
    return (
      <div className="w-full max-w-md p-8 bg-neutral-900 border border-neutral-800 rounded-lg">
        <h2 className="text-2xl font-bold text-white mb-4">Check your email</h2>
        <p className="text-neutral-300 mb-4">
          We sent a 6-digit code to <span className="font-semibold">{sentEmail}</span>
        </p>
        
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-neutral-300 mb-2">
              Enter code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all text-center text-2xl tracking-widest"
              required
              disabled={isVerifying}
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full px-4 py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? 'Verifying...' : 'Verify code'}
          </button>
        </form>

        <button
          onClick={() => {
            setSentEmail('');
            setCode('');
            setIsVerifying(false);
          }}
          className="mt-4 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          ← Try a different email
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 bg-neutral-900 border border-neutral-800 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-2">Sign in to continue</h2>
      <p className="text-neutral-400 mb-6">
        Save your API keys and transcript history
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full px-4 py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-all"
        >
          Send magic link
        </button>
      </form>

      <p className="mt-4 text-xs text-neutral-500 text-center">
        We'll send you a magic link to sign in. No password needed!
      </p>
    </div>
  );
}
