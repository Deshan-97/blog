// Load environment variables
require('dotenv').config();

// Import the express framework for building the web server
const express = require('express');
// Import sqlite3 for interacting with the SQLite database
const sqlite3 = require('sqlite3').verbose();
// Import path for handling file and directory paths
const path = require('path');
// Import body-parser to parse incoming JSON request bodies
const bodyParser = require('body-parser');
// Import multer for handling file uploads (like images)
const multer = require('multer');
// Import fs for file system operations
const fs = require('fs');
// Import security middleware
const helmet = require('helmet');
const compression = require('compression');
const bcrypt = require('bcryptjs');

// Create an Express application
const app = express();
// Set the port number for the server (use environment variable in production)
const PORT = process.env.PORT || 3000;

// Set up and connect to the SQLite database file (use Render-compatible path)
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/opt/render/.data/blog.db'  // Render's persistent storage
  : './db.sqlite';                // Local development

console.log('Environment:', process.env.NODE_ENV);
console.log('Using DB at:', dbPath);

// Ensure the directory exists for production (only try on Render)
if (process.env.NODE_ENV === 'production') {
  const dbDir = path.dirname(dbPath);
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log('Created database directory:', dbDir);
    }
  } catch (error) {
    console.log('Directory creation skipped (not on Render):', error.message);
  }
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    // If there is an error connecting, print it
    console.error('Could not connect to database', err);
    console.error('Database path attempted:', dbPath);
  } else {
    // If connection is successful, print a message
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Create the tables if they don't exist
// This will create both categories and articles tables with proper relationships
db.serialize(() => {
  // Create categories table first
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create articles table with category_id foreign key
  db.run(`CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    read_time TEXT,
    image TEXT,
    category_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  )`);

  // Create site_settings table
  db.run(`CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create admin_users table for authentication
  db.run(`CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert default admin user if none exists
  db.get('SELECT COUNT(*) as count FROM admin_users', [], (err, row) => {
    if (err) {
      console.error('Error checking admin users:', err);
      return;
    }
    
    if (row.count === 0) {
      // Create default admin user with environment variables
      const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
      const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
      
      db.run('INSERT INTO admin_users (username, password, email) VALUES (?, ?, ?)', 
        [defaultUsername, defaultPassword, 'admin@example.com'], (err) => {
        if (err) {
          console.error('Error creating default admin user:', err);
        } else {
          console.log(`Default admin user created: ${defaultUsername}/${defaultPassword}`);
        }
      });
    }
  });

  // Insert default site settings if they don't exist
  db.get('SELECT COUNT(*) as count FROM site_settings', [], (err, row) => {
    if (err) {
      console.error('Error checking site settings:', err);
      return;
    }
    
    if (row.count === 0) {
      const defaultSettings = [
        { key: 'site_name', value: 'BlogTok' },
        { key: 'site_description', value: 'A modern blogging platform' },
        // About page content
        { key: 'heroTitle', value: 'About BlogTok' },
        { key: 'heroSubtitle', value: 'Discover stories, thinking, and expertise from writers on any topic that matters to you.' },
        { key: 'missionTitle', value: 'Our Mission' },
        { key: 'missionContent', value: 'We believe that everyone has a story to tell and knowledge to share. Our platform provides a space for writers, thinkers, and creators to express their ideas and connect with readers around the world. We\'re committed to fostering meaningful conversations and building a community where diverse perspectives are celebrated.' },
        { key: 'communityTitle', value: 'Our Community' },
        { key: 'communityContent', value: 'BlogTok is home to thousands of writers and millions of readers from every corner of the globe. Our community spans industries, interests, and expertise levels, creating a rich tapestry of human knowledge and experience. Whether you\'re here to learn, share, or simply explore new ideas, you\'ll find your place in our vibrant community.' },
        { key: 'innovationTitle', value: 'Innovation' },
        { key: 'innovationContent', value: 'We\'re constantly evolving to better serve our community. From our intuitive reading experience to our powerful writing tools, every feature is designed with our users in mind. We leverage cutting-edge technology to make discovering and sharing great content easier than ever before.' },
        { key: 'impactTitle', value: 'Global Impact' },
        { key: 'impactContent', value: 'Stories have the power to change minds, spark movements, and bridge divides. Through BlogTok, we\'re helping important ideas reach the people who need to hear them. Our platform has facilitated countless connections, inspired new careers, and fostered understanding across cultural and geographic boundaries.' },
        { key: 'contactTitle', value: 'Get In Touch' },
        { key: 'contactDescription', value: 'Have questions, suggestions, or just want to say hello? We\'d love to hear from you.' },
        { key: 'contactEmail', value: 'hello@blogtok.com' },
        { key: 'contactPhone', value: '+1 (555) 123-4567' },
        { key: 'contactAddress', value: 'San Francisco, CA' },
        // AdSense settings
        { key: 'adsense_client_id', value: '' },
        { key: 'adsense_enabled', value: 'false' },
        { key: 'adsense_auto_ads', value: 'false' },
        { key: 'adsense_display_ads', value: 'true' },
        { key: 'adsense_ad_slot_header', value: '' },
        { key: 'adsense_ad_slot_sidebar', value: '' },
        { key: 'adsense_ad_slot_footer', value: '' }
      ];
      
      const stmt = db.prepare('INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)');
      defaultSettings.forEach(setting => {
        stmt.run(setting.key, setting.value);
      });
      stmt.finalize();
      
      console.log('Default site settings have been added');
    }
  });
  
  // Insert default categories if categories table is empty
  db.get('SELECT COUNT(*) as count FROM categories', [], (err, row) => {
    if (err) {
      console.error('Error checking categories:', err);
      return;
    }
    
    if (row.count === 0) {
      const { defaultCategories } = require('./config/categories');
      
      // Insert default categories
      const stmt = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
      defaultCategories.forEach(category => {
        stmt.run(category.name, category.description);
      });
      stmt.finalize();
      
      console.log('Default categories have been added');
    }
  });
});

// Set up multer for handling image uploads
const uploadPath = process.env.UPLOAD_PATH || path.join(__dirname, 'public', 'uploads');
const storage = multer.diskStorage({
  // Set the destination folder for uploaded files
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  // Set the filename for uploaded files to be unique
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname); // Get the file extension
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
// Create the multer upload middleware using the storage settings above
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE || 5242880 // 5MB default
  }
});

