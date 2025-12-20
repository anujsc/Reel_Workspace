# Services

Business logic and external API calls.

This directory will contain all the business logic and integrations with external services.

## Structure

Services will be organized by functionality:

- `auth.service.ts` - Authentication logic (JWT, password hashing)
- `gemini.service.ts` - Google Gemini AI integration
- `cloudinary.service.ts` - Cloudinary media upload/management
- `cobalt.service.ts` - Cobalt API for video downloads
- `reel.service.ts` - Reel processing pipeline
- `ocr.service.ts` - OCR processing using Gemini Vision

Each service will:

1. Contain reusable business logic
2. Handle external API communications
3. Process and transform data
4. Be independent and testable
