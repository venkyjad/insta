import { NextRequest, NextResponse } from 'next/server';
import type {
  ProfileAnalyticsResponse,
  InstagramReelWithTranscript,
  HashtagAnalysis,
  CaptionAnalysis,
  TranscriptAnalysis,
  PostTimeAnalysis,
  EngagementMetrics,
  ErrorResponse,
} from '@/lib/types';

/**
 * Analyzes hashtag performance across all reels
 */
function analyzeHashtags(reels: InstagramReelWithTranscript[]): HashtagAnalysis[] {
  const hashtagMap = new Map<string, {
    count: number;
    totalLikes: number;
    totalViews: number;
    totalComments: number;
    totalEngagement: number;
  }>();

  reels.forEach((reel) => {
    const hashtags = reel.hashtags || [];
    const likes = reel.likesCount || 0;
    const views = reel.viewsCount || 0;
    const comments = reel.commentsCount || 0;
    const engagement = likes + views + comments;

    hashtags.forEach((tag) => {
      const existing = hashtagMap.get(tag) || {
        count: 0,
        totalLikes: 0,
        totalViews: 0,
        totalComments: 0,
        totalEngagement: 0,
      };

      hashtagMap.set(tag, {
        count: existing.count + 1,
        totalLikes: existing.totalLikes + likes,
        totalViews: existing.totalViews + views,
        totalComments: existing.totalComments + comments,
        totalEngagement: existing.totalEngagement + engagement,
      });
    });
  });

  const analysis: HashtagAnalysis[] = [];
  hashtagMap.forEach((data, hashtag) => {
    analysis.push({
      hashtag,
      frequency: data.count,
      avgLikes: Math.round(data.totalLikes / data.count),
      avgViews: Math.round(data.totalViews / data.count),
      avgComments: Math.round(data.totalComments / data.count),
      engagementRate: Math.round(data.totalEngagement / data.count),
    });
  });

  // Sort by engagement rate
  return analysis.sort((a, b) => b.engagementRate - a.engagementRate).slice(0, 20);
}

/**
 * Analyzes caption patterns and content
 */
function analyzeCaptions(reels: InstagramReelWithTranscript[]): CaptionAnalysis {
  const captions = reels.map(r => r.caption || '').filter(c => c.length > 0);

  if (captions.length === 0) {
    return {
      avgLength: 0,
      avgWordCount: 0,
      topKeywords: [],
      captionStyle: 'short',
      emojiUsage: 0,
      questionUsage: 0,
      callToActionUsage: 0,
    };
  }

  const totalLength = captions.reduce((sum, c) => sum + c.length, 0);
  const totalWords = captions.reduce((sum, c) => sum + c.split(/\s+/).length, 0);
  const avgLength = Math.round(totalLength / captions.length);
  const avgWordCount = Math.round(totalWords / captions.length);

  // Extract keywords (excluding hashtags and common words)
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);

  const wordFreq = new Map<string, number>();
  captions.forEach(caption => {
    const words = caption.toLowerCase()
      .replace(/#\w+/g, '') // Remove hashtags
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(w => w.length > 3 && !commonWords.has(w));

    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
  });

  const topKeywords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);

  // Analyze patterns
  const emojiCount = captions.reduce((sum, c) => {
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    return sum + (c.match(emojiRegex)?.length || 0);
  }, 0);

  const questionCount = captions.filter(c => c.includes('?')).length;
  const ctaWords = ['link', 'bio', 'comment', 'follow', 'subscribe', 'click', 'check', 'visit', 'shop', 'buy'];
  const ctaCount = captions.filter(c =>
    ctaWords.some(word => c.toLowerCase().includes(word))
  ).length;

  let captionStyle: 'short' | 'medium' | 'long' = 'short';
  if (avgLength > 500) captionStyle = 'long';
  else if (avgLength > 150) captionStyle = 'medium';

  return {
    avgLength,
    avgWordCount,
    topKeywords,
    captionStyle,
    emojiUsage: Math.round((emojiCount / captions.length) * 100),
    questionUsage: Math.round((questionCount / captions.length) * 100),
    callToActionUsage: Math.round((ctaCount / captions.length) * 100),
  };
}

/**
 * Analyzes transcript content
 */
