import { NextRequest, NextResponse } from 'next/server';
import { fetchInstagramMetadata } from '@/lib/instagram-metadata';
import type { ErrorResponse, InstagramMetadata } from '@/lib/types';

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
        { error: 'Invalid Instagram URL format' },
        { status: 400 }
      );
    }

    const metadata = await fetchInstagramMetadata(url);

    return NextResponse.json<InstagramMetadata>(metadata, { status: 200 });
  } catch (error) {
    console.error('Instagram metadata fetch error:', error);
    return NextResponse.json<ErrorResponse>(
      {
        error: 'Failed to fetch Instagram metadata',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
