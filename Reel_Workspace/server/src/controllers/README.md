# Controllers

Request handlers will go here.

This directory will contain all the controller functions that handle incoming HTTP requests and send responses.

## Structure

Controllers will be organized by feature:

- `auth.controller.ts` - Authentication and authorization
- `user.controller.ts` - User management
- `reel.controller.ts` - Reel processing and management
- `workspace.controller.ts` - Workspace operations

Each controller will contain functions that:

1. Validate request data
2. Call appropriate service functions
3. Handle errors
4. Send formatted responses
