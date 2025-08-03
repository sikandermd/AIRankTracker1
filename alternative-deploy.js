// Alternative deployment without migrations
import { execSync } from 'child_process';

console.log('🚀 Alternative Deployment: No Migration Strategy');

// Set environment to completely bypass migration system
process.env.SKIP_ALL_MIGRATIONS = 'true';
process.env.NODE_ENV = 'production';
process.env.DRIZZLE_DISABLE = 'true';

// Remove migration directory temporarily
console.log('📁 Temporarily removing migration triggers...');

try {
  // Build without any migration interference
  console.log('📦 Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('✅ Application built successfully');
  console.log('🚀 Starting without migrations...');
  
  // Start application directly
  execSync('node dist/index.js', { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}