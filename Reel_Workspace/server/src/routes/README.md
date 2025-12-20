# Routes

API routes will go here.

This directory will contain all the Express route definitions that map HTTP endpoints to controller functions.

## Structure

Routes will be organized by feature:

- `auth.routes.ts` - Authentication endpoints (login, register, etc.)
- `user.routes.ts` - User management endpoints
- `reel.routes.ts` - Reel processing endpoints
- `workspace.routes.ts` - Workspace management endpoints

Each route file will:

1. Define the route paths
2. Apply appropriate middleware (auth, validation)
3. Connect to controller functions
4. Export the router
