# Backend Integration Guide

This guide explains how the React frontend (Project1) is connected to the Laravel backend (Video-master).

## Project Structure

- **Frontend**: `M:\Project1` (React + Vite)
- **Backend**: `M:\Video-master` (Laravel)

## Setup Instructions

### 1. Backend Setup (Laravel)

1. Navigate to the Laravel backend:
   ```bash
   cd M:\Video-master
   ```

2. Install dependencies (if not already done):
   ```bash
   composer install
   ```

3. Configure `.env` file:
   ```env
   APP_URL=http://localhost:8000
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

4. Start the Laravel server:
   ```bash
   php artisan serve
   ```
   
   The backend will be available at `http://localhost:8000`

### 2. Frontend Setup (React)

1. Navigate to the React frontend:
   ```bash
   cd M:\Project1
   ```

2. Create `.env` file:
   ```bash
   cp env.example.txt .env
   ```

3. Update `.env` with your backend URL:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```

4. Install dependencies (if not already done):
   ```bash
   npm install
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```
   
   The frontend will be available at `http://localhost:3000` (or the port Vite assigns)

## API Integration

### API Configuration

The API configuration is in `src/config/api.config.js`:
- Base URL: Configured via `VITE_API_BASE_URL` environment variable
- Default: `http://localhost:8000/api/v1`

### API Service

The main API service is in `src/services/api.service.js`:
- `apiRequest()` - Main request function
- `authAPI` - Authentication methods
- `videoAPI` - Video-related methods
- `channelAPI` - Channel-related methods
- `commentAPI` - Comment-related methods

### Authentication

The app uses token-based authentication:
- Login: `POST /api/v1/auth/login`
- Register: `POST /api/v1/auth/register`
- Tokens are stored in localStorage: `token` and `client_id`
- All authenticated requests include tokens as query parameters or headers

### Example Usage

```javascript
import { authAPI, videoAPI } from './services/api.service'

// Login
const response = await authAPI.login('user@example.com', 'password')
// Tokens are automatically saved to localStorage

// Get videos
const videos = await videoAPI.list()

// Get my videos (requires authentication)
const myVideos = await videoAPI.my()
```

## Available API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/register` - Register new user

### Videos
- `GET /api/v1/video` - List all videos
- `GET /api/v1/video/{id}` - Get video details
- `POST /api/v1/video` - Create video (authenticated)
- `GET /api/v1/video/me` - Get my videos (authenticated)
- `GET /api/v1/video/search/{name}/{results}` - Search videos

### Channels
- `GET /api/v1/channel` - List all channels
- `GET /api/v1/channel/{id}` - Get channel details
- `POST /api/v1/channel` - Create channel (authenticated)

### Comments
- `GET /api/v1/video/{id}/comment` - Get comments
- `POST /api/v1/video/{id}/comment` - Add comment (authenticated)

## CORS Configuration

The Laravel backend must allow requests from the frontend. Update `M:\Video-master\.env`:

```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

Or for development, allow all origins:
```env
CORS_ALLOWED_ORIGINS=*
```

## Testing the Connection

1. Start both servers:
   - Backend: `php artisan serve` (port 8000)
   - Frontend: `npm run dev` (port 3000)

2. Test API connection:
   ```javascript
   // In browser console
   fetch('http://localhost:8000/api/v1/video')
     .then(res => res.json())
     .then(data => console.log('Videos:', data))
   ```

3. Test authentication:
   - Open the login modal in the app
   - Enter email and password
   - Check browser console for API responses

## Troubleshooting

### CORS Errors
- Ensure `CORS_ALLOWED_ORIGINS` in Laravel `.env` includes your frontend URL
- Check that both servers are running
- Verify the frontend is making requests to the correct backend URL

### 401 Unauthorized
- Check that tokens are being saved after login
- Verify tokens are included in authenticated requests
- Ensure user account is active (`active = 1` in database)

### 404 Not Found
- Verify the API route exists in Laravel
- Check that the route prefix is correct (`/api/v1`)
- Ensure Laravel server is running on the expected port

### Network Errors
- Check that the backend server is running
- Verify the `VITE_API_BASE_URL` in frontend `.env` is correct
- Check browser console for detailed error messages

## File Structure

```
Project1/
├── src/
│   ├── config/
│   │   ├── api.config.js          # API configuration
│   │   └── auth.config.js         # OAuth configuration
│   ├── services/
│   │   ├── api.service.js         # Main API service
│   │   └── auth.service.js       # Authentication service
│   └── components/
│       ├── Login.jsx              # Login component (uses API)
│       └── Signup.jsx             # Signup component (uses API)
└── .env                           # Environment variables
```

## Next Steps

1. Test all API endpoints
2. Implement error handling UI
3. Add loading states for API requests
4. Implement token refresh logic
5. Add request/response interceptors for logging
