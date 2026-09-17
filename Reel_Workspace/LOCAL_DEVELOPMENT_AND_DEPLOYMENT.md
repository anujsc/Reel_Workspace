# Local Development and Render Deployment

This project has two applications that run locally:

| App | Local URL | Render URL |
| --- | --- | --- |
| React client | http://localhost:8080 | your frontend service URL |
| Express API | http://localhost:5000 | your backend service URL |

The API health check is available at `/api/health`.

## Local setup

1. Install Node.js 18 or newer.
2. Install dependencies in both applications:

```powershell
cd Reel_Workspace/server
npm install
cd ../client
npm install
```

3. Keep the real environment files in these locations:

```text
Reel_Workspace/server/.env
Reel_Workspace/client/.env
```

The repository ignores these files. Use `.env.example` as the key reference and never commit real API keys, passwords, database URLs, or JWT secrets.

4. For local development, the important URL values are:

```env
# client/.env
VITE_API_BASE_URL=http://localhost:5000

# server/.env
CLIENT_URL=http://localhost:8080
SERVER_URL=http://localhost:5000
NODE_ENV=development
PORT=5000
```

Use either a local MongoDB database or an Atlas connection string in `server/.env`. Local processing also requires FFmpeg and Python with yt-dlp and Instaloader installed.

The Instagram extraction fallback order is:

1. yt-dlp
2. Instaloader

Recommended local extractor settings in `server/.env`:

```env
USE_YTDLP=true
USE_INSTALOADER=true
PYTHON_EXECUTABLE=python
EXTRACTOR_DOH_URL=https://cloudflare-dns.com/dns-query
# Required only when the local network resets direct Instagram TLS.
# EXTRACTOR_PROXY=http://127.0.0.1:8080
YTDLP_TIMEOUT_MS=120000
INSTALOADER_TIMEOUT_MS=120000
EXTRACT_MAX_FILE_SIZE_MB=200
```

5. Start the API in one terminal:

```powershell
cd Reel_Workspace/server
npm run dev
```

6. Start the client in a second terminal:

```powershell
cd Reel_Workspace/client
npm run dev
```

Open http://localhost:8080 and check http://localhost:5000/api/health before testing login, reel extraction, folders, sharing, or chat.

If both extractors report `ECONNRESET` or Windows error `10054`, Instagram traffic is being reset by the current network. DNS-over-HTTPS is already enabled, but it cannot bypass a TLS/network block. Configure a permitted local HTTP or SOCKS proxy without committing its value:

```env
EXTRACTOR_PROXY=http://127.0.0.1:8080
```

The proxy is passed only to yt-dlp and Instaloader. No proxy is required on Render unless that deployment network also resets Instagram traffic.

## Switching back to Render

Before a deployment, change the URL values in the Render dashboard or the active Render blueprint. Do not put production URLs into the local `.env` files just to deploy.

| Variable | Local value | Render value |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:5000` | backend service URL, for example `https://reel-workspace.onrender.com` |
| `CLIENT_URL` | `http://localhost:8080` | frontend service URL, for example `https://reel-workspace-frontend.onrender.com` |
| `SERVER_URL` | `http://localhost:5000` | backend service URL |
| `NODE_ENV` | `development` | `production` |
| `USE_YTDLP` | `true` | `true` |
| `USE_INSTALOADER` | `true` | `true` |
| `PYTHON_EXECUTABLE` | `python` or `python3` | `python3` |
| `EXTRACTOR_DOH_URL` | Cloudflare DNS-over-HTTPS endpoint | `https://cloudflare-dns.com/dns-query` |
| `EXTRACTOR_PROXY` | Optional HTTP/SOCKS proxy for Instagram traffic | unset |
| `YTDLP_TIMEOUT_MS` | `120000` | `120000` |
| `INSTALOADER_TIMEOUT_MS` | `120000` | `120000` |
| `EXTRACT_MAX_FILE_SIZE_MB` | `200` | `50` |

The frontend URL must be the value of `CLIENT_URL`, because the API uses it to generate folder share links. The backend URL must be the value of `VITE_API_BASE_URL`, because Vite embeds that value into the client build.

Before deploying, run both builds:

```powershell
cd Reel_Workspace/server
npm run build

cd ../client
npm run build
```

After deployment, verify:

1. The frontend loads from the Render frontend URL.
2. The frontend can call `<backend-url>/api/health` without a CORS error.
3. Register and login work.
4. A newly created folder share link starts with the frontend URL, not `localhost`.
5. Reel extraction can launch yt-dlp and Instaloader on the Render server.

If the Render service URLs differ from the examples, use the actual URLs shown in the Render dashboard. Keep the values consistent across the frontend environment, backend `CLIENT_URL`, backend `SERVER_URL`, and the Render blueprint.

## Security note

Credentials pasted into chat or committed to a repository should be considered exposed. Rotate the Cloudinary, Gemini, Groq, MongoDB, and JWT credentials before the next production deployment, then update only the secret stores and ignored `.env` files.