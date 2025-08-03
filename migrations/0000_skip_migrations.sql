-- Migration skip file for deployment platform issues
-- This file prevents automatic migrations during deployment
-- Contact Replit support for database migration platform issue
-- Application will use existing database schema without changes

SELECT 'Migrations skipped - using existing schema' as deployment_status;