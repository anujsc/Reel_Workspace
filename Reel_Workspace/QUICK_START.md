# Quick Start Guide

## ✅ Phase 0 Complete!

Your MERN + TypeScript project structure is ready. Here's how to get started:

## Next Steps

### 1. Set Up Environment Variables

```bash
cd Reel_Workspace/server
copy .env.example .env
```

Edit `.env` and add your credentials:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/reelworkspace
JWT_SECRET=your_super_secret_random_string_here
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_api_key
COBALT_API_URL=https://api.cobalt.tools
```

### 2. Start Development Server

```bash
npm run dev
```

You should see:

```
✅ MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
📊 Database Name: reelworkspace
✅ Server running on port 5000
🌍 Environment: development
🔗 Health check: http://localhost:5000/api/health
```

### 3. Test the API

Open your browser or use curl:

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": 1703097600000,
  "environment": "development"
}
```

## Sign Up for External Services

### MongoDB Atlas (Required)

1. Visit: https://www.mongodb.com/cloud/atlas/register
2. Create a free M0 cluster
3. Create a database user
4. Whitelist your IP (or use 0.0.0.0/0 for development)
5. Get connection string and add to `.env`

### Cloudinary (Required)

1. Visit: https://cloudinary.com/users/register/free
2. Get credentials from dashboard
3. Add to `.env`

### Google Gemini API (Required)

1. Visit: https://makersuite.google.com/app/apikey
2. Create API key
3. Add to `.env`

### Cobalt API (Already Configured)

- Public instance: https://api.cobalt.tools
- No signup required

## Project Structure

```
Reel_Workspace/
├── server/                 # Backend API
│   ├── src/
│   │   ├── config/        # Database & configuration
│   │   ├── controllers/   # Request handlers
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Auth & validation
│   │   ├── models/        # Mongoose schemas
│   │   ├── utils/         # Helper functions
│   │   └── index.ts       # Entry point
│   ├── dist/              # Compiled JavaScript
│   ├── .env               # Environment variables (create this)
│   └── package.json
├── client/                # Frontend (coming soon)
└── README.md
```

## Available Commands

```bash
# Development with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run production server
npm start
```

## What's Next?

Phase 1 will include:

- User authentication (register, login, JWT)
- User model with Mongoose
- Auth middleware
- Protected routes
- Password hashing with bcrypt

## Troubleshooting

### Port already in use

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### MongoDB connection failed

- Check your connection string
- Verify IP whitelist in MongoDB Atlas
- Ensure database user has correct permissions

### TypeScript errors

```bash
npm run build
```

Check the output for specific errors.

## Support

For issues, check:

- Server logs in the terminal
- MongoDB Atlas connection status
- Environment variables in `.env`

Happy coding! 🚀
