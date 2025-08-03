// Configuration to completely disable migrations
export default {
  // Disable all drizzle operations
  skipMigrations: true,
  disableDrizzleKit: true,
  
  // Alternative database strategy
  useDirectConnection: true,
  
  // Environment settings
  production: {
    migrations: false,
    schemaValidation: false,
    autoSync: false
  },
  
  // Deployment settings
  deployment: {
    skipDatabaseChecks: true,
    useExistingSchema: true,
    preserveData: true
  }
};