// Render.com Debug Script
// Run this to test what's happening in production

console.log('=== RENDER DEBUG INFO ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('Current working directory:', process.cwd());
console.log('Available environment variables:');

// List all environment variables (safely)
Object.keys(process.env).forEach(key => {
  if (key.startsWith('ADMIN_') || key.startsWith('SECRET_') || key === 'DATABASE_PATH') {
    console.log(`${key}: [HIDDEN]`);
  } else {
    console.log(`${key}: ${process.env[key]}`);
  }
});

console.log('\n=== FILE SYSTEM CHECK ===');
const fs = require('fs');
const path = require('path');

// Check if we can create the database directory
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/opt/render/.data/blog.db'
  : './db.sqlite';

console.log('Intended database path:', dbPath);

if (process.env.NODE_ENV === 'production') {
  const dbDir = path.dirname(dbPath);
  console.log('Database directory:', dbDir);
  
  try {
    console.log('Checking if /opt exists:', fs.existsSync('/opt'));
    console.log('Checking if /opt/render exists:', fs.existsSync('/opt/render'));
    console.log('Checking if /opt/render/.data exists:', fs.existsSync('/opt/render/.data'));
    
    // Try to create the directory
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log('✅ Successfully created database directory');
    } else {
      console.log('✅ Database directory already exists');
    }
    
    // Test database connection
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Database connection failed:', err.message);
      } else {
        console.log('✅ Database connection successful');
        
        // Test creating a table
        db.run('CREATE TABLE IF NOT EXISTS test_table (id INTEGER)', (err) => {
          if (err) {
            console.error('❌ Table creation failed:', err.message);
          } else {
            console.log('✅ Table creation successful');
          }
          
          db.close();
          console.log('=== DEBUG COMPLETE ===');
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error during filesystem check:', error.message);
  }
} else {
  console.log('Running in development mode - skipping production checks');
}
