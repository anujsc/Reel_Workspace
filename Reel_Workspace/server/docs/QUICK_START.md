# Quick Start Guide

Get the Reel Workspace API up and running in 5 minutes.

## Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- FFmpeg installed
- API keys (Gemini, Groq, Cloudinary)

## 1. Install Dependencies

```bash
cd Reel_Workspace/server
npm install
```

## 2. Configure Environment

Create `.env` file:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/reelworkspace

# Auth
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AI Services
GEMINI_API_KEY_TRANSCRIPT=your-gemini-key
GEMINI_TRANSCRIPTION_MODEL=gemini-2.0-flash-exp
GROQ_API_KEY=your-groq-key
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct

# Video Download
COBALT_API_URL=https://api.cobalt.tools
USE_YTDLP=true
```

## 3. Start Server

```bash
npm run dev
```

Server starts at `http://localhost:5000`

## 4. Test API

### Health Check

```bash
curl http://localhost:5000/api/health
```

### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

Save the token from response.

### Extract Reel

```bash
curl -X POST http://localhost:5000/api/reel/extract \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"instagramUrl":"https://www.instagram.com/reel/EXAMPLE/"}'
```

## 5. Test with Postman

1. Import `/docs/postman/ReelWorkspace.postman_collection.json`
2. Set `baseUrl` to `http://localhost:5000`
3. Run "Auth" → "Register" or "Login"
4. Token is automatically saved
5. Run other tests

## Common Issues

### MongoDB Connection Error

**Error:** `MongooseServerSelectionError`

**Fix:**

```bash
# Start MongoDB locally
mongod

# Or check Atlas connection string
```

### FFmpeg Not Found

**Error:** `FFmpeg not found`

**Fix:**

```bash
# macOS
brew install ffmpeg

# Ubuntu
sudo apt install ffmpeg

# Windows
# Download from ffmpeg.org and add to PATH
```

### AI API Errors

**Error:** `AI service unavailable`

**Fix:**

- Verify API keys in `.env`
- Check API quotas
- Ensure correct model names

## Next Steps

- 📖 Read full documentation: `/server/README.md`
- 🧪 Run Postman tests: `/docs/POSTMAN_TESTING_GUIDE.md`
- 📚 API reference: `/docs/API.md`
- ⚡ Performance guide: `/docs/PERFORMANCE_TESTING.md`

## Quick Links

| Resource           | Location                                              |
| ------------------ | ----------------------------------------------------- |
| Full README        | `/server/README.md`                                   |
| API Docs           | `/docs/API.md`                                        |
| Postman Collection | `/docs/postman/ReelWorkspace.postman_collection.json` |
| Testing Guide      | `/docs/POSTMAN_TESTING_GUIDE.md`                      |
| Performance Guide  | `/docs/PERFORMANCE_TESTING.md`                        |

## Support

Issues? Check:

1. Server logs for errors
2. Environment variables are set
3. All dependencies installed
4. MongoDB is running
5. API keys are valid

---

**Ready to build! 🚀**
