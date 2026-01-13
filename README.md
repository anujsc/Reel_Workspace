# ReelMind - AI-Powered Instagram Reel Knowledge Extraction Platform

## Project Overview

ReelMind is an intelligent knowledge management platform that transforms Instagram Reels into structured, searchable learning materials. Instead of passively watching short-form videos, users can extract, analyze, and organize valuable insights from Instagram Reels using advanced AI processing.

The platform automatically transcribes audio, extracts text from video frames (OCR), generates comprehensive summaries, creates learning materials (key points, examples, quizzes), and intelligently categorizes content into folders. Think of it as your personal AI-powered knowledge library for Instagram Reels.

**Who should use it:**
- Students and lifelong learners who consume educational content on Instagram
- Content creators researching trends and topics
- Professionals building knowledge bases from social media insights
- Anyone who wants to organize and revisit valuable information from Reels

## Key Features

- **One-Click Extraction**: Paste any Instagram Reel URL and let AI do the work
- **AI-Powered Transcription**: Multilingual audio transcription (supports Hindi, English, and mixed languages) using Google Gemini AI
- **Intelligent Summarization**: Comprehensive summaries with detailed explanations using Groq AI (Llama 3.3)
- **OCR Text Extraction**: Extracts visible text from video frames using Groq Vision AI
- **Learning Materials Generation**:
  - Key points and takeaways
  - Real-world examples and use cases
  - Actionable checklists
  - Interactive quiz questions with answers
  - Progressive learning paths
  - Common pitfalls and solutions
  - AI prompt suggestions for deeper exploration
- **Smart Organization**: Auto-categorization into folders with custom colors
- **Advanced Search**: Full-text search across titles, summaries, transcripts, and OCR text
- **Folder Management**: Create, rename, delete, and organize reels into custom collections
- **Folder Sharing**: Share entire folders with others via secure links
- **Interactive Chat**: Ask questions about your saved reels using AI
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile devices
- **Dark Mode**: Eye-friendly dark theme support

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Radix UI primitives (accessible, unstyled components)
- **Styling**: Tailwind CSS with custom design system
- **State Management**: 
  - React Query (TanStack Query) for server state
  - Zustand for client state
  - React Context for auth and theme
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **Animations**: Framer Motion (Motion) and GSAP
- **Icons**: Lucide React
- **Notifications**: Sonner (toast notifications)
- **HTTP Client**: Axios with interceptors

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken) + bcrypt password hashing
- **Validation**: express-validator
- **Security**: Helmet, CORS, rate limiting

### AI Services
- **Audio Transcription**: Google Gemini AI (gemini-2.5-flash)
- **Summarization**: Groq AI (llama-3.3-70b-versatile)
- **OCR**: Groq Vision AI (llama-4-scout-17b-16e-instruct)

### Media Processing
- **Video Download**: yt-dlp / Cobalt API
- **Audio Extraction**: FFmpeg (fluent-ffmpeg)
- **Media Storage**: Cloudinary (video and thumbnail hosting)
- **Web Scraping**: Puppeteer (browser automation)

### DevOps & Tools
- **Process Management**: Browser pool for Puppeteer instances
- **Cron Jobs**: node-cron for scheduled tasks
- **Development**: tsx (TypeScript execution), nodemon (hot reload)

## System Architecture

ReelMind follows a modern full-stack architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   React UI   │  │ React Query  │  │  Auth Context│     │
│  │  Components  │◄─┤  (API Cache) │◄─┤   (JWT)      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                                 │
│         └──────────────────┴─────────────────────────────┐  │
│                                                           │  │
└───────────────────────────────────────────────────────────┼──┘
                                                            │
                                    HTTP/REST API (Axios)  │
                                                            │
┌───────────────────────────────────────────────────────────┼──┐
│                         SERVER                            │  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │   Express    │  │ Controllers  │  │  Middleware  │   │  │
│  │   Routes     │─►│  (Business   │◄─┤  (Auth, Val) │◄──┘  │
│  └──────────────┘  │   Logic)     │  └──────────────┘      │
│                    └───────┬──────┘                         │
│                            │                                 │
│                    ┌───────▼──────┐                         │
│                    │   Services   │                         │
│                    │  (AI, Media) │                         │
│                    └───────┬──────┘                         │
│                            │                                 │
│                    ┌───────▼──────┐                         │
│                    │   Models     │                         │
│                    │  (Mongoose)  │                         │
│                    └───────┬──────┘                         │
└────────────────────────────┼────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │    MongoDB      │
                    │   (Database)    │
                    └─────────────────┘

