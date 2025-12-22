# Reel Workspace API - Backend Server

AI-powered Instagram Reel knowledge extraction and organization platform. Extract, analyze, and organize Instagram Reels with comprehensive AI-generated summaries, transcripts, learning materials, and smart categorization.

## 🚀 Features

- **User Authentication**: Secure JWT-based authentication with bcrypt password hashing
- **Reel Extraction**: Automated Instagram reel download and processing
- **AI-Powered Analysis**:
  - Audio transcription (Gemini AI)
  - Comprehensive summaries (Groq AI)
  - OCR text extraction from video frames (Groq Vision)
  - Auto-categorization and tagging
  - Learning materials generation (key points, examples, quiz questions, etc.)
- **Folder Management**: Organize reels into custom folders with colors
- **Advanced Search**: Full-text search across summaries, transcripts, and OCR text
- **Smart Filtering**: Filter by folder, tags, and date range
- **Media Storage**: Cloudinary integration for video and thumbnail hosting
- **Comprehensive Validation**: Request validation with detailed error messages
- **Error Handling**: Centralized error handling with consistent response format

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **AI Services**:
  - Gemini AI (audio transcription)
  - Groq AI (summarization and OCR)
- **Media Processing**:
  - FFmpeg (audio extraction)
  - yt-dlp / Cobalt API (video download)
  - Cloudinary (media storage)
- **Validation**: express-validator
- **Security**: Helmet, CORS

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- FFmpeg (for audio extraction)
- yt-dlp (optional, for video download)

## 🔧 Installation

1. **Clone the repository**

```bash
cd Reel_Workspace/server
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the server directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/reelworkspace
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/reelworkspace

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Cloudinary Configuration (Media Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AI Services
# Gemini API for audio transcription
GEMINI_API_KEY_TRANSCRIPT=your-gemini-api-key
GEMINI_TRANSCRIPTION_MODEL=gemini-2.0-flash-exp

# Groq API for summarization and OCR
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct

# Video Download Service
COBALT_API_URL=https://api.cobalt.tools
USE_YTDLP=true
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

## 🚀 Running the Server

### Development Mode

```bash
npm run dev
```

Server will start on `http://localhost:5000` with hot-reload enabled.

### Production Mode

```bash
npm run build
npm start
```

## 📚 API Documentation

Complete API documentation is available at:

- **Full Documentation**: `/docs/API.md`
- **Postman Collection**: `/docs/postman/ReelWorkspace.postman_collection.json`

### Quick Start

1. **Register a user**

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123"}'
```

2. **Login and get token**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123"}'
```

3. **Extract a reel**

```bash
curl -X POST http://localhost:5000/api/reel/extract \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"instagramUrl": "https://www.instagram.com/reel/EXAMPLE/"}'
```

## 🗂️ Project Structure

```
server/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth, validation, error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic (AI, media processing)
│   ├── utils/           # Helper functions
│   └── index.ts         # Application entry point
├── docs/                # API documentation
├── temp/                # Temporary files (auto-cleaned)
├── .env                 # Environment variables
├── package.json
└── tsconfig.json
```

## 🔑 Environment Variables Reference

| Variable                     | Description                          | Required | Default                                   |
| ---------------------------- | ------------------------------------ | -------- | ----------------------------------------- |
| `PORT`                       | Server port                          | No       | 5000                                      |
| `NODE_ENV`                   | Environment (development/production) | No       | development                               |
| `MONGODB_URI`                | MongoDB connection string            | Yes      | -                                         |
| `JWT_SECRET`                 | Secret key for JWT signing           | Yes      | -                                         |
| `JWT_EXPIRES_IN`             | JWT expiration time                  | No       | 7d                                        |
| `CLOUDINARY_CLOUD_NAME`      | Cloudinary cloud name                | Yes      | -                                         |
| `CLOUDINARY_API_KEY`         | Cloudinary API key                   | Yes      | -                                         |
| `CLOUDINARY_API_SECRET`      | Cloudinary API secret                | Yes      | -                                         |
| `GEMINI_API_KEY_TRANSCRIPT`  | Gemini API key for transcription     | Yes      | -                                         |
| `GEMINI_TRANSCRIPTION_MODEL` | Gemini model name                    | No       | gemini-2.0-flash-exp                      |
| `GROQ_API_KEY`               | Groq API key                         | Yes      | -                                         |
| `GROQ_MODEL`                 | Groq model for summarization         | No       | llama-3.3-70b-versatile                   |
| `GROQ_VISION_MODEL`          | Groq vision model for OCR            | No       | meta-llama/llama-4-scout-17b-16e-instruct |
| `COBALT_API_URL`             | Cobalt API URL                       | No       | https://api.cobalt.tools                  |
| `USE_YTDLP`                  | Use yt-dlp for downloads             | No       | true                                      |

