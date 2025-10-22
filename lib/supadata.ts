import type {
  SupadataResponse,
  TranscriptResponse,
  AsyncJobResponse,
  JobStatusResponse,
} from './types';

const SUPADATA_API_URL = 'https://api.supadata.ai/v1/transcript';
const API_KEY = process.env.SUPADATA_API_KEY;

if (!API_KEY) {
  throw new Error('SUPADATA_API_KEY environment variable is not set');
}

export async function fetchTranscript(
  url: string
): Promise<SupadataResponse> {
  const response = await fetch(`${SUPADATA_API_URL}?url=${encodeURIComponent(url)}`, {
    method: 'GET',
    headers: {
      'x-api-key': API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

export async function fetchJobStatus(
  jobId: string
): Promise<JobStatusResponse> {
  const response = await fetch(`${SUPADATA_API_URL}/${jobId}`, {
    method: 'GET',
    headers: {
      'x-api-key': API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

export function isAsyncJob(response: SupadataResponse): response is AsyncJobResponse {
  return 'jobId' in response;
}

export function isTranscriptResponse(response: SupadataResponse): response is TranscriptResponse {
  return 'content' in response || 'chunks' in response;
}