// Add security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for simplicity, enable in strict production
}));
app.use(compression());

// Use body-parser middleware to parse JSON request bodies
app.use(bodyParser.json());

// ===========================================
// DYNAMIC HTML ROUTES (MUST BE BEFORE STATIC)
// ===========================================

// Function to get site settings and inject into HTML
function getSiteSettingsAndInjectHTML(filePath, res) {
  // Get site settings from database
  db.all('SELECT setting_key, setting_value FROM site_settings', (err, rows) => {
    if (err) {
      console.error('Error fetching site settings:', err);
      return res.status(500).send('Error loading site settings');
    }
    
    // Convert to object
    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    
    // Default fallbacks
    const siteName = settings.site_name || 'BlogTok';
    const siteDescription = settings.site_description || 'A modern blogging platform';
    
    // AdSense settings
    const adsenseEnabled = settings.adsense_enabled === 'true';
    const adsenseClientId = settings.adsense_client_id || '';
    const adsenseAutoAds = settings.adsense_auto_ads === 'true';
    
    // Read the HTML file
    fs.readFile(filePath, 'utf8', (err, html) => {
      if (err) {
        console.error('Error reading HTML file:', err);
        return res.status(404).send('Page not found');
      }
      
      // Replace placeholders with actual values
      let processedHtml = html
        .replace(/BlogTok Admin/g, `${siteName} Admin`)
        .replace(/TechBlog Pro Admin/g, `${siteName} Admin`)
        .replace(/BlogTok Administrator/g, `${siteName} Administrator`)
        .replace(/TechBlog Pro Administrator/g, `${siteName} Administrator`)
        .replace(/BlogTok Admin - Dashboard/g, `${siteName} Admin - Dashboard`)
        .replace(/TechBlog Pro Admin - Dashboard/g, `${siteName} Admin - Dashboard`)
        .replace(/BlogTok Admin - Category Management/g, `${siteName} Admin - Category Management`)
        .replace(/TechBlog Pro Admin - Category Management/g, `${siteName} Admin - Category Management`)
        .replace(/BlogTok/g, siteName)
        .replace(/TechBlog Pro/g, siteName)
        .replace(/A modern blogging platform/g, siteDescription)
        .replace(/Professional Technology Blog Platform/g, siteDescription);
      
      // Inject AdSense code if enabled
      if (adsenseEnabled && adsenseClientId) {
        // Generate AdSense script tag
        let adsenseScript = `
    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}"
            crossorigin="anonymous"></script>`;
        
        // Add auto ads script if enabled
        if (adsenseAutoAds) {
          adsenseScript += `
    <script>
        (adsbygoogle = window.adsbygoogle || []).push({
            google_ad_client: "${adsenseClientId}",
            enable_page_level_ads: true
        });
    </script>`;
        }
        
        // Inject the script into the head section
        processedHtml = processedHtml.replace('</head>', adsenseScript + '\n</head>');
      }
      
      res.send(processedHtml);
    });
  });
}

