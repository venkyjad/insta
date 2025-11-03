'use client';

import { useState } from 'react';

interface AnalyzedProfile {
  id: string;
  username: string;
  profilePicture?: string;
  lastAnalyzedAt: number;
}

interface ProfileStoriesCarouselProps {
  profiles: AnalyzedProfile[];
  onProfileClick: (profileId: string, username: string) => void;
}

export default function ProfileStoriesCarousel({ profiles, onProfileClick }: ProfileStoriesCarouselProps) {
  const [hoveredProfile, setHoveredProfile] = useState<string | null>(null);

  if (profiles.length === 0) {
    return null;
  }

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <div className="w-full overflow-x-auto pb-4 mb-8">
      <div className="flex gap-4 min-w-max px-2">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            onClick={() => onProfileClick(profile.id, profile.username)}
            onMouseEnter={() => setHoveredProfile(profile.id)}
            onMouseLeave={() => setHoveredProfile(null)}
            className="flex flex-col items-center gap-2 group"
          >
            {/* Story Ring - Instagram style gradient border */}
            <div className="relative">
              {/* Gradient ring */}
              <div className={`w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[3px] transition-transform ${
                hoveredProfile === profile.id ? 'scale-110' : 'scale-100'
              }`}>
                {/* Inner white ring */}
                <div className="w-full h-full bg-black rounded-full p-[3px]">
                  {/* Profile picture or initials */}
                  {profile.profilePicture ? (
                    <div className="w-full h-full rounded-full overflow-hidden bg-neutral-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={profile.profilePicture}
                        alt={profile.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {getInitials(profile.username)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Verified-style checkmark badge */}
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full border-2 border-black flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Username and time */}
            <div className="flex flex-col items-center max-w-[84px]">
              <span className={`text-xs font-medium truncate w-full text-center transition-colors ${
                hoveredProfile === profile.id ? 'text-white' : 'text-neutral-300'
              }`}>
                @{profile.username}
              </span>
              <span className="text-[10px] text-neutral-500">
                {getTimeAgo(profile.lastAnalyzedAt)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
