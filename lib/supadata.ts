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
  // Check if API key is configured
  if (!API_KEY) {
    throw new Error('SUPADATA_API_KEY is not configured. Please add it to your .env.local file.');
  }

  const response = await fetch(`${SUPADATA_API_URL}?url=${encodeURIComponent(url)}`, {
    method: 'GET',
    headers: {
      'x-api-key': API_KEY,
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const errorData = await response.json();
      console.error('Supadata API error response:', errorData);

      // Handle specific error cases
      if (response.status === 401) {
        errorMessage = 'Invalid Supadata API key. Please check your SUPADATA_API_KEY in .env.local';
      } else if (response.status === 429) {
        errorMessage = 'Supadata API rate limit exceeded. Please try again later or upgrade your plan.';
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (parseError) {
      console.error('Failed to parse Supadata error response:', parseError);
      // Keep the default HTTP error message
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

export async function fetchJobStatus(
  jobId: string
): Promise<JobStatusResponse> {
  if (!API_KEY) {
    throw new Error('SUPADATA_API_KEY is not configured. Please add it to your .env.local file.');
  }

  const response = await fetch(`${SUPADATA_API_URL}/${jobId}`, {
    method: 'GET',
    headers: {
      'x-api-key': API_KEY,
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const errorData = await response.json();
      console.error('Supadata job status error:', errorData);

      if (response.status === 401) {
        errorMessage = 'Invalid Supadata API key. Please check your SUPADATA_API_KEY in .env.local';
      } else if (response.status === 429) {
        errorMessage = 'Supadata API rate limit exceeded. Please try again later.';
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (parseError) {
      console.error('Failed to parse Supadata error response:', parseError);
    }

    throw new Error(errorMessage);
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