// Dynamic routes for HTML pages that need site settings injection
app.get('/', (req, res) => {
  getSiteSettingsAndInjectHTML(path.join(__dirname, 'public', 'index.html'), res);
});

app.get('/index.html', (req, res) => {
  getSiteSettingsAndInjectHTML(path.join(__dirname, 'public', 'index.html'), res);
});

app.get('/admin.html', (req, res) => {
  getSiteSettingsAndInjectHTML(path.join(__dirname, 'public', 'admin.html'), res);
});

app.get('/login.html', (req, res) => {
  getSiteSettingsAndInjectHTML(path.join(__dirname, 'public', 'login.html'), res);
});

app.get('/add-article.html', (req, res) => {
  getSiteSettingsAndInjectHTML(path.join(__dirname, 'public', 'add-article.html'), res);
});

app.get('/manage-articles.html', (req, res) => {
  getSiteSettingsAndInjectHTML(path.join(__dirname, 'public', 'manage-articles.html'), res);
});

app.get('/category.html', (req, res) => {
  getSiteSettingsAndInjectHTML(path.join(__dirname, 'public', 'category.html'), res);
});

app.get('/adsense-demo.html', (req, res) => {
  getSiteSettingsAndInjectHTML(path.join(__dirname, 'public', 'adsense-demo.html'), res);
});

app.get('/bookmarks.html', (req, res) => {
  getSiteSettingsAndInjectHTML(path.join(__dirname, 'public', 'bookmarks.html'), res);
});

app.get('/article-reader.html', (req, res) => {
  getSiteSettingsAndInjectHTML(path.join(__dirname, 'public', 'article-reader.html'), res);
});

app.get('/about.html', (req, res) => {
  getSiteSettingsAndInjectHTML(path.join(__dirname, 'public', 'about.html'), res);
});

app.get('/test-form.html', (req, res) => {
  getSiteSettingsAndInjectHTML(path.join(__dirname, 'public', 'test-form.html'), res);
});

// ===========================================
// END DYNAMIC HTML ROUTES
// ===========================================

// Serve static files (HTML, JS, CSS, images) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for favicon.ico to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).send(); // No content response
});

// Health check endpoint to verify server is running
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// API endpoint to get all articles
app.get('/api/articles', (req, res) => {
  // Query the database for all articles, ordered by creation date (newest first)
  db.all('SELECT * FROM articles ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      // If there is a database error, send a 500 error response
      res.status(500).json({ error: err.message });
      return;
    }
    // Send the list of articles as JSON
    res.json(rows);
  });
});

// API endpoint to add a new article (with optional image upload)
app.post('/api/articles', upload.single('image'), (req, res) => {
  // Get the title, content, excerpt, read_time, and category_id from the form data
  const { title, content, excerpt, read_time, category_id } = req.body;
  let image = null; // Default to no image
  // If an image was uploaded, set the image path
  if (req.file) {
    image = 'uploads/' + req.file.filename;
  }
  // If title or content is missing, send a 400 error
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  // Insert the new article into the database, including all fields
  db.run('INSERT INTO articles (title, content, excerpt, read_time, image, category_id) VALUES (?, ?, ?, ?, ?, ?)', 
    [title, content, excerpt || null, read_time || null, image, category_id || null], function(err) {
    if (err) {
      // If there is a database error, send a 500 error response
      return res.status(500).json({ error: err.message });
    }
    // Send back the new article data
    res.json({ 
      id: this.lastID, 
      title, 
      content, 
      excerpt, 
      read_time, 
      image,
      category_id 
    });
  });
});

