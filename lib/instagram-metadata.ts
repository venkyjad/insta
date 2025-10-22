import type { InstagramMetadata } from './types';

/**
 * Fetches Instagram post metadata using Instagram's oEmbed API
 * Note: Instagram blocks direct scraping, so we use their public oEmbed endpoint
 * Likes/views require authenticated Graph API access (not publicly available)
 */
export async function fetchInstagramMetadata(url: string): Promise<InstagramMetadata> {
  try {
    // Extract post ID from URL
    const postId = extractInstagramId(url);
    if (!postId) {
      throw new Error('Invalid Instagram URL format');
    }

    // Try Instagram's oEmbed endpoint (still works for some basic data)
    // Note: This endpoint is being deprecated but may still return some data
    const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`;

    try {
      const response = await fetch(oembedUrl);

      if (response.ok) {
        const data = await response.json();

        return {
          url,
          thumbnail: data.thumbnail_url,
          username: data.author_name,
          title: data.title,
          description: undefined,
        };
      }
    } catch (oembedError) {
      console.log('oEmbed failed, using fallback');
    }

    // Fallback: Construct thumbnail URL using post ID
    // Instagram thumbnails often follow patterns, but this may not always work
    const fallbackThumbnail = `https://instagram.com/p/${postId}/media/?size=l`;

    return {
      url,
      thumbnail: fallbackThumbnail,
      username: undefined,
      title: undefined,
      description: undefined,
    };
  } catch (error) {
    console.error('Error fetching Instagram metadata:', error);
    // Return minimal metadata on error
    return {
      url,
      thumbnail: undefined,
      username: undefined,
      title: undefined,
      description: undefined,
    };
  }
}

/**
 * Extracts the Instagram post/reel ID from URL
 */
export function extractInstagramId(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}
