import { NextRequest, NextResponse } from 'next/server';
import { fetchTranscript, isAsyncJob, isTranscriptResponse } from '@/lib/supadata';
import type { ErrorResponse } from '@/lib/types';

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

    // Validate Instagram URL (supports both /reel/ and /p/ formats)
    const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/(reel|p)\/[A-Za-z0-9_-]+\/?/;
    if (!instagramRegex.test(url)) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Invalid Instagram URL format. Please provide a valid Instagram reel or post URL.' },
        { status: 400 }
      );
    }

    const response = await fetchTranscript(url);

    // Check if response is an async job
    if (isAsyncJob(response)) {
      return NextResponse.json(response, { status: 202 });
    }

    // Return immediate transcript response
    if (isTranscriptResponse(response)) {
      return NextResponse.json(response, { status: 200 });
    }

    return NextResponse.json<ErrorResponse>(
      { error: 'Unexpected response format' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Transcript fetch error:', error);
    return NextResponse.json<ErrorResponse>(
      {
        error: 'Failed to fetch transcript',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
