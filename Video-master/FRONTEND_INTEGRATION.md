# Frontend Integration Quick Start

This guide will help you quickly connect your frontend application to the Video Master backend.

## Step 1: Configure Backend CORS

1. Copy `.env.example` to `.env` if you don't have one:
   ```bash
   cp .env.example .env
   ```

2. Update your `.env` file with CORS settings:
   ```env
   APP_URL=http://localhost:8000
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:4200
   ```
   
   For development, you can use `*` to allow all origins:
   ```env
   CORS_ALLOWED_ORIGINS=*
   ```

3. Generate application key if needed:
   ```bash
   php artisan key:generate
   ```

4. Start the Laravel server:
   ```bash
   php artisan serve
   ```

## Step 2: Configure Frontend

### Option A: Using the provided API config helper

Copy `api-config.js` to your frontend project and use it:

```javascript
import { apiRequest, API_CONFIG, saveAuthTokens } from './api-config';

// Login example
const handleLogin = async (email, password) => {
  const response = await apiRequest(API_CONFIG.endpoints.auth.login, {
    method: 'POST',
    body: JSON.stringify({
      data: { email, password }
    })
  });
  
  if (response.data && response.data.token) {
    saveAuthTokens(response.data.token, response.data.client_id);
    return response;
  }
  throw new Error('Login failed');
};
```

### Option B: Manual setup

1. Set your API base URL in your frontend environment:
   - React/Next.js: `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`
   - Vue.js: `VUE_APP_API_URL=http://localhost:8000/api/v1`
   - Angular: Add to `environment.ts`

2. Create an API service that includes authentication tokens:
   ```javascript
   const API_URL = 'http://localhost:8000/api/v1';
   
   const getAuthParams = () => {
     const token = localStorage.getItem('token');
     const clientId = localStorage.getItem('client_id');
     return token && clientId ? `?token=${token}&client_id=${clientId}` : '';
   };
   
   export const api = {
     async login(email, password) {
       const response = await fetch(`${API_URL}/auth/login`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ data: { email, password } })
       });
       const result = await response.json();
       if (result.data?.token) {
         localStorage.setItem('token', result.data.token);
         localStorage.setItem('client_id', result.data.client_id);
       }
       return result;
     },
     
     async get(endpoint) {
       const response = await fetch(`${API_URL}${endpoint}${getAuthParams()}`);
       return response.json();
     }
   };
   ```

## Step 3: Test the Connection

1. Test CORS is working:
   ```javascript
   fetch('http://localhost:8000/api/v1/video')
     .then(res => res.json())
     .then(data => console.log('Success:', data))
     .catch(err => console.error('Error:', err));
   ```

2. Test authentication:
   ```javascript
   // First register or use existing credentials
   fetch('http://localhost:8000/api/v1/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       data: {
         email: 'your-email@example.com',
         password: 'your-password'
       }
     })
   })
   .then(res => res.json())
   .then(data => {
     console.log('Login response:', data);
     if (data.data) {
       localStorage.setItem('token', data.data.token);
       localStorage.setItem('client_id', data.data.client_id);
     }
   });
   ```

3. Test authenticated endpoint:
   ```javascript
   const token = localStorage.getItem('token');
   const clientId = localStorage.getItem('client_id');
   
   fetch(`http://localhost:8000/api/v1/video/me?token=${token}&client_id=${clientId}`)
     .then(res => res.json())
     .then(data => console.log('My videos:', data));
   ```

## Common Issues

### CORS Errors
- Make sure `CORS_ALLOWED_ORIGINS` in `.env` includes your frontend URL
- Check that the backend server is running
- Verify the frontend is making requests to the correct backend URL

### Authentication Errors (401)
- Ensure you're including both `token` and `client_id` in requests
- Check that tokens are stored correctly after login
- Verify the user account is active (`active = 1`)

### 404 Errors
- Verify the API route exists in the module routes files
- Check that the route prefix is correct (`/api/v1`)
- Ensure the Laravel server is running on the expected port

## Next Steps

- See `API_CONFIG.md` for complete API documentation
- Check `api-config.js` for ready-to-use helper functions
- Review the module routes files for all available endpoints
