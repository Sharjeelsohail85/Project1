# 🐙 Octopussol: Creator-First Video Streaming & Migration Platform

Octopussol is a high-performance, responsive full-stack video hosting, streaming, and cloud migration platform. It empowers content creators to import videos from Microsoft OneDrive, Dropbox, and Google Drive seamlessly, while providing a modern, touch-friendly viewing interface.

---

## 🚀 Key Features

*   **⚡ Touch-Friendly Native Video Hub:** Liquid-smooth, modern navigation and video controls with custom physical touch swipe gestures optimized for mobile, tablet, and desktop screens.
*   **📂 Multi-Cloud Ingestion:** One-click import and robust chunked upload sessions using the Microsoft OneDrive, Dropbox, and Google Drive API layers.
*   **🔗 Smart Stream Proxy:** A serverless Edge Worker proxy on Cloudflare that routes and handles streaming securely, bypassing standard browser CORS limits.
*   **📦 Containerized Architecture:** Built-in `Dockerfile` and `docker-compose.yml` for rapid, single-command development or production orchestration.
*   **🛡️ Secure CI/CD Pipelines:** Integrated GitHub Action workflow validating linters, typechecks, and running unit tests automatically on every main push.

---

## 🔑 Seamless Microsoft OneDrive One-Click Authentication Setup

To provide users with a **seamless, one-click login pop-up window**, the application utilizes the secure **Microsoft OAuth 2.0 Implicit Grant Flow**. Because the app redirects back to your secure Cloudflare domain, a simple App Registration is needed in your Microsoft/Azure account:

### 1-Minute App Registration Guide

1.  **Go to the Azure Portal:** Navigate to the [Microsoft Entra Admin Center](https://entra.microsoft.com/) or the [Azure App Registrations Portal](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade).
2.  **New Registration:** Click on **New Registration** and configure the following:
    *   **Name:** `Octopussol Video App`
    *   **Supported Account Types:** Select **Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)**.
3.  **Redirect URI (Single-Page Application):** Under *Redirect URI*, select **Single-page application (SPA)** and add your Cloudflare domain:
    *   `https://project1-video-app.sharjeelsohail85.workers.dev/auth/google/callback`
    *   *(Also optionally add `http://localhost:3000/auth/google/callback` for local development testing).*
4.  **Implicit Grant and Hybrid Flows:** Scroll down to the *Implicit grant and hybrid flows* section and check:
    *   [x] **Access tokens (used for implicit flows)**
5.  **Save Client ID:** Click **Register**. Copy the **Application (client) ID** (a UUID like `86f4a867-b50a-40a2-9903-a4a350a4d1f2`).

### ⚙️ Setting the Client ID in the App

You can inject this Client ID into the app instantly without modifying any code:
*   **Via Environment Variables:** Set `VITE_ONEDRIVE_CLIENT_ID="YOUR_CLIENT_ID"` in your environment.
*   **Via the UI:** Users can customize and save their own Client ID inside the **Upload Options** tab on the Post Page, where it persists securely in their browser's local state.

---

## 🛠️ Local Development & Testing

### Docker Compose (Single-Command Run)
Spin up the entire high-performance production build locally via Docker:
```bash
docker-compose up --build
```
The app will immediately bind and serve on [http://localhost:3000](http://localhost:3000).

### Standard Installation
```bash
# Install dependencies
npm install

# Run localized development server
npm run dev

# Run automated Vitest unit tests
npm run test
```

---

## 📡 Deployment Architecture

### Cloudflare Workers/Pages
The edge deployment is hosted via Cloudflare Wrangler and compiles automatically.
```bash
npm run build
npx wrangler deploy
```

### GitHub Actions (CI/CD)
Every push to the `main` branch automatically triggers the `.github/workflows/ci-cd.yml` pipeline:
1. Installs project packages securely with caching.
2. Validates type safety and style rules (`npm run lint`).
3. Runs the automated Vitest test suites (`npm run test:ci`).
4. Builds the distribution artifacts (`npm run build`).
5. Seamlessly deploys to Cloudflare Workers.
