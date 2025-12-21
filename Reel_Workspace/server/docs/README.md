# Documentation

This folder contains all documentation for the Reel Workspace API project.

## Available Documentation

### Phase 2 - Authentication System

- **PHASE_2_COMPLETE.md** - Complete overview of Phase 2 implementation
- **AUTHENTICATION_TESTING.md** - Detailed testing guide for authentication endpoints
- **POSTMAN_COLLECTION.json** - Postman collection for API testing

### Phase 3 - Media Processing Services

- **PHASE_3_SERVICES.md** - Complete service documentation (7 services + orchestrator)
- **PHASE_3_TESTING_GUIDE.md** - Testing guide for media processing pipeline
- **PHASE_3_SUMMARY.md** - Implementation summary and metrics
- **YTDLP_INTEGRATION.md** - yt-dlp integration guide and troubleshooting
- **WINDOWS_YTDLP_FIX.md** - Windows-specific yt-dlp PATH fix (applied)
- **WINDOWS_FFMPEG_FIX.md** - Windows-specific ffmpeg PATH fix (applied)
- **GEMINI_MODEL_FIX.md** - Gemini API model name fix (applied)
- **COBALT_AUTH_SOLUTION.md** - Cobalt API authentication solutions
- **COBALT_API_NOTES.md** - Cobalt API troubleshooting notes

### Project Setup

- **SERVER_README.md** - Server setup and configuration guide
- **QUICK_START.md** - Quick start guide for testing Instagram reel processing
- **SYSTEM_STATUS.md** - Current system status and working components

## Quick Links

### Testing the API

See `AUTHENTICATION_TESTING.md` for:

- API endpoint documentation
- cURL examples for Windows PowerShell
- Postman setup and test scripts
- Troubleshooting guide

### Understanding the Implementation

See `PHASE_2_COMPLETE.md` for:

- Complete feature list
- File structure
- Security features
- Code quality standards

### Media Processing Pipeline

See `PHASE_3_SERVICES.md` for:

- 7 specialized services documentation
- Master orchestrator details
- Error handling
- Performance benchmarks

### Postman Testing

Import `POSTMAN_COLLECTION.json` into Postman to get:

- Pre-configured requests
- Automated test scripts
- Environment variable setup

## Project Status

✅ **Phase 0**: Environment & Architecture Setup - COMPLETE
✅ **Phase 2**: Authentication System - COMPLETE
✅ **Phase 3**: Core Services Layer - Media Processing - COMPLETE
⏳ **Phase 4**: Database Integration & CRUD API - PENDING

## Quick Start

1. **Install system dependencies**:
   - yt-dlp: `winget install yt-dlp` (Windows) or `brew install yt-dlp` (macOS)
   - ffmpeg: `winget install ffmpeg` (Windows) or `brew install ffmpeg` (macOS)
2. **Verify installations**: `yt-dlp --version` and `ffmpeg -version`
3. **Configure environment variables** (see SERVER_README.md or QUICK_START.md)
4. **Start the server**: `npm run dev`
5. **Test health endpoint**: `http://localhost:5000/api/health`
6. **Test authentication**: `POST /api/auth/register`
7. **Test media processing**: `POST /api/test/extract-services`

For detailed testing instructions, see **QUICK_START.md**.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user (protected)

### Testing

- `POST /api/test/extract-services` - Process Instagram Reel through full pipeline

### Health

- `GET /api/health` - Server health check

## Support

For detailed information about each phase, refer to the respective documentation files in this folder.
