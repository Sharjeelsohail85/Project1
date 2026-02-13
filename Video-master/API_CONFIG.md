# API Configuration Guide

This document provides information on how to connect your frontend application to the Video Master Laravel backend.

## Backend API Base URL

The backend API is available at: `http://dev.video.com/api/v1` (or your configured `APP_URL`)

Update this in your frontend configuration based on your environment:
- Development: `http://localhost:8000/api/v1` (or your Laravel dev server URL)
- Production: `https://yourdomain.com/api/v1`

## CORS Configuration

CORS has been configured to allow cross-origin requests. Update your `.env` file with:

```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:4200
CORS_ALLOWED_METHODS=GET, POST, PUT, DELETE, OPTIONS, PATCH
CORS_ALLOWED_HEADERS=Content-Type, Authorization, X-Requested-With, token, client_id
CORS_MAX_AGE=3600
```

For development, you can use `*` to allow all origins:
```env
CORS_ALLOWED_ORIGINS=*
```

## Authentication

The API uses token-based authentication. After login, you'll receive a token and client_id that must be included in subsequent requests.

### Login Endpoint
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "data": {
    "email": "user@example.com",
    "password": "password"
  }
}
```

### Register Endpoint
```
POST /api/v1/auth/register
Content-Type: application/json

{
  "data": {
    "name": "User Name",
    "email": "user@example.com",
    "password": "password",
    "password_confirmation": "password"
  }
}
```

### Authenticated Requests

For authenticated endpoints, include `token` and `client_id` as query parameters or in headers:

**Option 1: Query Parameters**
```
GET /api/v1/video/me?token=YOUR_TOKEN&client_id=YOUR_CLIENT_ID
```

**Option 2: Headers (if your frontend supports it)**
```
GET /api/v1/video/me
Headers:
  token: YOUR_TOKEN
  client_id: YOUR_CLIENT_ID
```

## Main API Endpoints

### Videos
- `GET /api/v1/video` - List all videos
- `GET /api/v1/video/{id}` - Get video details (requires temp token)
- `POST /api/v1/video` - Create video (authenticated)
- `PUT /api/v1/video/{id}` - Update video (authenticated)
- `DELETE /api/v1/video/{id}` - Delete video (authenticated)
- `GET /api/v1/video/me` - Get my videos (authenticated)
- `GET /api/v1/video/history` - Get video history (authenticated)
- `GET /api/v1/video/search/{name}/{no_of_results}` - Search videos

### Channels
- `GET /api/v1/channel` - List all channels
- `GET /api/v1/channel/{id}` - Get channel details
- `POST /api/v1/channel` - Create channel (authenticated)
- `PUT /api/v1/channel/{id}` - Update channel (authenticated)
- `DELETE /api/v1/channel/{id}` - Delete channel (authenticated)
- `GET /api/v1/channel/me` - Get my channels (authenticated)
- `GET /api/v1/channel/{id}/subscribe` - Subscribe to channel (authenticated)
- `GET /api/v1/channel/{id}/unsubscribe` - Unsubscribe from channel (authenticated)

### Users
- `GET /api/v1/users` - List users
- `GET /api/v1/users/{id}` - Get user details
- `POST /api/v1/users` - Register user
- `GET /api/v1/users/me` - Get current user (authenticated)
- `PUT /api/v1/users` - Update current user (authenticated)
- `GET /api/v1/user/search/{name}/{no_of_results}` - Search users

### Comments
- `GET /api/v1/video/{id}/comment` - Get comments for video
- `POST /api/v1/video/{id}/comment` - Add comment (authenticated)
- `PUT /api/v1/video/{id}/comment/{commentId}` - Update comment (authenticated)
- `DELETE /api/v1/video/{id}/comment/{commentId}` - Delete comment (authenticated)

### Likes
- `GET /api/v1/video/{id}/like` - Like video (authenticated)
- `GET /api/v1/video/{id}/dislike` - Dislike video (authenticated)

## Response Format

All API responses follow this format:

**Success Response:**
```json
{
  "data": {
    // Response data here
  },
  "status": 200
}
```

**Error Response:**
```json
{
  "error": 401,
  "error_description": ["Error message"],
  "status": 401,
  "message": "dashboard.success"
}
```

## Frontend Integration Examples

### React/Next.js Example

```javascript
// api/config.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');
    const clientId = localStorage.getItem('client_id');

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { token }),
        ...(clientId && { 'client_id': clientId }),
        ...options.headers,
      },
    };

    // Add token and client_id as query params if not in headers
    if (token && clientId && !config.headers.token) {
      const separator = endpoint.includes('?') ? '&' : '?';
      endpoint = `${endpoint}${separator}token=${token}&client_id=${clientId}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    return response.json();
  },

  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        data: { email, password }
      }),
    });
    
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('client_id', response.data.client_id);
    }
    return response;
  },
};
```

### Vue.js Example

```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token and client_id to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const clientId = localStorage.getItem('client_id');
  
  if (token && clientId) {
    config.params = {
      ...config.params,
      token,
      client_id: clientId,
    };
  }
  
  return config;
});

export default api;
```

### Angular Example

```typescript
// services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8000/api/v1';

  constructor(private http: HttpClient) {}

  private getAuthParams(): HttpParams {
    const token = localStorage.getItem('token');
    const clientId = localStorage.getItem('client_id');
    let params = new HttpParams();
    
    if (token && clientId) {
      params = params.set('token', token).set('client_id', clientId);
    }
    
    return params;
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, {
      data: { email, password }
    });
  }

  get(endpoint: string): Observable<any> {
    return this.http.get(`${this.baseUrl}${endpoint}`, {
      params: this.getAuthParams()
    });
  }
}
```

## Environment Variables

Add these to your frontend `.env` file:

```env
# React/Next.js
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Vue.js
VUE_APP_API_URL=http://localhost:8000/api/v1

# Angular
API_URL=http://localhost:8000/api/v1
```

## Testing the Connection

1. Start your Laravel backend:
   ```bash
   php artisan serve
   ```

2. Test CORS with a simple request:
   ```javascript
   fetch('http://localhost:8000/api/v1/video')
     .then(res => res.json())
     .then(data => console.log(data));
   ```

3. Test authentication:
   ```javascript
   fetch('http://localhost:8000/api/v1/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       data: {
         email: 'test@example.com',
         password: 'password'
       }
     })
   })
   .then(res => res.json())
   .then(data => {
     console.log('Token:', data.data.token);
     console.log('Client ID:', data.data.client_id);
   });
   ```

## Notes

- All authenticated endpoints require both `token` and `client_id`
- The API expects data to be wrapped in a `data` object for POST/PUT requests
- CSRF protection is disabled for API routes
- Make sure your backend `.env` has the correct `APP_URL` set