External Services:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Gemini AI   │  │   Groq AI    │  │  Cloudinary  │
│ (Transcript) │  │  (Summary)   │  │   (Storage)  │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Data Flow:**
1. User pastes Instagram Reel URL in frontend
2. Frontend sends POST request to `/api/reel/extract`
3. Backend orchestrates extraction pipeline:
   - Fetches Instagram metadata
   - Downloads video using yt-dlp/Cobalt
   - Extracts audio with FFmpeg
   - Generates thumbnail
   - Transcribes audio with Gemini AI
   - Generates summary with Groq AI
   - Extracts OCR text with Groq Vision
   - Uploads media to Cloudinary
   - Auto-categorizes into folder
4. Saves structured data to MongoDB
5. Returns processed reel to frontend
6. Frontend displays reel in dashboard with all learning materials

## How It Works (Step-by-Step)

### User Input Flow
1. User logs in or registers an account
2. User pastes an Instagram Reel URL into the input field
3. System validates the URL format
4. User clicks "Extract" button

### Internal Processing Logic
1. **Duplicate Check**: System checks if URL already exists for this user
2. **Video Fetching**: Downloads video from Instagram using yt-dlp or Cobalt API
3. **Audio Extraction**: Extracts audio track from video using FFmpeg
4. **Thumbnail Generation**: Captures frame from video and uploads to Cloudinary
5. **AI Transcription**: 
   - Sends audio to Google Gemini AI
   - Receives multilingual transcript (supports Hindi/English)
6. **AI Summarization**:
   - Sends transcript to Groq AI (Llama 3.3)
   - Generates comprehensive summary with learning materials
   - Creates title, key points, examples, quiz questions, etc.
7. **OCR Processing**:
   - Extracts frames from video
   - Sends to Groq Vision AI
   - Extracts visible text from frames
8. **Auto-Categorization**:
   - AI suggests folder category based on content
   - Creates folder if it doesn't exist
   - Assigns reel to folder
9. **Database Storage**: Saves all extracted data to MongoDB
10. **Cleanup**: Removes temporary files

### Output Generation
1. Frontend receives processed reel data
2. Displays reel card in dashboard with:
   - Thumbnail preview
   - AI-generated title
   - Summary snippet
   - Tags and folder
   - Creation date
3. User can click to view full details:
   - Complete transcript
   - Detailed explanation
   - Learning materials (key points, examples, quizzes)
   - OCR text
   - Interactive chat interface

**Average Processing Time**: 10-20 seconds per reel

## Installation & Setup

### Prerequisites
- Node.js v18 or higher
- MongoDB (local or Atlas)
- FFmpeg (for audio extraction)
- yt-dlp (optional, for video download)
- API Keys:
  - Google Gemini API key
  - Groq API key
  - Cloudinary account

### Backend Setup

1. **Navigate to server directory**
```bash
cd Reel_Workspace/server
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create `.env` file in `Reel_Workspace/server/`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/reelworkspace
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/reelworkspace

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Cloudinary Configuration (Media Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AI Services
# Gemini API for audio transcription
GEMINI_API_KEY_TRANSCRIPT=your-gemini-api-key
GEMINI_TRANSCRIPTION_MODEL=gemini-2.5-flash

# Groq API for summarization and OCR
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct

# Video Download Service
COBALT_API_URL=https://api.cobalt.tools
USE_YTDLP=true

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173
```

4. **Install FFmpeg**

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH

5. **Install yt-dlp (optional)**
```bash
pip install yt-dlp
# or
brew install yt-dlp
```

6. **Start the server**

Development mode (with hot-reload):
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

Server will start on `http://localhost:5000`

### Frontend Setup

1. **Navigate to client directory**
```bash
cd Reel_Workspace/client
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create `.env` file in `Reel_Workspace/client/`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

4. **Start the development server**
```bash
npm run dev
```

Frontend will start on `http://localhost:5173`

5. **Build for production**
```bash
npm run build
```

### Verify Installation

1. Open browser and navigate to `http://localhost:5173`
2. Register a new account
3. Paste an Instagram Reel URL
4. Click "Extract" and wait for processing
5. View the extracted reel with all AI-generated content

