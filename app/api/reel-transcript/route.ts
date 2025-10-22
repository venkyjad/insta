import { NextRequest, NextResponse } from 'next/server';
import { fetchTranscript } from '@/lib/supadata';
import type { ErrorResponse, TranscriptResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reelUrl = searchParams.get('url');

    if (!reelUrl) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Reel URL parameter is required' },
        { status: 400 }
      );
    }

    // Fetch transcript for the specific reel
    const transcript = await fetchTranscript(reelUrl);

    return NextResponse.json<TranscriptResponse>(transcript, { status: 200 });
  } catch (error) {
    console.error('Reel transcript fetch error:', error);
    
    // Check if it's a rate limit error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isRateLimit = errorMessage.includes('Limit Exceeded') || errorMessage.includes('429');

    return NextResponse.json<ErrorResponse>(
      {
        error: isRateLimit 
          ? 'Supadata API rate limit exceeded. Please try again later or upgrade your plan.'
          : 'Failed to fetch transcript',
        message: errorMessage,
      },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}


