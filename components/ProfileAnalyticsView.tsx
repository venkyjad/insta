'use client';

import { useState, useEffect } from 'react';
import type { ProfileAnalyticsResponse, InstagramReelWithTranscript } from '@/lib/types';

interface ProfileAnalyticsViewProps {
  username: string;
  topReels: InstagramReelWithTranscript[];
  userId: string;
  profileUrl: string;
  onClose: () => void;
}

export default function ProfileAnalyticsView({
  username,
  topReels,
  userId,
  profileUrl,
  onClose,
}: ProfileAnalyticsViewProps) {
  const [analytics, setAnalytics] = useState<ProfileAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'hashtags' | 'captions' | 'transcripts' | 'timing'>('overview');

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const response = await fetch('/api/profile-analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            profileUrl,
            topReels,
            userId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze profile');
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [username, topReels, userId, profileUrl]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-neutral-700 border-t-white rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-neutral-400">Analyzing profile...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-400 mb-4">{error || 'Failed to load analytics'}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">@{username} Analytics</h1>
              <p className="text-neutral-400">Analysis of top {analytics.totalReelsAnalyzed} reels</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-all"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
              <div className="text-neutral-400 text-sm mb-2">Avg Views</div>
              <div className="text-3xl font-bold text-white">{formatNumber(analytics.engagementMetrics.avgViews)}</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
              <div className="text-neutral-400 text-sm mb-2">Avg Likes</div>
              <div className="text-3xl font-bold text-white">{formatNumber(analytics.engagementMetrics.avgLikes)}</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
              <div className="text-neutral-400 text-sm mb-2">Avg Comments</div>
              <div className="text-3xl font-bold text-white">{formatNumber(analytics.engagementMetrics.avgComments)}</div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
              <div className="text-neutral-400 text-sm mb-2">Engagement Rate</div>
              <div className="text-3xl font-bold text-white">{analytics.engagementMetrics.engagementRate}%</div>
            </div>
          </div>

          {/* Insights & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-950 to-neutral-900 border border-blue-800 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-semibold text-white">Key Insights</h3>
              </div>
              <ul className="space-y-2">
                {analytics.insights.map((insight, i) => (
                  <li key={i} className="text-sm text-neutral-300 flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-950 to-neutral-900 border border-green-800 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-semibold text-white">Recommendations</h3>
              </div>
              <ul className="space-y-2">
                {analytics.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-neutral-300 flex items-start gap-2">
                    <span className="text-green-400 mt-1">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-neutral-800 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'hashtags', label: 'Hashtags', icon: '#️⃣' },
              { id: 'captions', label: 'Captions', icon: '💬' },
              { id: 'transcripts', label: 'Transcripts', icon: '🎤' },
              { id: 'timing', label: 'Best Times', icon: '⏰' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                  selectedTab === tab.id
                    ? 'text-white border-blue-500'
                    : 'text-neutral-400 border-transparent hover:text-neutral-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
            {selectedTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Top 5 Performing Reels</h3>
                  <div className="space-y-3">
                    {analytics.topReels.slice(0, 5).map((reel, idx) => (
                      <div key={reel.id} className="flex items-center gap-4 p-4 bg-neutral-950 rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">#{idx + 1}</span>
                        </div>
                        {reel.thumbnail && (
                          <div className="flex-shrink-0 w-16 h-16 bg-neutral-900 rounded-lg overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`/api/image-proxy?url=${encodeURIComponent(reel.thumbnail)}`} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-neutral-300 line-clamp-2">{reel.caption || 'No caption'}</p>
                        </div>
                        <div className="flex gap-4 text-xs text-neutral-400">
                          <span>{formatNumber(reel.viewsCount || 0)} views</span>
                          <span>{formatNumber(reel.likesCount || 0)} likes</span>
                          <span>{formatNumber(reel.commentsCount || 0)} comments</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'hashtags' && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Hashtag Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analytics.hashtagAnalysis.slice(0, 10).map((hashtag, idx) => (
                    <div key={hashtag.hashtag} className="p-4 bg-neutral-950 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-semibold text-blue-400">#{hashtag.hashtag}</span>
                        <span className="text-xs text-neutral-500">Used {hashtag.frequency}x</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-neutral-500">Avg Views</div>
                          <div className="text-white font-medium">{formatNumber(hashtag.avgViews)}</div>
                        </div>
                        <div>
                          <div className="text-neutral-500">Avg Likes</div>
                          <div className="text-white font-medium">{formatNumber(hashtag.avgLikes)}</div>
                        </div>
                        <div>
                          <div className="text-neutral-500">Avg Comments</div>
                          <div className="text-white font-medium">{formatNumber(hashtag.avgComments)}</div>
                        </div>
                      </div>
                      <div className="mt-3 w-full bg-neutral-800 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                          style={{ width: `${Math.min((hashtag.engagementRate / analytics.hashtagAnalysis[0].engagementRate) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'captions' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-neutral-950 rounded-lg">
                    <div className="text-neutral-400 text-sm mb-2">Caption Style</div>
                    <div className="text-2xl font-bold text-white capitalize">{analytics.captionAnalysis.captionStyle}</div>
                  </div>
                  <div className="p-4 bg-neutral-950 rounded-lg">
                    <div className="text-neutral-400 text-sm mb-2">Avg Word Count</div>
                    <div className="text-2xl font-bold text-white">{analytics.captionAnalysis.avgWordCount}</div>
                  </div>
                  <div className="p-4 bg-neutral-950 rounded-lg">
                    <div className="text-neutral-400 text-sm mb-2">Avg Length</div>
                    <div className="text-2xl font-bold text-white">{analytics.captionAnalysis.avgLength} chars</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-neutral-950 rounded-lg">
                    <div className="text-neutral-400 text-sm mb-2">Emoji Usage</div>
                    <div className="text-2xl font-bold text-white">{analytics.captionAnalysis.emojiUsage}%</div>
                  </div>
                  <div className="p-4 bg-neutral-950 rounded-lg">
                    <div className="text-neutral-400 text-sm mb-2">Question Usage</div>
                    <div className="text-2xl font-bold text-white">{analytics.captionAnalysis.questionUsage}%</div>
                  </div>
                  <div className="p-4 bg-neutral-950 rounded-lg">
                    <div className="text-neutral-400 text-sm mb-2">CTA Usage</div>
                    <div className="text-2xl font-bold text-white">{analytics.captionAnalysis.callToActionUsage}%</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Top Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {analytics.captionAnalysis.topKeywords.map(keyword => (
                      <span key={keyword} className="px-3 py-1 bg-neutral-950 text-neutral-300 text-sm rounded-full">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'transcripts' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-neutral-950 rounded-lg">
                    <div className="text-neutral-400 text-sm mb-2">Speaking Pace</div>
                    <div className="text-2xl font-bold text-white capitalize">{analytics.transcriptAnalysis.paceStyle}</div>
                  </div>
                  <div className="p-4 bg-neutral-950 rounded-lg">
                    <div className="text-neutral-400 text-sm mb-2">Avg Length</div>
                    <div className="text-2xl font-bold text-white">{analytics.transcriptAnalysis.avgLength} chars</div>
                  </div>
                  <div className="p-4 bg-neutral-950 rounded-lg">
                    <div className="text-neutral-400 text-sm mb-2">Sentiment Score</div>
                    <div className={`text-2xl font-bold ${analytics.transcriptAnalysis.sentimentScore > 0 ? 'text-green-400' : analytics.transcriptAnalysis.sentimentScore < 0 ? 'text-red-400' : 'text-white'}`}>
                      {analytics.transcriptAnalysis.sentimentScore > 0 ? '+' : ''}{analytics.transcriptAnalysis.sentimentScore}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Key Phrases</h4>
                  <div className="flex flex-wrap gap-2">
                    {analytics.transcriptAnalysis.keyPhrases.map(phrase => (
                      <span key={phrase} className="px-3 py-1 bg-neutral-950 text-neutral-300 text-sm rounded-full">
                        {phrase}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Top Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {analytics.transcriptAnalysis.topTopics.map(topic => (
                      <span key={topic} className="px-4 py-2 bg-gradient-to-r from-purple-900 to-blue-900 text-white text-sm rounded-lg font-medium">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'timing' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-gradient-to-br from-purple-950 to-neutral-950 rounded-lg border border-purple-800">
                    <h4 className="text-lg font-semibold text-white mb-4">Best Day to Post</h4>
                    <div className="text-4xl font-bold text-purple-400 mb-2">
                      {getDayName(analytics.postTimeAnalysis.bestDayOfWeek)}
                    </div>
                    <p className="text-sm text-neutral-400">Highest engagement on this day</p>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-orange-950 to-neutral-950 rounded-lg border border-orange-800">
                    <h4 className="text-lg font-semibold text-white mb-4">Best Time to Post</h4>
                    <div className="text-4xl font-bold text-orange-400 mb-2">
                      {analytics.postTimeAnalysis.bestHour > 12
                        ? `${analytics.postTimeAnalysis.bestHour - 12}:00 PM`
                        : analytics.postTimeAnalysis.bestHour === 12
                        ? '12:00 PM'
                        : `${analytics.postTimeAnalysis.bestHour}:00 AM`}
                    </div>
                    <p className="text-sm text-neutral-400">Peak engagement hour</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Engagement by Day of Week</h4>
                  <div className="space-y-2">
                    {Object.entries(analytics.postTimeAnalysis.avgEngagementByDay)
                      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                      .map(([day, engagement]) => {
                        const maxEngagement = Math.max(...Object.values(analytics.postTimeAnalysis.avgEngagementByDay));
                        const percentage = (engagement / maxEngagement) * 100;
                        return (
                          <div key={day} className="flex items-center gap-4">
                            <div className="w-24 text-sm text-neutral-400">{getDayName(parseInt(day))}</div>
                            <div className="flex-1 bg-neutral-950 rounded-full h-8 relative overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full flex items-center justify-end pr-3"
                                style={{ width: `${percentage}%` }}
                              >
                                <span className="text-xs text-white font-medium">{formatNumber(engagement)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {Object.keys(analytics.postTimeAnalysis.avgEngagementByHour).length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Engagement by Hour</h4>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {Object.entries(analytics.postTimeAnalysis.avgEngagementByHour)
                        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                        .map(([hour, engagement]) => {
                          const maxEngagement = Math.max(...Object.values(analytics.postTimeAnalysis.avgEngagementByHour));
                          const intensity = (engagement / maxEngagement);
                          return (
                            <div
                              key={hour}
                              className="p-3 rounded-lg text-center"
                              style={{
                                backgroundColor: `rgba(59, 130, 246, ${intensity * 0.8 + 0.2})`,
                              }}
                            >
                              <div className="text-xs text-white font-medium mb-1">
                                {parseInt(hour) > 12 ? `${parseInt(hour) - 12}PM` : parseInt(hour) === 12 ? '12PM' : `${hour}AM`}
                              </div>
                              <div className="text-[10px] text-blue-100">{formatNumber(engagement)}</div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
