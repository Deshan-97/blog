# 🚀 Render.com Deployment Guide for BlogTok

## ✅ Pre-Deployment Checklist

Your app is now properly configured for Render.com! The key fixes applied:

### 1. **Database Path Fixed** ✅
- **Local**: Uses `./db.sqlite`
- **Production**: Uses `/opt/render/.data/blog.db` (Render's persistent storage)
- **Auto-detection**: Based on `NODE_ENV=production`

### 2. **Environment Variables Ready** ✅
You need to manually add these in Render Dashboard:

| Variable | Value | Description |
|----------|--------|-------------|
| `NODE_ENV` | `production` | Enables production mode |
| `SECRET_KEY` | `BlogTok_SecurE_K3y_2025_XyZ9$#mN8!qR7@vB4&` | Security key |
| `ADMIN_USERNAME` | `blogtok_admin` | Admin login username |
| `ADMIN_PASSWORD` | `SecurE_P@ssw0rd_2025!` | Admin login password |
| `MAX_FILE_SIZE` | `5242880` | File upload limit (5MB) |
| `UPLOAD_PATH` | `./public/uploads` | Upload directory |

---

## 🔧 Step-by-Step Render Deployment

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

### Step 2: Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your **`blog`** repository
3. Choose the main branch

### Step 3: Configure Build Settings
```bash
# Build Command
npm install

# Start Command  
node server.js

# Environment
Node
```

### Step 4: Add Environment Variables
In Render Dashboard → **Environment Variables** → Add each:

```
NODE_ENV=production
SECRET_KEY=BlogTok_SecurE_K3y_2025_XyZ9$#mN8!qR7@vB4&
ADMIN_USERNAME=blogtok_admin
ADMIN_PASSWORD=SecurE_P@ssw0rd_2025!
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./public/uploads
```

### Step 5: Deploy with Cache Clear
1. Go to **Settings** → **Build & Deploy**
2. Click **"Clear Build Cache"**
3. Click **"Deploy"**

---

## 🔍 Debugging Your Deployment

### Check Render Logs
1. Go to your service dashboard
2. Click **"Logs"** tab
3. Look for these success messages:
```
Environment: production
Using DB at: /opt/render/.data/blog.db
Connected to SQLite database at: /opt/render/.data/blog.db
Server running on port 10000
```

### Test Your Deployment
Once deployed, test these URLs:
- **Homepage**: `https://your-app-name.onrender.com`
- **Health Check**: `https://your-app-name.onrender.com/api/health`
- **Admin Login**: `https://your-app-name.onrender.com/admin.html`

---

## 🛠️ Common Issues & Solutions

### Issue 1: Database Connection Failed
**Solution**: Check that `NODE_ENV=production` is set in environment variables

### Issue 2: Admin Login Not Working
**Solution**: Verify `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set correctly

### Issue 3: File Uploads Failing
**Solution**: Render's filesystem is read-only except for `/opt/render/.data/`

### Issue 4: App Crashed
**Solution**: Check logs for missing environment variables

---

## 📊 Expected Deploy Time
- **First Deploy**: ~3-5 minutes
- **Subsequent Deploys**: ~1-2 minutes

---

## 🎉 Success Indicators

✅ **Build succeeds** without errors  
✅ **Health check** returns status 200  
✅ **Admin login** works properly  
✅ **Articles load** on homepage  
✅ **Database persists** between deploys  

---

## 🔐 Security Notes

- Your environment variables are secure in Render
- Database files persist in `/opt/render/.data/`
- Change default admin credentials before going live
- Consider adding rate limiting for production

---

## 📞 Next Steps After Deployment

1. **Test Admin Panel**: Verify you can login and create articles
2. **Add Content**: Create some initial blog posts
3. **Custom Domain**: Optional - add your own domain in Render settings
4. **Monitoring**: Check Render logs regularly for any issues

---

*Your app is now production-ready for Render.com! 🚀*
