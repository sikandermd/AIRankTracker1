#!/usr/bin/env node

/**
 * Migration-Free Deployment Script
 * Fixes platform infrastructure migration issues
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting migration-free deployment...');

// Set environment variables to bypass migration issues
process.env.SKIP_MIGRATIONS = 'true';
process.env.USE_EXISTING_SCHEMA = 'true';
process.env.NO_DB_MIGRATIONS = 'true';

// Build the application
console.log('📦 Building application...');
const buildProcess = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true
});

buildProcess.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Build failed');
    process.exit(1);
  }
  
  console.log('✅ Build successful');
  console.log('🚦 Starting server...');
  
  // Start the server without migration checks
  const serverProcess = spawn('node', ['server/index.js'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      SKIP_MIGRATIONS: 'true',
      USE_EXISTING_SCHEMA: 'true'
    }
  });
  
  serverProcess.on('close', (serverCode) => {
    process.exit(serverCode);
  });
});

buildProcess.on('error', (err) => {
  console.error('❌ Build process error:', err);
  process.exit(1);
});