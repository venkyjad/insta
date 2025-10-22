import { ApifyClient } from 'apify-client';
import type { InstagramReel } from './types';

const APIFY_API_KEY = process.env.APIFY_API_KEY;

if (!APIFY_API_KEY) {
  throw new Error('APIFY_API_KEY environment variable is not set');
}

const client = new ApifyClient({
  token: APIFY_API_KEY,
});

/**
 * Extracts hashtags from caption text
 */
function extractHashtags(caption?: string): string[] {
  if (!caption) return [];
  const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
  const matches = caption.match(hashtagRegex);
  return matches ? matches.map(tag => tag.slice(1)) : []; // Remove # prefix
}

/**
 * Fetches reels from an Instagram profile using Apify Instagram Profile Scraper
 * Returns reels sorted by engagement (likes + comments + views)
 */
export async function fetchProfileReels(username: string): Promise<InstagramReel[]> {
  try {
    // Run the Instagram Profile Scraper actor
    const run = await client.actor('apify/instagram-profile-scraper').call({
      usernames: [username],
      resultsLimit: 50, // Get up to 50 recent posts to analyze
    });

    // Fetch results from the dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    console.log('Apify returned items:', JSON.stringify(items, null, 2));

    // Extract reels from the results
    const reels: InstagramReel[] = [];

    for (const item of items) {
      console.log('Processing item:', item);

      // Check if this is the profile data or individual posts
      if (item.latestPosts && Array.isArray(item.latestPosts)) {
        for (const post of item.latestPosts) {
          console.log('Post data:', post);

          // Only include reels (video posts)
          if (post.type === 'Video' || post.type === 'Reel' || post.displayUrl?.includes('video')) {
            const reelUrl = post.url || `https://instagram.com/reel/${post.shortCode}`;
            const caption = post.caption || post.text;
            const postedTime = post.timestamp || post.takenAt || post.created;

            reels.push({
              id: post.id || post.shortCode,
              url: reelUrl,
              caption: caption,
              thumbnail: post.displayUrl || post.thumbnailUrl || post.thumbnail,
              likesCount: post.likesCount || post.likes,
              viewsCount: post.videoViewCount || post.playsCount || post.viewCount,
              commentsCount: post.commentsCount || post.comments,
              timestamp: postedTime,
              posted_time: postedTime, // Duplicate field for explicit naming
              videoUrl: post.videoUrl || post.video,
              hashtags: extractHashtags(caption),
              music_title: post.musicInfo?.name || post.audioName || post.musicName || post.originalAudioTitle,
            });
          }
        }
      }
    }

    // Sort by engagement score (likes + views + comments * 2)
    // Comments weighted higher as they indicate stronger engagement
    reels.sort((a, b) => {
      const scoreA = (a.likesCount || 0) + (a.viewsCount || 0) + (a.commentsCount || 0) * 2;
      const scoreB = (b.likesCount || 0) + (b.viewsCount || 0) + (b.commentsCount || 0) * 2;
      return scoreB - scoreA;
    });

    return reels;
  } catch (error) {
    console.error('Error fetching profile reels from Apify:', error);
    throw new Error(`Failed to fetch reels from profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetches metadata for a single Instagram reel/post using Apify
 * This provides full metadata including likes, views, comments, music, etc.
 */
export async function fetchSingleReelMetadata(reelUrl: string): Promise<InstagramReel | null> {
  try {
    console.log('Fetching single reel metadata from Apify:', reelUrl);

    // Run the Instagram Post Scraper actor
    // Using the same profile scraper but with directUrls parameter
    const run = await client.actor('apify/instagram-post-scraper').call({
      directUrls: [reelUrl],
      resultsLimit: 1,
    });

    // Fetch results from the dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    console.log('Apify single reel result:', JSON.stringify(items, null, 2));

    if (items.length === 0) {
      console.warn('No reel data returned from Apify');
      return null;
    }

    const post = items[0];
    const caption = post.caption || post.text;
    const postedTime = post.timestamp || post.takenAt || post.created;

    return {
      id: post.id || post.shortCode,
      url: reelUrl,
      caption: caption,
      thumbnail: post.displayUrl || post.thumbnailUrl || post.thumbnail,
      likesCount: post.likesCount || post.likes,
      viewsCount: post.videoViewCount || post.playsCount || post.viewCount,
      commentsCount: post.commentsCount || post.comments,
      timestamp: postedTime,
      posted_time: postedTime,
      videoUrl: post.videoUrl || post.video,
      hashtags: extractHashtags(caption),
      music_title: post.musicInfo?.name || post.audioName || post.musicName || post.originalAudioTitle,
    };
  } catch (error) {
    console.error('Error fetching single reel metadata from Apify:', error);
    throw new Error(`Failed to fetch reel metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extracts username from Instagram profile URL
 */
export function extractUsername(url: string): string | null {
  const match = url.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
  return match ? match[1] : null;
}