// ===========================================
// DASHBOARD API ENDPOINTS (Must be before :id routes)
// ===========================================

// Get article count for dashboard
app.get('/api/articles/count', (req, res) => {
  const query = 'SELECT COUNT(*) as count FROM articles';
  db.get(query, (err, row) => {
    if (err) {
      console.error('Error fetching article count:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ count: row.count });
  });
});

// Get category count for dashboard
app.get('/api/categories/count', (req, res) => {
  const query = 'SELECT COUNT(*) as count FROM categories';
  db.get(query, (err, row) => {
    if (err) {
      console.error('Error fetching category count:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ count: row.count });
  });
});

// Get total views count for dashboard
app.get('/api/analytics/views', (req, res) => {
  // Since we don't have a views table yet, let's simulate or use article count
  const query = `
    SELECT 
      COUNT(*) * CAST((RANDOM() % 50 + 10) AS INTEGER) as count 
    FROM articles
  `;
  db.get(query, (err, row) => {
    if (err) {
      console.error('Error fetching views count:', err);
      return res.status(500).json({ error: err.message });
    }
    // If no articles, return 0 views
    const viewCount = row.count || 0;
    res.json({ count: viewCount });
  });
});

// ===========================================
// END DASHBOARD API ENDPOINTS
// ===========================================

// ===========================================
// SITE SETTINGS API ENDPOINTS
// ===========================================

// Get all site settings
app.get('/api/site-settings', (req, res) => {
  db.all('SELECT setting_key, setting_value FROM site_settings', (err, rows) => {
    if (err) {
      console.error('Error fetching site settings:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Convert to object format
    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    
    res.json(settings);
  });
});

// Get specific site setting
app.get('/api/site-settings/:key', (req, res) => {
  const settingKey = req.params.key;
  
  db.get('SELECT setting_value FROM site_settings WHERE setting_key = ?', [settingKey], (err, row) => {
    if (err) {
      console.error('Error fetching site setting:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({ [settingKey]: row.setting_value });
  });
});

// Update site settings
app.post('/api/site-settings', (req, res) => {
  const { site_name, site_description, facebookLink, twitterLink, instagramLink, youtubeLink } = req.body;
  
  if (!site_name || !site_description) {
    return res.status(400).json({ error: 'Site name and description are required' });
  }
  
  // Prepare all settings to update
  const settings = [
    { key: 'site_name', value: site_name },
    { key: 'site_description', value: site_description },
    { key: 'facebookLink', value: facebookLink || '' },
    { key: 'twitterLink', value: twitterLink || '' },
    { key: 'instagramLink', value: instagramLink || '' },
    { key: 'youtubeLink', value: youtubeLink || '' }
  ];
  
  let completed = 0;
  let hasError = false;
  
  // Update all settings
  settings.forEach((setting, index) => {
    db.run(
      'INSERT OR REPLACE INTO site_settings (setting_key, setting_value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [setting.key, setting.value],
      function(err) {
        if (err && !hasError) {
          hasError = true;
          console.error(`Error updating ${setting.key}:`, err);
          return res.status(500).json({ error: err.message });
        }
        
        completed++;
        
        // If all settings have been processed successfully
        if (completed === settings.length && !hasError) {
          console.log('Site settings updated successfully');
          res.json({ 
            success: true, 
            message: 'Site settings updated successfully',
            settings: { 
              site_name, 
              site_description,
              facebookLink: facebookLink || '',
              twitterLink: twitterLink || '',
              instagramLink: instagramLink || '',
              youtubeLink: youtubeLink || ''
            }
          });
        }
      }
    );
  });
});

// ===========================================
// ADSENSE API ENDPOINTS
// ===========================================

// Get AdSense settings
app.get('/api/adsense-settings', (req, res) => {
  const adsenseKeys = [
    'adsense_client_id', 'adsense_enabled', 'adsense_auto_ads', 
    'adsense_display_ads', 'adsense_ad_slot_header', 
    'adsense_ad_slot_sidebar', 'adsense_ad_slot_footer'
  ];

  const placeholders = adsenseKeys.map(() => '?').join(',');
  const query = `SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN (${placeholders})`;

  db.all(query, adsenseKeys, (err, rows) => {
    if (err) {
      console.error('Error fetching AdSense settings:', err);
      return res.status(500).json({ error: err.message });
    }

    const adsenseSettings = {};
    rows.forEach(row => {
      adsenseSettings[row.setting_key] = row.setting_value;
    });

    // Add default values for missing keys
    adsenseKeys.forEach(key => {
      if (!adsenseSettings[key]) {
        adsenseSettings[key] = '';
      }
    });

    res.json(adsenseSettings);
  });
});

// Update AdSense settings
app.post('/api/adsense-settings', (req, res) => {
  const {
    adsense_client_id,
    adsense_enabled,
    adsense_auto_ads,
    adsense_display_ads,
    adsense_ad_slot_header,
    adsense_ad_slot_sidebar,
    adsense_ad_slot_footer
  } = req.body;

  // Only update settings that are actually provided in the request
  const settingsToUpdate = [];
  
  if (adsense_client_id !== undefined) {
    settingsToUpdate.push({ key: 'adsense_client_id', value: adsense_client_id });
  }
  if (adsense_enabled !== undefined) {
    settingsToUpdate.push({ key: 'adsense_enabled', value: adsense_enabled });
  }
  if (adsense_auto_ads !== undefined) {
    settingsToUpdate.push({ key: 'adsense_auto_ads', value: adsense_auto_ads });
  }
  if (adsense_display_ads !== undefined) {
    settingsToUpdate.push({ key: 'adsense_display_ads', value: adsense_display_ads });
  }
  if (adsense_ad_slot_header !== undefined) {
    settingsToUpdate.push({ key: 'adsense_ad_slot_header', value: adsense_ad_slot_header });
  }
  if (adsense_ad_slot_sidebar !== undefined) {
    settingsToUpdate.push({ key: 'adsense_ad_slot_sidebar', value: adsense_ad_slot_sidebar });
  }
  if (adsense_ad_slot_footer !== undefined) {
    settingsToUpdate.push({ key: 'adsense_ad_slot_footer', value: adsense_ad_slot_footer });
  }

  if (settingsToUpdate.length === 0) {
    return res.status(400).json({ error: 'No valid AdSense settings provided' });
  }

  let completed = 0;
  let hasError = false;

  settingsToUpdate.forEach(setting => {
    db.run(
      'INSERT OR REPLACE INTO site_settings (setting_key, setting_value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [setting.key, setting.value],
      function(err) {
        if (err && !hasError) {
          hasError = true;
          console.error('Error updating AdSense setting:', err);
          return res.status(500).json({ error: err.message });
        }
        
        completed++;
        if (completed === settingsToUpdate.length && !hasError) {
          console.log('AdSense settings updated successfully');
          res.json({
            success: true,
            message: 'AdSense settings updated successfully',
            settings: req.body
          });
        }
      }
    );
  });
});

// Complete replace of all AdSense settings (PUT method)
app.put('/api/adsense-settings', (req, res) => {
  const {
    adsense_client_id,
    adsense_enabled,
    adsense_auto_ads,
    adsense_display_ads,
    adsense_ad_slot_header,
    adsense_ad_slot_sidebar,
    adsense_ad_slot_footer
  } = req.body;

  const settingsToUpdate = [
    { key: 'adsense_client_id', value: adsense_client_id || '' },
    { key: 'adsense_enabled', value: adsense_enabled || 'false' },
    { key: 'adsense_auto_ads', value: adsense_auto_ads || 'false' },
    { key: 'adsense_display_ads', value: adsense_display_ads || 'true' },
    { key: 'adsense_ad_slot_header', value: adsense_ad_slot_header || '' },
    { key: 'adsense_ad_slot_sidebar', value: adsense_ad_slot_sidebar || '' },
    { key: 'adsense_ad_slot_footer', value: adsense_ad_slot_footer || '' }
  ];

  let completed = 0;
  let hasError = false;

  settingsToUpdate.forEach(setting => {
    db.run(
      'INSERT OR REPLACE INTO site_settings (setting_key, setting_value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [setting.key, setting.value],
      function(err) {
        if (err && !hasError) {
          hasError = true;
          console.error('Error updating AdSense setting:', err);
          return res.status(500).json({ error: err.message });
        }
        
        completed++;
        if (completed === settingsToUpdate.length && !hasError) {
          console.log('All AdSense settings updated successfully');
          res.json({
            success: true,
            message: 'All AdSense settings updated successfully',
            settings: req.body
          });
        }
      }
    );
  });
});

// Get AdSense ad code for manual placement
app.get('/api/adsense-code/:position', (req, res) => {
  const position = req.params.position; // header, sidebar, footer
  
  db.all('SELECT setting_key, setting_value FROM site_settings WHERE setting_key LIKE "adsense_%"', (err, rows) => {
    if (err) {
      console.error('Error fetching AdSense settings:', err);
      return res.status(500).json({ error: err.message });
    }

    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    const adsenseEnabled = settings.adsense_enabled === 'true';
    const adsenseClientId = settings.adsense_client_id || '';
    const adsenseDisplayAds = settings.adsense_display_ads === 'true';
    
    if (!adsenseEnabled || !adsenseClientId || !adsenseDisplayAds) {
      return res.json({ code: '', enabled: false });
    }

    let adSlotId = '';
    switch(position) {
      case 'header':
        adSlotId = settings.adsense_ad_slot_header || '';
        break;
      case 'sidebar':
        adSlotId = settings.adsense_ad_slot_sidebar || '';
        break;
      case 'footer':
        adSlotId = settings.adsense_ad_slot_footer || '';
        break;
      default:
        return res.status(400).json({ error: 'Invalid position. Use: header, sidebar, or footer' });
    }

    if (!adSlotId) {
      return res.json({ code: '', enabled: false, message: `No ad slot ID configured for ${position}` });
    }

    const adCode = `
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="${adsenseClientId}"
     data-ad-slot="${adSlotId}"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`;

    res.json({ 
      code: adCode.trim(), 
      enabled: true,
      position: position,
      client_id: adsenseClientId,
      slot_id: adSlotId
    });
  });
});

// ===========================================
// ABOUT PAGE API ENDPOINTS
// ===========================================

// Get about page content
app.get('/api/about', (req, res) => {
  const aboutKeys = [
    'heroTitle', 'heroSubtitle', 'missionTitle', 'missionContent',
    'communityTitle', 'communityContent', 'innovationTitle', 'innovationContent',
    'impactTitle', 'impactContent',
    'contactTitle', 'contactDescription', 'contactEmail', 'contactPhone', 'contactAddress',
    'facebookLink', 'twitterLink', 'instagramLink', 'youtubeLink'
  ];

  const placeholders = aboutKeys.map(() => '?').join(',');
  const query = `SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN (${placeholders})`;

  db.all(query, aboutKeys, (err, rows) => {
    if (err) {
      console.error('Error fetching about content:', err);
      return res.status(500).json({ error: err.message });
    }

    // Convert to object format
    const aboutContent = {};
    rows.forEach(row => {
      aboutContent[row.setting_key] = row.setting_value;
    });

    // Add default values for missing keys
    aboutKeys.forEach(key => {
      if (!aboutContent[key]) {
        aboutContent[key] = getDefaultAboutContent(key);
      }
    });

    res.json(aboutContent);
  });
});

// Update about page content
app.put('/api/about', (req, res) => {
  const updates = req.body;
  
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Invalid update data' });
  }

  const allowedKeys = [
    'heroTitle', 'heroSubtitle', 'missionTitle', 'missionContent',
    'communityTitle', 'communityContent', 'innovationTitle', 'innovationContent',
    'impactTitle', 'impactContent',
    'contactTitle', 'contactDescription', 'contactEmail', 'contactPhone', 'contactAddress'
  ];

  let updateCount = 0;
  let totalUpdates = 0;

  // Count valid updates
  Object.keys(updates).forEach(key => {
    if (allowedKeys.includes(key)) {
      totalUpdates++;
    }
  });

  if (totalUpdates === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  // Perform updates
  Object.keys(updates).forEach(key => {
    if (allowedKeys.includes(key)) {
      db.run(
        'INSERT OR REPLACE INTO site_settings (setting_key, setting_value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [key, updates[key]],
        function(err) {
          if (err) {
            console.error(`Error updating ${key}:`, err);
          } else {
            updateCount++;
          }

          // Check if all updates are complete
          if (updateCount === totalUpdates) {
            res.json({
              success: true,
              message: 'About page content updated successfully',
              updatedFields: updateCount
            });
          }
        }
      );
    }
  });
});

// Helper function for default about content
function getDefaultAboutContent(key) {
  const defaults = {
    heroTitle: 'About BlogTok',
    heroSubtitle: 'Discover stories, thinking, and expertise from writers on any topic that matters to you.',
    missionTitle: 'Our Mission',
    missionContent: 'We believe that everyone has a story to tell and knowledge to share.',
    communityTitle: 'Our Community',
    communityContent: 'BlogTok is home to thousands of writers and millions of readers.',
    innovationTitle: 'Innovation',
    innovationContent: 'We\'re constantly evolving to better serve our community.',
    impactTitle: 'Global Impact',
    impactContent: 'Stories have the power to change minds, spark movements, and bridge divides.',
    teamTitle: 'Meet Our Team',
    member1Name: 'Sarah Johnson',
    member1Role: 'Founder & CEO',
    member1Bio: 'Sarah is a passionate advocate for democratizing information.',
    member2Name: 'Michael Chen',
    member2Role: 'Head of Engineering',
    member2Bio: 'Michael leads our technical vision.',
    member3Name: 'Emily Rodriguez',
    member3Role: 'Head of Community',
    member3Bio: 'Emily fosters our global community.',
    contactTitle: 'Get In Touch',
    contactDescription: 'Have questions? We\'d love to hear from you.',
    contactEmail: 'hello@blogtok.com',
    contactPhone: '+1 (555) 123-4567',
    contactAddress: 'San Francisco, CA',
    // Social media links - empty by default
    facebookLink: '',
    twitterLink: '',
    instagramLink: '',
    youtubeLink: ''
  };
  return defaults[key] || '';
}

// ===========================================
// AUTHENTICATION API ENDPOINTS
// ===========================================

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username and password are required' 
    });
  }
  
  // Check credentials against database
  db.get('SELECT * FROM admin_users WHERE username = ? AND password = ?', 
    [username, password], (err, row) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error' 
      });
    }
    
    if (row) {
      // Successful login
      res.json({ 
        success: true, 
        message: 'Login successful',
        user: {
          id: row.id,
          username: row.username,
          email: row.email
        }
      });
    } else {
      // Invalid credentials
      res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }
  });
});