function analyzeTranscripts(reels: InstagramReelWithTranscript[]): TranscriptAnalysis {
  const transcripts = reels
    .map(r => {
      if (!r.transcript) return '';
      const content = r.transcript.content;
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) {
        return content.map(chunk => chunk.text).join(' ');
      }
      return '';
    })
    .filter(t => t.length > 0);

  if (transcripts.length === 0) {
    return {
      avgLength: 0,
      topTopics: [],
      sentimentScore: 0,
      paceStyle: 'medium',
      keyPhrases: [],
    };
  }

  const totalLength = transcripts.reduce((sum, t) => sum + t.length, 0);
  const avgLength = Math.round(totalLength / transcripts.length);

  // Extract key phrases (simple bigram/trigram extraction)
  const phraseFreq = new Map<string, number>();
  transcripts.forEach(transcript => {
    const words = transcript.toLowerCase().split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (bigram.length > 5) {
        phraseFreq.set(bigram, (phraseFreq.get(bigram) || 0) + 1);
      }
    }
  });

  const keyPhrases = Array.from(phraseFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase]) => phrase);

  // Simple sentiment analysis (count positive vs negative words)
  const positiveWords = ['good', 'great', 'awesome', 'amazing', 'love', 'best', 'happy', 'excellent', 'perfect', 'wonderful'];
  const negativeWords = ['bad', 'worst', 'hate', 'terrible', 'awful', 'poor', 'sad', 'angry', 'frustrated', 'disappointed'];

  let positiveCount = 0;
  let negativeCount = 0;
  transcripts.forEach(t => {
    const lower = t.toLowerCase();
    positiveWords.forEach(w => {
      positiveCount += (lower.match(new RegExp(w, 'g')) || []).length;
    });
    negativeWords.forEach(w => {
      negativeCount += (lower.match(new RegExp(w, 'g')) || []).length;
    });
  });

  const sentimentScore = positiveCount + negativeCount > 0
    ? (positiveCount - negativeCount) / (positiveCount + negativeCount)
    : 0;

  // Estimate pace by words per second (assuming average reel is 30-60 seconds)
  const avgWordsPerTranscript = transcripts.reduce((sum, t) => sum + t.split(/\s+/).length, 0) / transcripts.length;
  const avgWordsPerSecond = avgWordsPerTranscript / 45; // Assume 45 second average

  let paceStyle: 'fast' | 'medium' | 'slow' = 'medium';
  if (avgWordsPerSecond > 3) paceStyle = 'fast';
  else if (avgWordsPerSecond < 2) paceStyle = 'slow';

  return {
    avgLength,
    topTopics: keyPhrases.slice(0, 5),
    sentimentScore: parseFloat(sentimentScore.toFixed(2)),
    paceStyle,
    keyPhrases: keyPhrases.slice(0, 8),
  };
}

/**
 * Analyzes best posting times
 */
function analyzePostTimes(reels: InstagramReelWithTranscript[]): PostTimeAnalysis {
  const reelsWithTime = reels.filter(r => r.posted_time || r.timestamp);

  if (reelsWithTime.length === 0) {
    return {
      bestHour: 12,
      bestDayOfWeek: 3,
      avgEngagementByHour: {},
      avgEngagementByDay: {},
    };
  }

  const engagementByHour: Record<number, { total: number; count: number }> = {};
  const engagementByDay: Record<number, { total: number; count: number }> = {};

  reelsWithTime.forEach(reel => {
    const timestamp = reel.posted_time || reel.timestamp;
    if (!timestamp) return;

    const date = new Date(timestamp);
    const hour = date.getHours();
    const day = date.getDay();
    const engagement = (reel.likesCount || 0) + (reel.viewsCount || 0) + (reel.commentsCount || 0);

    if (!engagementByHour[hour]) engagementByHour[hour] = { total: 0, count: 0 };
    engagementByHour[hour].total += engagement;
    engagementByHour[hour].count += 1;

    if (!engagementByDay[day]) engagementByDay[day] = { total: 0, count: 0 };
    engagementByDay[day].total += engagement;
    engagementByDay[day].count += 1;
  });

  const avgEngagementByHour: Record<number, number> = {};
  Object.entries(engagementByHour).forEach(([hour, data]) => {
    avgEngagementByHour[parseInt(hour)] = Math.round(data.total / data.count);
  });

  const avgEngagementByDay: Record<number, number> = {};
  Object.entries(engagementByDay).forEach(([day, data]) => {
    avgEngagementByDay[parseInt(day)] = Math.round(data.total / data.count);
  });

  const bestHour = parseInt(
    Object.entries(avgEngagementByHour).sort((a, b) => b[1] - a[1])[0]?.[0] || '12'
  );

  const bestDayOfWeek = parseInt(
    Object.entries(avgEngagementByDay).sort((a, b) => b[1] - a[1])[0]?.[0] || '3'
  );

  return {
    bestHour,
    bestDayOfWeek,
    avgEngagementByHour,
    avgEngagementByDay,
  };
}

/**
 * Calculates engagement metrics
 */
