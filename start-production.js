#!/usr/bin/env node

/**
 * Production startup script - Migration-free deployment
 * Explicitly bypasses all database migration attempts
 */

// Set environment variables to disable all migration processes
process.env.NODE_ENV = 'production';
process.env.SKIP_MIGRATIONS = 'true';
process.env.DATABASE_SKIP_MIGRATIONS = 'true';
process.env.NO_DRIZZLE_MIGRATIONS = 'true';
process.env.DISABLE_AUTO_MIGRATIONS = 'true';

// Disable any drizzle-kit auto-migration attempts
if (process.env.DATABASE_URL) {
  console.log('🚀 Production Mode: Using existing database schema');
  console.log('⚠️  Migration platform issue workaround active');
  console.log('📧 Contact Replit support about migration infrastructure issues');
}

// Import and start the server
import('./dist/index.js').catch(error => {
  console.error('❌ Failed to start production server:', error);
  process.exit(1);
});