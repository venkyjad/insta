import { NextRequest, NextResponse } from 'next/server';
import { fetchSingleReelMetadata } from '@/lib/apify-client';
import type { ErrorResponse, InstagramReel } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json<ErrorResponse>(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Validate Instagram URL
    const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/(reel|p)\/[A-Za-z0-9_-]+\/?/;
    if (!instagramRegex.test(url)) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Invalid Instagram URL format. Must be a reel or post URL.' },
        { status: 400 }
      );
    }

    // Fetch metadata using Apify
    const metadata = await fetchSingleReelMetadata(url);

    if (!metadata) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Could not fetch reel metadata. The reel may be private or unavailable.' },
        { status: 404 }
      );
    }

    return NextResponse.json<InstagramReel>(metadata, { status: 200 });
  } catch (error) {
    console.error('Reel metadata fetch error:', error);
    return NextResponse.json<ErrorResponse>(
      {
        error: 'Failed to fetch reel metadata',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