## Folder Structure

```
Reel_Workspace/
├── client/                      # Frontend React application
│   ├── src/
│   │   ├── assets/             # Static assets (images, animations)
│   │   ├── components/         # React components
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── chat/          # Chat interface components
│   │   │   ├── modals/        # Modal dialogs
│   │   │   ├── tabs/          # Tab components
│   │   │   └── ui/            # Reusable UI components (Radix)
│   │   ├── context/           # React Context providers
│   │   │   ├── AuthContext.tsx    # Authentication state
│   │   │   └── ThemeContext.tsx   # Dark mode state
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useReels.ts        # Fetch reels
│   │   │   ├── useExtractReel.ts  # Extract reel
│   │   │   ├── useFolders.ts      # Folder management
│   │   │   └── useSearch.ts       # Search functionality
│   │   ├── pages/             # Page components
│   │   │   ├── Dashboard.tsx      # Main dashboard
│   │   │   ├── Login.tsx          # Login page
│   │   │   ├── Register.tsx       # Registration page
│   │   │   ├── ReelDetail.tsx     # Reel detail view
│   │   │   └── SearchResults.tsx  # Search results
│   │   ├── services/          # API services
│   │   │   └── api.ts            # Axios instance with interceptors
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Utility functions
│   ├── docs/                  # Documentation
│   └── package.json
│
├── server/                     # Backend Node.js application
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   │   ├── db.ts             # MongoDB connection
│   │   │   └── cloudinary.ts     # Cloudinary setup
│   │   ├── controllers/       # Request handlers
│   │   │   ├── auth.controller.ts    # Authentication
│   │   │   ├── reel.controller.ts    # Reel operations
│   │   │   ├── folder.controller.ts  # Folder management
│   │   │   ├── search.controller.ts  # Search functionality
│   │   │   ├── share.controller.ts   # Folder sharing
│   │   │   └── chat.controller.ts    # AI chat
│   │   ├── middleware/        # Express middleware
│   │   │   ├── auth.ts              # JWT authentication
│   │   │   ├── validation.ts        # Request validation
│   │   │   └── errorHandler.ts      # Error handling
│   │   ├── models/            # Mongoose schemas
│   │   │   ├── User.ts              # User model
│   │   │   ├── Reel.ts              # Reel model
│   │   │   ├── Folder.ts            # Folder model
│   │   │   └── FolderShare.ts       # Folder sharing model
│   │   ├── routes/            # API routes
│   │   │   ├── auth.routes.ts       # /api/auth
│   │   │   ├── reel.routes.ts       # /api/reel
│   │   │   ├── folder.routes.ts     # /api/folders
│   │   │   ├── search.routes.ts     # /api/search
│   │   │   ├── share.routes.ts      # /api/share
│   │   │   └── chat.routes.ts       # /api/chat
│   │   ├── services/          # Business logic
│   │   │   ├── reelProcessor.ts         # Main orchestrator
│   │   │   ├── aiTranscript.ts          # Gemini transcription
│   │   │   ├── aiSummary.ts             # Groq summarization
│   │   │   ├── aiOCR.ts                 # Groq Vision OCR
│   │   │   ├── videoDownloader.ts       # Video download
│   │   │   ├── audioExtractor.ts        # FFmpeg audio extraction
│   │   │   ├── thumbnailService.ts      # Thumbnail generation
│   │   │   ├── instagramFetcher.ts      # Instagram metadata
│   │   │   ├── puppeteerScraper.ts      # Web scraping
│   │   │   └── browserPool.ts           # Browser management
│   │   ├── utils/             # Helper functions
│   │   │   ├── errors.ts            # Custom error classes
│   │   │   ├── response.ts          # Response formatters
│   │   │   ├── jwt.ts               # JWT utilities
│   │   │   └── validators.ts        # Validation helpers
│   │   └── index.ts           # Application entry point
│   ├── docs/                  # API documentation
│   ├── temp/                  # Temporary files (auto-cleaned)
│   └── package.json
│
└── README.md                  # This file
```

## Configuration

### Environment Variables

