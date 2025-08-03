// Pre-deployment script to handle migration platform issues
// This script runs before deployment to ensure migrations are properly skipped

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Pre-deployment: Handling migration platform issues');

// Set environment variables for migration skip
process.env.SKIP_MIGRATIONS = 'true';
process.env.NODE_ENV = 'production';

const migrationsDir = path.join(__dirname, 'migrations');

// Ensure migrations directory exists
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
  console.log('📁 Created migrations directory');
}

// Create deployment marker file
const deploymentMarker = path.join(migrationsDir, 'DEPLOYMENT_SKIP_ENABLED');
fs.writeFileSync(deploymentMarker, JSON.stringify({
  timestamp: new Date().toISOString(),
  reason: 'Database migration platform issues',
  skipMigrations: true,
  contactSupport: 'Replit support for database migration platform issue'
}, null, 2));

console.log('✅ Migration skip configured for deployment');
console.log('📧 Contact Replit support for database migration platform issue');
console.log('💡 Application will use existing database schema');

// Exit successfully
process.exit(0);