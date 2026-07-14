# Octopussol API & Security Documentation

This document outlines the API endpoints, proxy layers, security architectures, and compliance models utilized across the Octopussol Creator-First Video Platform.

## 🔐 Security & Access Control Architecture

### 1. Token-Based Authentication Flow
All authenticated requests must include the following custom headers:
- `token`: The user's dynamic authorization bearer token.
- `client_id`: The client application identifier (e.g., `web_client`).

When these headers are provided, the API gateway or worker verifies:
- Token integrity, signature, and expiration.
- Client association and device/OS metadata bindings.

### 2. CORS Security Model
Currently, the serverless edge worker (`src/worker.js`) implements permissive CORS options for the `/api/mega-proxy` proxy endpoint during initial beta testing.
*   **Access-Control-Allow-Origin:** `*`
*   **Recommended Production Hardening:** Replace wildcards with configured, verified origins (e.g., `https://project1-video-app.sharjeelsohail85.workers.dev`).

### 3. Google Drive & Dropbox API Integration Security
- **OAuth Callback Security:** The OAuth callback (`/api/v1/auth/oauth/callback`) enforces CSRF validation using the `state` parameter before establishing token sessions.
- **Client Credentials:** Cloud storage keys (OneDrive, Dropbox, Google Drive) are managed exclusively server-side or bound via the `wrangler.toml` environment variables list to prevent exposing API secrets to public browser clients.

---

## 📡 API Endpoint Directory

### Authentication Services

#### 1. Login with Credentials
*   **URL:** `/api/v1/auth/login`
*   **Method:** `POST`
*   **Headers:** `Content-Type: application/json`
*   **Request Body:**
    ```json
    {
      "data": {
        "email": "user@example.com",
        "password": "password123",
        "client_id": "web_client",
        "device": "desktop",
        "os": "macos"
      }
    }
    ```
*   **Response (Success 200 OK):**
    ```json
    {
      "status": 200,
      "data": {
        "token": "auth-jwt-token-string",
        "client_id": "web_client",
        "user": {
          "uuid": "user-uuid",
          "email": "user@example.com",
          "first_name": "John",
          "last_name": "Doe"
        }
      }
    }
    ```

#### 2. Register New Account
*   **URL:** `/api/v1/auth/register`
*   **Method:** `POST`
*   **Headers:** `Content-Type: application/json`
*   **Request Body:**
    ```json
    {
      "data": {
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+1234567890",
        "email": "john@example.com",
        "password": "securepassword"
      }
    }
    ```

#### 3. Third-Party OAuth Callback
*   **URL:** `/api/v1/auth/oauth/callback`
*   **Method:** `POST`
*   **Request Body:**
    ```json
    {
      "data": {
        "provider": "google",
        "code": "auth-grant-code",
        "state": "csrf-state-token",
        "redirect_uri": "https://yourapp.com/oauth/callback"
      }
    }
    ```

---

### Video & Playback Services

#### 1. List Videos
*   **URL:** `/api/v1/video`
*   **Method:** `GET`
*   **Headers:** `token: ...`, `client_id: ...`

#### 2. Search Videos
*   **URL:** `/api/v1/video/search`
*   **Method:** `GET`
*   **Query Parameters:**
    *   `name`: Search query (e.g., `music`)
    *   `results`: Max result count (default: `10`)

#### 3. Upload / Create Video Entry
*   **URL:** `/api/v1/video`
*   **Method:** `POST`
*   **Headers:** `token: ...`, `client_id: ...`
*   **Request Body:**
    ```json
    {
      "data": {
        "title": "My Awesome Creator Video",
        "description": "Description text here",
        "sourceType": "uploadLink",
        "sourceUrl": "https://dl.dropboxusercontent.com/s/abcdefg.mp4"
      }
    }
    ```

---

### Channel Services

#### 1. Subscribe to Channel
*   **URL:** `/api/v1/channel/{id}/subscribe`
*   **Method:** `POST`
*   **Headers:** `token: ...`, `client_id: ...`

#### 2. Get Channel Info
*   **URL:** `/api/v1/channel/{id}`
*   **Method:** `GET`

---

### Cloudflare Serverless Proxy Services

#### 1. MEGA API & Stream Proxy
To bypass CORS restrictions and obscure target API hosts from tracking networks, a serverless proxy route is deployed at the edge.
*   **URL:** `/api/mega-proxy/{path}` or `/api/mega-proxy?url={target_mega_url}`
*   **Method:** Supports `GET`, `POST`, `PUT`, `DELETE`
*   **Action:** The worker replaces the target `Host` header, deletes client `Origin` and `Referer` telemetry headers, forwards the payload to `https://g.api.mega.co.nz`, and appends standardized, resilient CORS response headers.