function calculateEngagementMetrics(reels: InstagramReelWithTranscript[]): EngagementMetrics {
  if (reels.length === 0) {
    return {
      avgLikes: 0,
      avgViews: 0,
      avgComments: 0,
      totalEngagement: 0,
      engagementRate: 0,
      bestPerformingReel: '',
      worstPerformingReel: '',
    };
  }

  const totalLikes = reels.reduce((sum, r) => sum + (r.likesCount || 0), 0);
  const totalViews = reels.reduce((sum, r) => sum + (r.viewsCount || 0), 0);
  const totalComments = reels.reduce((sum, r) => sum + (r.commentsCount || 0), 0);
  const totalEngagement = totalLikes + totalViews + totalComments;

  const reelsWithEngagement = reels.map(r => ({
    id: r.id,
    engagement: (r.likesCount || 0) + (r.viewsCount || 0) + (r.commentsCount || 0),
  }));

  reelsWithEngagement.sort((a, b) => b.engagement - a.engagement);

  return {
    avgLikes: Math.round(totalLikes / reels.length),
    avgViews: Math.round(totalViews / reels.length),
    avgComments: Math.round(totalComments / reels.length),
    totalEngagement,
    engagementRate: totalViews > 0 ? parseFloat(((totalLikes + totalComments) / totalViews * 100).toFixed(2)) : 0,
    bestPerformingReel: reelsWithEngagement[0]?.id || '',
    worstPerformingReel: reelsWithEngagement[reelsWithEngagement.length - 1]?.id || '',
  };
}

/**
 * Generates insights and recommendations based on analytics
 */
function generateInsights(
  hashtagAnalysis: HashtagAnalysis[],
  captionAnalysis: CaptionAnalysis,
  transcriptAnalysis: TranscriptAnalysis,
  postTimeAnalysis: PostTimeAnalysis,
  engagementMetrics: EngagementMetrics
): { insights: string[]; recommendations: string[] } {
  const insights: string[] = [];
  const recommendations: string[] = [];

  // Hashtag insights
  if (hashtagAnalysis.length > 0) {
    const topHashtag = hashtagAnalysis[0];
    insights.push(`Your best performing hashtag is #${topHashtag.hashtag} with an average of ${topHashtag.engagementRate.toLocaleString()} engagement per post`);

    if (hashtagAnalysis.length >= 3) {
      recommendations.push(`Focus on these high-performing hashtags: ${hashtagAnalysis.slice(0, 3).map(h => `#${h.hashtag}`).join(', ')}`);
    }
  }

  // Caption insights
  insights.push(`Your captions average ${captionAnalysis.avgWordCount} words with ${captionAnalysis.captionStyle} style`);

  if (captionAnalysis.callToActionUsage < 30) {
    recommendations.push('Consider adding more calls-to-action in your captions to drive engagement');
  }

  if (captionAnalysis.questionUsage < 20) {
    recommendations.push('Try asking more questions in your captions to boost comments');
  }

  // Transcript insights
  if (transcriptAnalysis.sentimentScore > 0.3) {
    insights.push('Your content has a positive tone, which resonates well with audiences');
  } else if (transcriptAnalysis.sentimentScore < -0.3) {
    insights.push('Your content has a more serious or critical tone');
  }

  insights.push(`Your speaking pace is ${transcriptAnalysis.paceStyle}, which ${transcriptAnalysis.paceStyle === 'fast' ? 'keeps viewers engaged' : transcriptAnalysis.paceStyle === 'slow' ? 'allows for better comprehension' : 'maintains good balance'}`);

  // Post time insights
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hourFormat = postTimeAnalysis.bestHour > 12
    ? `${postTimeAnalysis.bestHour - 12}PM`
    : postTimeAnalysis.bestHour === 12 ? '12PM' : `${postTimeAnalysis.bestHour}AM`;

  insights.push(`Your best posting time is ${dayNames[postTimeAnalysis.bestDayOfWeek]}s at ${hourFormat}`);
  recommendations.push(`Schedule your posts on ${dayNames[postTimeAnalysis.bestDayOfWeek]}s around ${hourFormat} for maximum reach`);

  // Engagement insights
  insights.push(`Your average engagement rate is ${engagementMetrics.engagementRate}%`);

  if (engagementMetrics.engagementRate < 3) {
    recommendations.push('Try experimenting with trending audio and more dynamic hooks in the first 3 seconds');
  } else if (engagementMetrics.engagementRate > 5) {
    insights.push('Your engagement rate is excellent! Keep up the great content');
  }

  return { insights, recommendations };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, profileUrl, topReels, userId } = body;

    if (!username || !topReels || !userId) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Perform all analyses
    const hashtagAnalysis = analyzeHashtags(topReels);
    const captionAnalysis = analyzeCaptions(topReels);
    const transcriptAnalysis = analyzeTranscripts(topReels);
    const postTimeAnalysis = analyzePostTimes(topReels);
    const engagementMetrics = calculateEngagementMetrics(topReels);

    const { insights, recommendations } = generateInsights(
      hashtagAnalysis,
      captionAnalysis,
      transcriptAnalysis,
      postTimeAnalysis,
      engagementMetrics
    );

    const response: ProfileAnalyticsResponse = {
      userId,
      username,
      profileUrl,
      totalReelsAnalyzed: topReels.length,
      topReels,
      hashtagAnalysis,
      captionAnalysis,
      transcriptAnalysis,
      postTimeAnalysis,
      engagementMetrics,
      lastAnalyzedAt: Date.now(),
      insights,
      recommendations,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Profile analytics error:', error);
    return NextResponse.json<ErrorResponse>(
      {
        error: 'Failed to analyze profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
