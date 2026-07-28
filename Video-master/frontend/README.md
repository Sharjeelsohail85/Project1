# Video Master - React Frontend

A modern React application with Material-UI for the Video Master platform.

## Features

- 🎨 Material Design UI with Material-UI components
- 🔐 User authentication (Login/Register)
- 📹 Video browsing and viewing
- 📺 Channel management
- 💬 Comments on videos
- 👍 Like/Dislike videos
- 🔍 Search functionality
- 👤 User profile management
- 📱 Responsive design

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Laravel backend running on `http://localhost:8000`

## Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (if not already created):
   ```env
   REACT_APP_API_URL=http://localhost:8000/api/v1
   ```

## Running the Application

1. Make sure your Laravel backend is running:
   ```bash
   # In the backend directory
   php artisan serve
   ```

2. Start the React development server:
   ```bash
   # In the frontend directory
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (irreversible)

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── Layout.js          # Main layout with navigation
│   ├── pages/
│   │   ├── Home.js            # Home page
│   │   ├── Login.js           # Login page
│   │   ├── Register.js       # Registration page
│   │   ├── Videos.js          # Video listing page
│   │   ├── VideoDetail.js     # Video detail page
│   │   ├── Channels.js        # Channel listing page
│   │   ├── ChannelDetail.js   # Channel detail page
│   │   ├── MyVideos.js        # User's videos page
│   │   └── Profile.js         # User profile page
│   ├── services/
│   │   └── api.js             # API service layer
│   ├── App.js                # Main app component with routing
│   └── index.js              # Entry point
├── package.json
└── README.md
```

## API Integration

The frontend is fully integrated with the Laravel backend API. All API calls are handled through the `services/api.js` file, which includes:

- Authentication API (login, register, logout)
- Video API (CRUD operations, search, like/dislike)
- Channel API (CRUD operations, subscribe/unsubscribe)
- User API (profile management)
- Comment API (create, read, update, delete)

## Authentication

The app uses token-based authentication:
- Tokens are stored in localStorage
- Protected routes require authentication
- Tokens are automatically included in API requests

## Environment Variables

- `REACT_APP_API_URL` - Backend API base URL (default: `http://localhost:8000/api/v1`)

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## Troubleshooting

### CORS Errors
- Make sure the backend CORS is configured correctly
- Check that `CORS_ALLOWED_ORIGINS` in backend `.env` includes `http://localhost:3000`

### API Connection Issues
- Verify the backend is running on `http://localhost:8000`
- Check the `REACT_APP_API_URL` in `.env` file
- Ensure the backend API routes are accessible

### Authentication Issues
- Clear localStorage and try logging in again
- Check that tokens are being stored correctly after login

## Technologies Used

- React 18
- Material-UI (MUI) 5
- React Router 6
- Axios
- Material Icons
