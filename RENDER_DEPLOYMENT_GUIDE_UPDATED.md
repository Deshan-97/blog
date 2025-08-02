# Render Deployment Guide - Updated for Persistent Storage

## Overview
This updated deployment configuration ensures your SQLite database and uploaded files persist across deployments on Render's free tier.

## Required Files
✅ `default.db` - Template database with proper schema
✅ `start.sh` - Startup script for persistent storage setup
✅ Updated `server.js` - Uses `/opt/render/.data/` for persistent storage

## Render Configuration

### 1. Build Command
```bash
npm install
```

### 2. Start Command (IMPORTANT - Use This Exact Command)
```bash
mkdir -p /opt/render/.data && mkdir -p /opt/render/.data/uploads && [ -f /opt/render/.data/blog.db ] || cp default.db /opt/render/.data/blog.db && node server.js
```

**Alternative Start Command (using our script):**
```bash
chmod +x start.sh && ./start.sh
```

### 3. Environment Variables
Set these in your Render dashboard:
- `NODE_ENV=production`
- `ADMIN_USERNAME=your_admin_username`
- `ADMIN_PASSWORD=your_secure_password`

## How It Works

### Persistent Storage
- **Database**: `/opt/render/.data/blog.db` (persists across deployments)
- **Uploads**: `/opt/render/.data/uploads/` (persists across deployments)
- **Template**: `default.db` (used to initialize new databases)

### Startup Process
1. Creates `/opt/render/.data` directory
2. Creates `/opt/render/.data/uploads` directory
3. Checks if `blog.db` exists
4. If not, copies `default.db` as the initial database
5. Starts the Node.js server

### Benefits
- ✅ Database persists across deployments
- ✅ Uploaded images persist across deployments
- ✅ No data loss on redeploys
- ✅ Automatic database initialization for new deployments

## Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add persistent storage for Render deployment"
   git push origin main
   ```

2. **Update Render Settings**
   - Go to your Render dashboard
   - Select your service
   - Go to Settings
   - Update the "Start Command" with the command above
   - Save changes

3. **Manual Deploy**
   - Go to your service dashboard
   - Click "Manual Deploy" → "Deploy latest commit"

## Troubleshooting

### Database Issues
- Check logs for "Database created successfully!" message
- Verify `/opt/render/.data/blog.db` exists
- Ensure `default.db` is committed to your repository

### Upload Issues
- Check if `/opt/render/.data/uploads` directory exists
- Verify file permissions in logs
- Test image upload functionality after deployment

### Common Errors
- **"default.db not found"**: Ensure the file is committed to your repo
- **"Permission denied"**: The script handles this automatically
- **"Database locked"**: Usually resolves after deployment completes

## Monitoring

After deployment, check your logs for these success messages:
```
Creating persistent storage directories...
Database not found. Creating from template...
Database created successfully!
Starting Node.js server...
Server running on 0.0.0.0:10000
```

## File Structure
Your project should have:
```
your-project/
├── default.db          # Template database
├── start.sh           # Startup script
├── server.js          # Updated for persistent paths
├── package.json       # Updated scripts
└── public/
    ├── uploads/       # Local development uploads
    └── ...
```

---
**Note**: This configuration works specifically with Render's persistent disk feature available on their free tier. The `/opt/render/.data` directory persists across deployments.
