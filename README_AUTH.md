# OAuth Authentication Setup

This application supports OAuth login with Google, Facebook, and Dropbox.

## Setup Instructions

### 1. Create OAuth Applications

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (for development)
   - `https://yourdomain.com/auth/google/callback` (for production)
7. Copy the Client ID

#### Facebook OAuth
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add "Facebook Login" product
4. Go to Settings → Basic
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/facebook/callback` (for development)
   - `https://yourdomain.com/auth/facebook/callback` (for production)
6. Copy the App ID

#### Dropbox OAuth
1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Create a new app
3. Choose "Scoped access" or "Full Dropbox"
4. Add redirect URIs:
   - `http://localhost:3000/auth/dropbox/callback` (for development)
   - `https://yourdomain.com/auth/dropbox/callback` (for production)
5. Copy the App Key (Client ID)

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your OAuth credentials in `.env`:
   ```
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
   
   VITE_FACEBOOK_APP_ID=your_facebook_app_id_here
   VITE_FACEBOOK_REDIRECT_URI=http://localhost:3000/auth/facebook/callback
   
   VITE_DROPBOX_CLIENT_ID=your_dropbox_client_id_here
   VITE_DROPBOX_REDIRECT_URI=http://localhost:3000/auth/dropbox/callback
   ```

### 3. Backend Setup (Required for Production)

**Important**: The current implementation includes a demo/simulation mode. For production, you need to:

1. Create a backend API endpoint to exchange OAuth codes for tokens
2. Update `src/services/auth.service.js` to call your backend API
3. Store tokens securely (never expose them in client-side code)
4. Implement proper session management

Example backend endpoint structure:
```javascript
// POST /api/auth/callback
{
  "provider": "google|facebook|dropbox",
  "code": "authorization_code",
  "state": "csrf_token"
}

// Response:
{
  "access_token": "...",
  "refresh_token": "...",
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "picture": "..."
  }
}
```

### 4. How It Works

1. User clicks a provider button (Google, Facebook, or Dropbox)
2. A popup window opens with the OAuth provider's login page
3. User authenticates with the provider
4. Provider redirects to your callback URL with an authorization code
5. The code is exchanged for access tokens (via your backend)
6. User information is stored and the user is logged in

### 5. Security Notes

- **Never commit `.env` file to version control**
- Always use HTTPS in production
- Implement CSRF protection using the `state` parameter
- Store tokens securely (httpOnly cookies recommended)
- Validate tokens on the server side
- Implement token refresh logic

### 6. Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Click on a provider button in the login modal
3. Complete the OAuth flow in the popup
4. You should be redirected and logged in

## Troubleshooting

### Popup Blocked
- Make sure your browser allows popups for localhost
- Check browser popup blocker settings

### Redirect URI Mismatch
- Ensure the redirect URI in `.env` exactly matches the one configured in your OAuth app
- Check for trailing slashes and protocol (http vs https)

### CORS Errors
- OAuth providers handle CORS automatically
- If you see CORS errors, check your backend API configuration

### Invalid Client ID
- Verify your credentials are correct in `.env`
- Make sure you're using the correct environment (development vs production)
