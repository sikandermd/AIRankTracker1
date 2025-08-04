#!/usr/bin/env node
// Enhanced deployment script with comprehensive platform issue bypass

import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🚀 Enhanced Deployment: Platform Issue Bypass');

// Set comprehensive environment variables
process.env.SKIP_ALL_MIGRATIONS = 'true';
process.env.NODE_ENV = 'production';
process.env.DRIZZLE_DISABLE = 'true';
process.env.DATABASE_MIGRATIONS = 'false';
process.env.DISABLE_PACKAGE_CACHE = 'true';
process.env.NPM_CONFIG_CACHE = 'false';
process.env.YARN_CACHE_FOLDER = '/tmp/yarn-cache';

// Clear any existing cache
console.log('🧹 Clearing package cache...');
try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
} catch (error) {
  console.log('Cache clean skipped (not critical)');
}

// Verify environment
console.log('🔍 Environment verification:');
console.log('- SKIP_ALL_MIGRATIONS:', process.env.SKIP_ALL_MIGRATIONS);
console.log('- DRIZZLE_DISABLE:', process.env.DRIZZLE_DISABLE);
console.log('- DISABLE_PACKAGE_CACHE:', process.env.DISABLE_PACKAGE_CACHE);

try {
  // Build application
  console.log('📦 Building application with cache bypass...');
  execSync('DISABLE_PACKAGE_CACHE=true npm run build', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  console.log('✅ Build completed successfully');
  
  // Verify build output
  if (!existsSync('dist/index.js')) {
    throw new Error('Build output not found at dist/index.js');
  }
  
  console.log('✅ Build verification passed');
  console.log('🚀 Starting application...');
  
  // Start application
  execSync('node dist/index.js', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
} catch (error) {
  console.error('❌ Enhanced deployment failed:', error.message);
  console.log('\n📞 If this error persists, please contact Replit support with:');
  console.log('- Error: Database migration platform issue');
  console.log('- Migration bypass code implemented but still failing');
  console.log('- Enhanced deployment script with cache bypass applied');
  process.exit(1);
}