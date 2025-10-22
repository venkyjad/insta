import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL parameter is required' },
        { status: 400 }
      );
    }

    // Fetch the image with proper headers
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.instagram.com/',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
      },
    });

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: imageResponse.status }
      );
    }

    // Get the image data
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    );
  }
}


