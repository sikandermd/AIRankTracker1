// Deployment configuration for migration handling
const config = {
  // Skip migrations during deployment to avoid platform issues
  skipMigrations: process.env.SKIP_MIGRATIONS === 'true' || process.env.NODE_ENV === 'production',
  
  // Environment detection
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // Migration strategy based on environment
  migrationStrategy: function() {
    if (this.skipMigrations) {
      console.log('🚀 Deployment Fix: Migrations disabled due to platform issues');
      console.log('📧 Contact Replit support for database migration platform issue');
      console.log('✅ Using existing database schema without auto-migrations');
      return 'skip';
    }
    return 'auto';
  }
};

module.exports = config;