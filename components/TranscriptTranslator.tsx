'use client';

import { useState } from 'react';

interface TranscriptTranslatorProps {
  originalText: string;
  onTranslate?: (translatedText: string, language: string) => void;
  preloadedTranslations?: Record<string, string>;
}

const LANGUAGES = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
];

export default function TranscriptTranslator({ originalText, onTranslate, preloadedTranslations }: TranscriptTranslatorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translationCache, setTranslationCache] = useState<Record<string, string>>(preloadedTranslations || {});

  const handleTranslate = async (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setError(null);

    // Check cache first
    if (translationCache[languageCode]) {
      setTranslatedText(translationCache[languageCode]);
      return;
    }

    setIsTranslating(true);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: originalText,
          targetLanguage: languageCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Translation failed');
      }

      // Cache the translation
      setTranslationCache(prev => ({
        ...prev,
        [languageCode]: data.translatedText,
      }));

      setTranslatedText(data.translatedText);
      if (onTranslate) {
        onTranslate(data.translatedText, languageCode);
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translatedText);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClear = () => {
    setTranslatedText('');
    setSelectedLanguage('');
    setError(null);
  };

  return (
    <div className="space-y-3">
      {/* Language Selection */}
      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-2">
          Translate to:
        </label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => {
            const isCached = !!translationCache[lang.code];
            return (
              <button
                key={lang.code}
                onClick={() => handleTranslate(lang.code)}
                disabled={isTranslating}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 relative ${
                  selectedLanguage === lang.code
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
                {isCached && (
                  <span className="text-green-400" title="Translation cached">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading State */}
      {isTranslating && (
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <div className="w-4 h-4 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
          <span>Translating...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-3 bg-red-950 border border-red-900 rounded-lg">
          <p className="text-red-300 text-xs">{error}</p>
        </div>
      )}

      {/* Translated Text */}
      {translatedText && !isTranslating && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-neutral-400">
              Translation ({LANGUAGES.find(l => l.code === selectedLanguage)?.name}):
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="px-2 py-1 bg-neutral-800 text-white text-xs rounded hover:bg-neutral-700 transition-all"
              >
                Copy
              </button>
              <button
                onClick={handleClear}
                className="px-2 py-1 bg-neutral-800 text-white text-xs rounded hover:bg-neutral-700 transition-all"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 max-h-60 overflow-y-auto">
            <p className="text-neutral-300 text-sm whitespace-pre-wrap leading-relaxed">
              {translatedText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

