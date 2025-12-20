# Middleware

Auth and validation middleware.

This directory will contain all Express middleware functions for request processing.

## Structure

Middleware will include:

- `auth.middleware.ts` - JWT verification and user authentication
- `validation.middleware.ts` - Request data validation
- `error.middleware.ts` - Global error handling
- `upload.middleware.ts` - File upload handling
- `rateLimit.middleware.ts` - API rate limiting

Each middleware will:

1. Process requests before they reach controllers
2. Validate and sanitize data
3. Handle authentication/authorization
4. Catch and format errors
