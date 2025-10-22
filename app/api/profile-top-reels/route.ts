import { NextRequest, NextResponse } from 'next/server';
import { fetchProfileReels, extractUsername } from '@/lib/apify-client';
import type { ErrorResponse, ProfileTopReelsResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const profileUrl = searchParams.get('url');

    if (!profileUrl) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Profile URL parameter is required' },
        { status: 400 }
      );
    }

    // Extract username from URL
    const username = extractUsername(profileUrl);
    if (!username) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Invalid Instagram profile URL' },
        { status: 400 }
      );
    }

    // Fetch all reels from the profile (already sorted by engagement)
    const allReels = await fetchProfileReels(username);

    if (allReels.length === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: 'No reels found for this profile' },
        { status: 404 }
      );
    }

    // Get top 5 reels
    const topReels = allReels.slice(0, 5);

    // Don't fetch transcripts initially - they'll be fetched on demand
    const response: ProfileTopReelsResponse = {
      username,
      profileUrl,
      topReels: topReels,
      totalReelsAnalyzed: allReels.length,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Profile top reels fetch error:', error);
    return NextResponse.json<ErrorResponse>(
      {
        error: 'Failed to fetch profile top reels',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