// Get admin user info
app.get('/api/admin-user', (req, res) => {
  db.get('SELECT id, username, email, created_at FROM admin_users LIMIT 1', [], (err, row) => {
    if (err) {
      console.error('Error fetching admin user:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (row) {
      res.json(row);
    } else {
      res.status(404).json({ error: 'Admin user not found' });
    }
  });
});

// Update admin user credentials
app.post('/api/admin-user', (req, res) => {
  const { username, password, email } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  
  // Build dynamic query based on provided fields
  let query = 'UPDATE admin_users SET username = ?, updated_at = CURRENT_TIMESTAMP';
  let params = [username];
  
  if (email) {
    query += ', email = ?';
    params.push(email);
  }
  
  if (password) {
    query += ', password = ?';
    params.push(password);
  }
  
  query += ' WHERE id = 1'; // Assuming single admin user
  
  db.run(query, params, function(err) {
    if (err) {
      console.error('Error updating admin user:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ 
      success: true, 
      message: 'Admin user updated successfully' 
    });
  });
});

// ===========================================
// END SITE SETTINGS API ENDPOINTS
// ===========================================

// API endpoint to get a single article by ID
app.get('/api/articles/:id', (req, res) => {
  const articleId = req.params.id;
  
  db.get('SELECT * FROM articles WHERE id = ?', [articleId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }
    res.json(row);
  });
});

