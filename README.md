# BlogTok - Modern Blogging Platform

A TikTok-style blogging platform with admin panel built with Node.js, Express, and SQLite.

## 🚀 Quick Start

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment file:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration (especially change admin credentials!)

5. Start the server:
   ```bash
   npm start
   ```

6. Visit http://localhost:3000

## 🔧 Environment Variables

Create a `.env` file with these variables:

```env
NODE_ENV=production
PORT=3000
DATABASE_PATH=./db.sqlite
SECRET_KEY=your_super_secret_key
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_password
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./public/uploads
```

## 🚀 Deployment

### Heroku

1. Install Heroku CLI
2. Create new app: `heroku create your-app-name`
3. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set SECRET_KEY=your_secret_key
   heroku config:set ADMIN_USERNAME=your_username
   heroku config:set ADMIN_PASSWORD=your_password
   ```
4. Deploy: `git push heroku main`

### Railway

1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

### Other Platforms

- **Render**: Connect GitHub repo, set environment variables
- **DigitalOcean App Platform**: Import from GitHub
- **AWS Elastic Beanstalk**: Upload zip file

## 🔐 Security Notes

- **Change default admin credentials** before deployment
- **Set a strong SECRET_KEY**
- **Use HTTPS** in production
- **Update dependencies** regularly

## 📱 Features

- TikTok-style homepage interface
- Admin dashboard with analytics
- Article management (CRUD)
- Category management
- File upload for images
- Responsive design
- Search functionality
- User authentication

## 🛠️ Tech Stack

- **Backend**: Node.js, Express
- **Database**: SQLite
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Security**: Helmet, bcrypt
- **File Upload**: Multer

## 📞 Support

For issues and questions, check the code or create an issue.

---

**Default Admin Credentials** (CHANGE THESE!):
- Username: admin
- Password: admin123
