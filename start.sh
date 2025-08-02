#!/bin/bash

# Render Persistent Storage Setup Script
# This script ensures the database and uploads persist across deployments

echo "Starting BlogTok application..."

# Create persistent storage directories
echo "Creating persistent storage directories..."
mkdir -p /opt/render/.data
mkdir -p /opt/render/.data/uploads

# Check if database exists, if not copy the default template
if [ ! -f /opt/render/.data/blog.db ]; then
    echo "Database not found. Creating from template..."
    cp default.db /opt/render/.data/blog.db
    echo "Database created successfully!"
else
    echo "Database already exists, skipping creation."
fi

# Set proper permissions
chmod 664 /opt/render/.data/blog.db 2>/dev/null || true
chmod 755 /opt/render/.data/uploads 2>/dev/null || true

echo "Starting Node.js server..."
node server.js
