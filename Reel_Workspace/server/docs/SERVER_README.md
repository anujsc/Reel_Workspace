# Reel Workspace API

Backend API for AI-powered Instagram Reel processing and workspace management.

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **AI Processing**: Google Gemini API
- **Media Storage**: Cloudinary
- **Video Download**: Cobalt API

## Features

- 🔐 User authentication and authorization
- 📹 Instagram Reel download and processing
- 🤖 AI-powered transcription using Google Gemini
- 📝 Automatic summarization
- 🔍 OCR (Optical Character Recognition) for text in videos
- ☁️ Cloud storage with Cloudinary
- 📊 Workspace management

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd reel-workspace
```

### 2. Navigate to Server Directory

```bash
cd server
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Copy the example environment file:

```bash
copy .env.example .env
```

Fill in the required environment variables in `.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_string
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GEMINI_API_KEY=your_gemini_api_key
COBALT_API_URL=https://api.cobalt.tools
```

### 5. Run Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### 6. Build for Production

```bash
npm run build
npm start
```

## External Services Required

### MongoDB Atlas (Database)

- **Tier**: Free M0 cluster (512 MB storage)
- **Sign up**: https://www.mongodb.com/cloud/atlas/register
- **Setup**: Create a cluster, get connection string, whitelist your IP

### Cloudinary (Media Storage)

- **Tier**: Free tier (25 GB storage, 25 GB bandwidth/month)
- **Sign up**: https://cloudinary.com/users/register/free
- **Setup**: Get cloud name, API key, and API secret from dashboard

### Google Gemini API (AI Processing)

- **Tier**: Free tier (60 requests per minute)
- **Sign up**: https://makersuite.google.com/app/apikey
- **Setup**: Create API key from Google AI Studio

### Cobalt API (Video Download)

- **Tier**: Public instance (free)
- **Documentation**: https://github.com/wukko/cobalt
- **Setup**: Use public instance at https://api.cobalt.tools (no signup required)

## Project Structure

```
/server
├── /src
│   ├── /config          # Configuration files (database, etc.)
│   ├── /controllers     # Request handlers
│   ├── /routes          # API route definitions
│   ├── /services        # Business logic and external API calls
│   ├── /middleware      # Express middleware (auth, validation)
│   ├── /models          # Mongoose schemas
│   ├── /utils           # Helper functions
│   └── index.ts         # Application entry point
├── /dist                # Compiled JavaScript (generated)
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production server

## API Endpoints

### Health Check

- `GET /api/health` - Check server status

More endpoints will be added in subsequent phases.

## Development Guidelines

- Use TypeScript for all new code
- Follow ES6+ syntax with import/export
- Use async/await for asynchronous operations
- Add JSDoc comments to exported functions
- Handle errors properly with try-catch blocks
- Validate all user inputs
- Use environment variables for sensitive data

## Next Steps

- Phase 1: Implement authentication and user management
- Phase 2: Build reel processing pipeline
- Phase 3: Integrate AI services (Gemini)
- Phase 4: Add workspace management features

## Support

For issues and questions, please create an issue in the repository.
