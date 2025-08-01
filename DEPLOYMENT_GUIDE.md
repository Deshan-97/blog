# Deployment Guide

## Overview
This is a **full-stack application** that requires both frontend and backend to work properly. You cannot just deploy the HTML files - you need to deploy the entire Node.js application.

## Architecture
- **Backend**: `server.js` (Express.js server)
- **Frontend**: Files in `/public` folder (HTML, CSS, JS)
- **Database**: SQLite database (`db.sqlite`)

## Why Login Fails After Deployment

If you're getting network errors when trying to login, it's likely because:

1. **You deployed only static files** (HTML/CSS/JS) to a static hosting service
2. **Your server.js is not running** on your hosting platform
3. **Your hosting platform doesn't support Node.js** applications

## Required Deployment Method

You need to deploy this as a **Node.js application**, not as static files.

### Platforms that support Node.js applications:
- ✅ **Heroku** (recommended)
- ✅ **Railway**
- ✅ **Render**
- ✅ **DigitalOcean App Platform**
- ✅ **Netlify Functions** (requires modification)
- ✅ **Vercel** (requires modification)
- ✅ **AWS EC2** with Node.js
- ✅ **VPS** with Node.js

### Platforms that DON'T work (static only):
- ❌ **GitHub Pages**
- ❌ **Netlify static hosting** (without functions)
- ❌ **Vercel static hosting** (without functions)
- ❌ **Firebase Hosting** (without functions)

## Deployment Steps

### Option 1: Heroku (Easiest)

1. **Create a Heroku account** at heroku.com
2. **Install Heroku CLI**
3. **Initialize git repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
4. **Create Heroku app**:
   ```bash
   heroku create your-app-name
   ```
5. **Deploy**:
   ```bash
   git push heroku main
   ```

### Option 2: Railway

1. **Create account** at railway.app
2. **Connect your GitHub repository**
3. **Deploy directly** from dashboard

### Option 3: Render

1. **Create account** at render.com
2. **Connect your GitHub repository**
3. **Deploy as web service**

## Environment Variables

Set these environment variables on your hosting platform:

```
NODE_ENV=production
PORT=3000
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
```

## Files Required for Deployment

Make sure these files are included:
- ✅ `server.js`
- ✅ `package.json`
- ✅ `Procfile`
- ✅ `/public` folder with all HTML/CSS/JS files
- ✅ `/config` folder
- ⚠️ `db.sqlite` (will be created automatically)

## Testing Locally

Before deploying, test locally:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Open browser** to `http://localhost:3000`

4. **Try logging in** with default credentials:
   - Username: `admin`
   - Password: `admin123`

If this works locally, then the issue is with your deployment method.

## Troubleshooting

### "Network Error" on login
- ✅ Check browser console for error details
- ✅ Verify your hosting platform supports Node.js
- ✅ Check if server.js is running on your hosting platform
- ✅ Verify API endpoints are accessible (try visiting `/api/site-settings`)

### "Cannot GET /" error
- ✅ Make sure `server.js` is running
- ✅ Check that static files are being served correctly

### Database errors
- ✅ Ensure write permissions for SQLite database
- ✅ Check if hosting platform supports file system writes

## Need Help?

1. **Check browser console** for detailed error messages
2. **Check server logs** on your hosting platform
3. **Verify you're deploying as Node.js app**, not static files
4. **Test locally first** to confirm everything works

## Common Mistake

❌ **DON'T** upload just the `/public` folder to a static hosting service
✅ **DO** deploy the entire project as a Node.js application
