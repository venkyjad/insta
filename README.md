# Instagram Reel Analyzer & Content Repurposer

A powerful Next.js application that helps content creators analyze Instagram reels and repurpose them for different platforms. Extract transcripts, analyze performance metrics, and generate platform-optimized content with AI assistance.

## Features

### 🎯 Core Features

- **Single Reel Analysis**: Analyze individual Instagram reels to extract:
  - Full transcript (audio-to-text)
  - Engagement metrics (views, likes, comments, shares)
  - Caption and hashtags
  - Thumbnail preview

- **Profile Analytics**: Analyze entire Instagram profiles to get:
  - Top-performing reels
  - Performance insights across multiple videos
  - Historical analysis tracking
  - Profile stories carousel for quick access

- **AI-Powered Content Repurposing**: Transform reels for different platforms:
  - **Target Platforms**: YouTube Shorts, TikTok, LinkedIn, Twitter/X, Instagram (different format)
  - **Content Goals**: Educational, entertaining, promotional, inspirational, storytelling
  - **Tone Options**: Professional, casual, humorous, serious, energetic
  - **Visual Formats**: Short-form video, carousel post, single image with text
  - Generate optimized scripts, captions, hashtags, and visual suggestions

- **Translation Support**: Translate transcripts to 20+ languages including:
  - Spanish, French, German, Italian, Portuguese
  - Hindi, Chinese, Japanese, Korean, Arabic
  - And many more

- **Saved Content Library**: Save and organize analyzed reels for later reference

### 🔒 Authentication

- Secure authentication powered by InstantDB
- User-specific content storage and management
- Session persistence

## Tech Stack

### Frontend
- **Next.js 15.5.6**: React framework with App Router
- **React 19.1.0**: UI library with latest features
- **TypeScript 5**: Type-safe development
- **Tailwind CSS 4**: Utility-first CSS framework
- **Turbopack**: Next-generation bundler for faster builds

### Backend & APIs
- **Next.js API Routes**: Serverless API endpoints
- **OpenAI API**: AI-powered content generation (GPT-4)
- **Apify Client**: Web scraping for Instagram data
- **InstantDB**: Real-time database with React integration

### Database
- **InstantDB (@instantdb/react)**: Real-time database for:
  - User authentication
  - Saved reels storage
  - Repurposed content tracking
  - Profile analytics history
  - Translation caching

### Development Tools
- **ESLint**: Code linting
- **TypeScript**: Static type checking
- **Cheerio**: HTML parsing

## Getting Started

### Prerequisites

1. **Node.js** (v18 or higher)
2. **OpenAI API Key**: Get one from [OpenAI Platform](https://platform.openai.com/api-keys)
3. **Apify API Token**: Sign up at [Apify](https://apify.com/)
4. **InstantDB App**: Create an app at [InstantDB](https://instantdb.com/)

### Installation

1. Clone the repository:
```bash
git clone git@github.com:venkyjad/insta.git
cd insta
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Create a `.env.local` file in the root directory:
```env
# OpenAI API Configuration
OPENAI_API_KEY=sk-...

# Apify Configuration
APIFY_API_TOKEN=apify_api_...

# InstantDB Configuration
NEXT_PUBLIC_INSTANT_APP_ID=your-instant-app-id
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Building for Production

```bash
npm run build
npm start
```

## Usage Guide

### Analyzing a Single Reel

1. Sign in to your account
2. Paste an Instagram reel URL (e.g., `https://www.instagram.com/reel/...`)
3. Wait for the analysis to complete
4. View transcript, metrics, and engagement data
5. Optionally save the reel for later

### Analyzing a Profile

1. Paste an Instagram profile URL (e.g., `https://www.instagram.com/username/`)
2. The app will analyze the top reels from that profile
3. View performance comparisons and insights
4. Access analyzed profiles from the carousel

### Repurposing Content

1. Open a saved reel or analyze a new one
2. Click "Repurpose Content"
3. Select your preferences:
   - Target platform
   - Content goal
   - Tone
   - Visual format
   - Target language (optional)
4. Generate AI-optimized content
5. Copy and use on your target platform

### Translating Content

1. View any reel with a transcript
2. Navigate to the translation section
3. Select your target language
4. View and copy the translated text

## Project Structure

```
instaScraper/
├── app/
│   ├── api/              # API routes
│   │   ├── profile-analytics/
│   │   ├── repurpose/
│   │   └── ...
│   ├── dashboard/        # Main dashboard page
│   └── page.tsx          # Landing page
├── components/           # React components
│   ├── ProfileAnalyticsView.tsx
│   ├── ProfileStoriesCarousel.tsx
│   ├── ReelDetailView.tsx
│   ├── SavedReelDetailView.tsx
│   ├── TopReelsDisplay.tsx
│   ├── TranscriptForm.tsx
│   ├── TranscriptDisplay.tsx
│   ├── TranscriptTranslator.tsx
│   └── RepurposingWizard.tsx
├── lib/
│   ├── instant.ts        # InstantDB configuration
│   ├── supadata.ts       # Supabase utilities
│   └── types.ts          # TypeScript type definitions
└── public/              # Static assets
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for content generation | Yes |
| `APIFY_API_TOKEN` | Apify token for Instagram scraping | Yes |
| `NEXT_PUBLIC_INSTANT_APP_ID` | InstantDB app ID | Yes |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Troubleshooting

### OpenAI API Errors

If you see "OpenAI API key not configured" or "Invalid OpenAI API key":
1. Check that `.env.local` exists in the root directory
2. Verify your API key is correct: `OPENAI_API_KEY=sk-...`
3. Restart the development server after adding environment variables

### Rate Limit Exceeded

If you encounter rate limits:
- Check your OpenAI billing at [OpenAI Billing Dashboard](https://platform.openai.com/account/billing)
- Consider upgrading your plan or waiting for the rate limit to reset

### Instagram Scraping Issues

If Instagram data fetching fails:
- Verify your Apify token is valid
- Check that the Instagram URL is publicly accessible
- Some profiles may have restrictions on data access

## License

This project is private and proprietary.

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Contact the maintainer

---

Built with ❤️ using Next.js, React, and AI