#### Backend (`server/.env`)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 5000 |
| `NODE_ENV` | Environment (development/production) | No | development |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT signing | Yes | - |
| `JWT_EXPIRES_IN` | JWT expiration time | No | 7d |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes | - |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes | - |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes | - |
| `GEMINI_API_KEY_TRANSCRIPT` | Gemini API key for transcription | Yes | - |
| `GEMINI_TRANSCRIPTION_MODEL` | Gemini model name | No | gemini-2.5-flash |
| `GROQ_API_KEY` | Groq API key | Yes | - |
| `GROQ_MODEL` | Groq model for summarization | No | llama-3.3-70b-versatile |
| `GROQ_VISION_MODEL` | Groq vision model for OCR | No | meta-llama/llama-4-scout-17b-16e-instruct |
| `COBALT_API_URL` | Cobalt API URL | No | https://api.cobalt.tools |
| `USE_YTDLP` | Use yt-dlp for downloads | No | true |
| `CLIENT_URL` | Frontend URL (for CORS) | No | http://localhost:5173 |

#### Frontend (`client/.env`)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_BASE_URL` | Backend API URL | No | http://localhost:5000 |

### API Keys Setup

1. **Google Gemini API**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create new API key
   - Add to `GEMINI_API_KEY_TRANSCRIPT`

2. **Groq API**:
   - Visit [Groq Console](https://console.groq.com/)
   - Create account and generate API key
   - Add to `GROQ_API_KEY`

3. **Cloudinary**:
   - Visit [Cloudinary](https://cloudinary.com/)
   - Sign up for free account
   - Get cloud name, API key, and API secret from dashboard
   - Add to respective environment variables

## Usage

### Basic Workflow

1. **Register/Login**
   - Create account with email and password
   - Login to access dashboard

2. **Extract a Reel**
   - Copy Instagram Reel URL (e.g., `https://www.instagram.com/reel/ABC123/`)
   - Paste into input field on dashboard
   - Click "Extract" button
   - Wait 10-20 seconds for AI processing

3. **View Extracted Content**
   - Reel appears in dashboard with thumbnail and summary
   - Click reel card to view full details:
     - Complete transcript
     - Detailed explanation
     - Key points and examples
     - Actionable checklist
     - Quiz questions
     - Learning path
     - Common pitfalls
     - OCR text

4. **Organize with Folders**
   - Reels are auto-categorized into folders
   - Create custom folders with colors
   - Move reels between folders
   - Filter dashboard by folder

5. **Search Your Knowledge**
   - Use search bar to find reels
   - Searches across titles, summaries, transcripts, and OCR text
   - Filter by tags and folders

6. **Share Folders**
   - Share entire folders with others
   - Generate secure share links
   - Track views and analytics

7. **Chat with Your Reels**
   - Ask questions about saved reels
   - AI provides answers based on your knowledge base

### Example Flows

**Learning Flow:**
```
1. Find educational Reel on Instagram
2. Copy URL and paste into ReelMind
3. AI extracts and structures content
4. Review key points and examples
5. Take quiz to test understanding
6. Follow learning path for deeper knowledge
7. Use AI prompts to explore further
```

**Research Flow:**
```
1. Collect multiple Reels on a topic
2. Extract all into same folder
3. Use search to find specific information
4. Chat with AI to synthesize insights
5. Export or share findings with team
```

## Future Enhancements

- **Batch Extraction**: Process multiple Reels simultaneously
- **Browser Extension**: Extract Reels directly from Instagram
- **Export Options**: PDF, Markdown, Notion integration
- **Collaborative Workspaces**: Team folders and shared knowledge bases
- **Advanced Analytics**: Track learning progress and insights
- **Video Annotations**: Timestamp-based notes and highlights
- **Smart Recommendations**: AI-suggested related Reels
- **Spaced Repetition**: Quiz scheduling for better retention
- **Mobile Apps**: Native iOS and Android applications
- **API Access**: Public API for third-party integrations

## Contribution Guidelines

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**:
   - Follow TypeScript best practices
   - Add JSDoc comments for functions
   - Use consistent code formatting
   - Add validation for user inputs
4. **Test your changes**:
   - Ensure backend tests pass
   - Test frontend components
   - Verify API endpoints work correctly
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Code Style
- Use TypeScript for type safety
- Follow existing folder structure
- Use meaningful variable and function names
- Add error handling for all operations
- Update documentation for new features

## License

ISC

---

**Built with ❤️ using TypeScript, React, Express, MongoDB, and AI**

For questions, issues, or feature requests, please open an issue on the repository.
