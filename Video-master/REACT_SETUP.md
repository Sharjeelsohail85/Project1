# Complete Setup Guide: React Frontend + Laravel Backend

This guide will help you set up and run both the React frontend and Laravel backend together.

## Prerequisites

- PHP 7.4 or higher
- Composer
- Node.js 14 or higher
- npm or yarn
- MySQL or other database

## Backend Setup (Laravel)

1. **Navigate to the backend directory:**
   ```bash
   cd E:\Video-master
   ```

2. **Install PHP dependencies:**
   ```bash
   composer install
   ```

3. **Configure environment:**
   - Copy `.env.example` to `.env` (if it doesn't exist)
   - Update database credentials in `.env`
   - Add CORS configuration:
     ```env
     APP_URL=http://localhost:8000
     CORS_ALLOWED_ORIGINS=http://localhost:3000
     CORS_ALLOWED_METHODS=GET, POST, PUT, DELETE, OPTIONS, PATCH
     CORS_ALLOWED_HEADERS=Content-Type, Authorization, X-Requested-With, token, client_id
     CORS_MAX_AGE=3600
     ```

4. **Generate application key:**
   ```bash
   php artisan key:generate
   ```

5. **Run migrations:**
   ```bash
   php artisan migrate
   ```

6. **Seed database (optional):**
   ```bash
   php artisan db:seed
   ```

7. **Start the Laravel server:**
   ```bash
   php artisan serve
   ```
   Backend will be available at `http://localhost:8000`

## Frontend Setup (React)

1. **Navigate to the frontend directory:**
   ```bash
   cd E:\Video-master\frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   - Create `.env` file in the `frontend` directory:
     ```env
     REACT_APP_API_URL=http://localhost:8000/api/v1
     ```

4. **Start the React development server:**
   ```bash
   npm start
   ```
   Frontend will be available at `http://localhost:3000`

## Running Both Servers

### Option 1: Two Terminal Windows

**Terminal 1 (Backend):**
```bash
cd E:\Video-master
php artisan serve
```

**Terminal 2 (Frontend):**
```bash
cd E:\Video-master\frontend
npm start
```

### Option 2: Using npm scripts (if configured)

You can create a script to run both servers simultaneously using tools like `concurrently`.

## Testing the Connection

1. **Open the frontend:** `http://localhost:3000`
2. **Try to register a new user**
3. **Login with your credentials**
4. **Browse videos and channels**

## API Endpoints

The frontend is configured to use these main endpoints:

- **Authentication:**
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/register`

- **Videos:**
  - `GET /api/v1/video` - List all videos
  - `GET /api/v1/video/{id}` - Get video details
  - `GET /api/v1/video/me` - Get my videos (authenticated)
  - `POST /api/v1/video` - Create video (authenticated)

- **Channels:**
  - `GET /api/v1/channel` - List all channels
  - `GET /api/v1/channel/{id}` - Get channel details
  - `GET /api/v1/channel/me` - Get my channels (authenticated)

- **Users:**
  - `GET /api/v1/users/me` - Get current user (authenticated)
  - `PUT /api/v1/users` - Update user (authenticated)

## Troubleshooting

### Backend Issues

**CORS Errors:**
- Make sure `CORS_ALLOWED_ORIGINS` includes `http://localhost:3000`
- Clear browser cache
- Restart Laravel server

**Database Connection:**
- Check database credentials in `.env`
- Ensure database exists
- Run migrations: `php artisan migrate`

**API Not Responding:**
- Check Laravel server is running
- Verify routes: `php artisan route:list`
- Check Laravel logs: `storage/logs/laravel.log`

### Frontend Issues

**Cannot Connect to API:**
- Verify `REACT_APP_API_URL` in `.env`
- Check backend is running on port 8000
- Test API directly: `http://localhost:8000/api/v1/video`

**Authentication Not Working:**
- Check browser console for errors
- Verify tokens are stored in localStorage
- Clear localStorage and try again

**Build Errors:**
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear npm cache: `npm cache clean --force`

## Development Tips

1. **Hot Reload:** Both React and Laravel support hot reloading
2. **API Testing:** Use Postman or browser DevTools to test API endpoints
3. **Debugging:** Use React DevTools and browser console
4. **Logs:** Check Laravel logs in `storage/logs/laravel.log`

## Production Deployment

### Backend:
1. Set `APP_ENV=production` in `.env`
2. Set `APP_DEBUG=false`
3. Run `php artisan config:cache`
4. Run `php artisan route:cache`

### Frontend:
1. Update `REACT_APP_API_URL` to production API URL
2. Run `npm run build`
3. Deploy the `build` folder to your web server

## Next Steps

- Customize the Material-UI theme
- Add more features (video upload, notifications, etc.)
- Implement error boundaries
- Add loading states and skeletons
- Optimize performance

## Support

For issues or questions:
- Check the API documentation in `API_CONFIG.md`
- Review the frontend integration guide in `FRONTEND_INTEGRATION.md`
- Check Laravel and React documentation