// ========== CATEGORY API ENDPOINTS ==========

// API endpoint to get all categories
app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM categories ORDER BY name ASC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// API endpoint to get a single category
app.get('/api/categories/:id', (req, res) => {
  db.get('SELECT * FROM categories WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json(row);
  });
});

// API endpoint to create a new category
app.post('/api/categories', (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  
  db.run('INSERT INTO categories (name, description) VALUES (?, ?)', 
    [name, description || null], function(err) {
    if (err) {
      // Check for unique constraint violation
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'A category with that name already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({ id: this.lastID, name, description });
  });
});

// API endpoint to update a category
app.put('/api/categories/:id', (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  
  db.run('UPDATE categories SET name = ?, description = ? WHERE id = ?', 
    [name, description || null, req.params.id], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'A category with that name already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ id: req.params.id, name, description });
  });
});

// API endpoint to delete a category
app.delete('/api/categories/:id', (req, res) => {
  db.run('DELETE FROM categories WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted successfully' });
  });
});

// API endpoint to delete an article
app.delete('/api/articles/:id', (req, res) => {
  db.run('DELETE FROM articles WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json({ message: 'Article deleted successfully' });
  });
});

// API endpoint to get articles with category information
app.get('/api/articles-with-categories', (req, res) => {
  const query = `
    SELECT a.*, c.name as category_name 
    FROM articles a 
    LEFT JOIN categories c ON a.category_id = c.id 
    ORDER BY a.created_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// API endpoint for searching articles with category filtering
app.get('/api/search', (req, res) => {
  const { q: query, category, limit = 50 } = req.query;
  
  if (!query || query.trim().length === 0) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  let sqlQuery = `
    SELECT a.*, c.name as category_name 
    FROM articles a 
    LEFT JOIN categories c ON a.category_id = c.id 
    WHERE (
      a.title LIKE ? OR 
      a.content LIKE ? OR 
      a.excerpt LIKE ?
    )
  `;
  
  let params = [`%${query}%`, `%${query}%`, `%${query}%`];
  
  // Add category filter if specified
  if (category && category !== 'all') {
    sqlQuery += ` AND c.name = ?`;
    params.push(category);
  }
  
  sqlQuery += ` ORDER BY 
    CASE 
      WHEN a.title LIKE ? THEN 1
      WHEN a.excerpt LIKE ? THEN 2
      ELSE 3
    END,
    a.created_at DESC
    LIMIT ?
  `;
  
  params.push(`%${query}%`, `%${query}%`, parseInt(limit));
  
  db.all(sqlQuery, params, (err, rows) => {
    if (err) {
      console.error('Search error:', err);
      res.status(500).json({ error: 'Search failed' });
      return;
    }
    
    // Add search relevance score and highlight matching text
    const results = rows.map(article => ({
      ...article,
      relevance_score: calculateRelevanceScore(article, query),
      highlighted_title: highlightSearchTerm(article.title, query),
      highlighted_excerpt: highlightSearchTerm(article.excerpt || article.content.substring(0, 200), query)
    }));
    
    res.json({
      query,
      category: category || 'all',
      total: results.length,
      results
    });
  });
});

// Helper function to calculate relevance score
function calculateRelevanceScore(article, query) {
  const queryLower = query.toLowerCase();
  let score = 0;
  
  // Title matches are most important
  if (article.title.toLowerCase().includes(queryLower)) {
    score += 10;
    // Exact title match gets higher score
    if (article.title.toLowerCase() === queryLower) {
      score += 20;
    }
  }
  
  // Excerpt matches
  if (article.excerpt && article.excerpt.toLowerCase().includes(queryLower)) {
    score += 5;
  }
  
  // Content matches
  if (article.content.toLowerCase().includes(queryLower)) {
    score += 3;
  }
  
  return score;
}

// Helper function to highlight search terms
function highlightSearchTerm(text, query) {
  if (!text || !query) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// ===========================================
// END DYNAMIC HTML SERVING
// ===========================================
// ===========================================

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});