## 🧪 Testing

### Using Postman

1. Import the collection: `/docs/postman/ReelWorkspace.postman_collection.json`
2. Set the `baseUrl` variable to `http://localhost:5000`
3. Run the "Auth" folder to register/login and get a token
4. The token will be automatically saved for subsequent requests
5. Test all endpoints with comprehensive test assertions

### Manual Testing

```bash
# Health check
curl http://localhost:5000/api/health

# API info
curl http://localhost:5000/
```

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Error**: `MongooseServerSelectionError`

**Solution**:

- Verify MongoDB is running: `mongosh` or check Atlas connection
- Check `MONGODB_URI` in `.env`
- Ensure network access is allowed (for Atlas)

### FFmpeg Not Found

**Error**: `FFmpeg not found`

**Solution**:

- Install FFmpeg (see Installation section)
- Verify installation: `ffmpeg -version`
- Ensure FFmpeg is in system PATH

### AI API Errors

**Error**: `AI service unavailable` or `API key invalid`

**Solution**:

- Verify API keys in `.env`
- Check API quotas and limits
- Ensure correct model names are configured

### Video Download Failures

**Error**: `Failed to download video`

**Solution**:

- Try toggling `USE_YTDLP` between true/false
- Verify Instagram URL is valid and public
- Check yt-dlp is installed: `yt-dlp --version`
- Ensure Cobalt API is accessible

### Cloudinary Upload Errors

**Error**: `Upload failed`

**Solution**:

- Verify Cloudinary credentials in `.env`
- Check Cloudinary account storage limits
- Ensure network connectivity

### Port Already in Use

**Error**: `EADDRINUSE: address already in use`

**Solution**:

```bash
# Find process using port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process or change PORT in .env
```

## 📊 Performance Considerations

### Reel Extraction Performance

Average processing time: **10-20 seconds per reel**

Breakdown:

- Fetch metadata: ~1s
- Download video: ~3-5s (depends on video size)
- Extract audio: ~1s
- AI transcription: ~4-6s
- AI summarization: ~2-3s
- OCR processing: ~1-2s
- Upload to Cloudinary: ~2-4s

### Database Indexes

The following indexes are automatically created:

- `userId` on Reel and Folder collections
- Text index on `summary`, `transcript`, `ocrText` for search
- Compound index on `userId + sourceUrl` for duplicate detection

### Optimization Tips

1. **Concurrent Extractions**: Limit to 5 concurrent extractions per user
2. **Pagination**: Use appropriate `limit` values (default: 20, max: 100)
3. **Search**: Use specific queries for better performance
4. **Caching**: Consider implementing Redis for frequently accessed data

## 🔒 Security

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Comprehensive validation on all endpoints
- **CORS**: Configured for development (customize for production)
- **Helmet**: Security headers enabled
- **Rate Limiting**: Consider implementing for production

## 📝 Scripts

```json
{
  "dev": "tsx watch src/index.ts", // Development with hot-reload
  "build": "tsc", // Compile TypeScript
  "start": "node dist/index.js" // Production server
}
```

## 🤝 Contributing

1. Follow TypeScript best practices
2. Add JSDoc comments for exported functions
3. Use consistent error handling
4. Update API documentation for new endpoints
5. Add validation for all user inputs

## 📄 License

ISC

## 🆘 Support

For issues and questions:

1. Check the troubleshooting section
2. Review API documentation
3. Check existing issues in the repository
4. Create a new issue with detailed information

---

**Built with ❤️ using TypeScript, Express, and AI**
