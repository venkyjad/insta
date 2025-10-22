import { NextRequest, NextResponse } from 'next/server';
import { fetchJobStatus } from '@/lib/supadata';
import type { ErrorResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const response = await fetchJobStatus(jobId);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Job status fetch error:', error);
    return NextResponse.json<ErrorResponse>(
      {
        error: 'Failed to fetch job status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
