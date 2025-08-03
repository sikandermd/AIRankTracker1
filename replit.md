# AI Ranking Tracker

## Overview

This is a full-stack web application that monitors brand visibility across popular AI search engines like ChatGPT, Claude, Gemini, and Perplexity. The application provides an interactive dashboard for tracking brand mentions in AI responses, analyzing competitor presence, and managing keyword tracking campaigns.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Session Storage**: PostgreSQL-based sessions with connect-pg-simple
- **AI Integration**: OpenAI GPT-4o for analyzing AI responses

## Key Components

### Database Schema
The application uses a relational database with the following main entities:
- **Users**: Authentication and user management
- **Brands**: Companies/products being tracked
- **Keywords**: Search terms to monitor across AI platforms
- **Tracking Results**: Historical data of brand mentions in AI responses
- **Competitor Analysis**: Comparative brand performance data
- **Alerts**: Notification system for significant changes

### Core Services
- **Tracking Service**: Orchestrates keyword monitoring across multiple AI platforms
- **AI Analyzer**: Uses OpenAI GPT-4o to analyze AI responses for brand mentions, position, and competitor presence
- **Storage Layer**: Abstracted data access layer with comprehensive CRUD operations

### Frontend Components
- **Dashboard**: Main interface showing stats overview, recent activity, and competitor analysis
- **Search Filters**: Multi-platform keyword submission with brand and date filtering
- **Results Table**: Displays tracking results with detailed breakdown by AI platform
- **Detail Modal**: Deep-dive analysis for individual keyword performance
- **Google Sheets Import**: Modal for importing keywords directly from Google Sheets with validation and error handling

## Data Flow

1. **Keyword Submission**: Users input keywords and select AI platforms to monitor
2. **AI Platform Querying**: System queries each selected AI platform with the keywords
3. **Response Analysis**: OpenAI GPT-4o analyzes responses for brand mentions, position, and competitors
4. **Data Storage**: Results are stored with metadata including confidence scores and analysis data
5. **Dashboard Updates**: Real-time updates to the dashboard showing latest tracking results
6. **Competitor Tracking**: Automatic identification and tracking of competitor brand mentions

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Connection Pooling**: Built-in connection pooling for optimal performance

### AI Services
- **OpenAI API**: GPT-4o model for intelligent analysis of AI responses
- **Multi-platform Support**: Designed to integrate with ChatGPT, Claude, Gemini, and Perplexity APIs

### Google Services
- **Google Sheets API**: For importing keywords directly from spreadsheets
- **Service Account Authentication**: Secure API access without manual login

### Development Tools
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Production bundling for server-side code
- **PostCSS**: CSS processing with Tailwind CSS

### UI Libraries
- **Radix UI**: Accessible, unstyled UI primitives
- **Lucide React**: Icon library
- **Date-fns**: Date manipulation utilities
- **Class Variance Authority**: Utility for managing component variants

## Deployment Strategy

### Development
- **Hot Reloading**: Vite development server with Express middleware
- **Type Checking**: Real-time TypeScript compilation
- **Database Migrations**: Drizzle push for schema changes

### Production
- **Build Process**: Vite builds the client, ESBuild bundles the server
- **Static Assets**: Client build served from Express static middleware
- **Environment Variables**: Database URL and API keys via environment configuration
- **Session Management**: Persistent sessions using PostgreSQL storage

### Architecture Benefits
- **Type Safety**: End-to-end TypeScript ensures compile-time error catching
- **Performance**: Optimized builds with code splitting and tree shaking
- **Scalability**: Serverless database with connection pooling
- **Maintainability**: Clear separation of concerns with service layer abstraction
- **Real-time Updates**: React Query provides automatic data synchronization

The application is structured as a monorepo with shared schemas between client and server, ensuring consistent data types across the full stack.

## Recent Changes (August 2025)

### Organic Keywords Tracking Complete ✅
- Added separate "Organic SEO" tab for Google Search Console integration
- Country-specific keyword tracking with 8+ countries (US, India, UK, etc.)
- Real-time position monitoring with Search Console API sync
- Domain-based tracking with position history and trends
- Clean, fast interface optimized for performance
- Automatic position updates with click-through rates and impressions
- Setup guide created: SEARCH_CONSOLE_SETUP.md

### Search Console API Integration
- Google Search Console service for real keyword positions
- Supports verified domains and site properties
- Rate-limited API calls with automatic delays
- Historical position tracking with ranking changes
- Landing page URL identification for each keyword
- Country-specific search data (usa, ind, gbr, etc.)
- Service account authentication for secure access

### Email Integration Complete ✅
- Successfully integrated Brevo email service with verified sender domain
- Fixed sender authentication using jason@notifyvisitorsmail.com
- Alert creation emails now delivering successfully to inbox
- Beautiful HTML email templates with position tracking and brand styling
- All 4 alert notification types working: mention_change, position_improve, new_platform, mention_increase
- Position details displayed in subject lines and email content with color coding
- Email notifications fully operational for all alert triggers and creation confirmations

### Alert System Database Fixes
- Fixed critical alert creation database schema issues by adding missing columns
- Added brand_id, keyword_id, platforms, trigger_conditions, notification_methods, last_triggered, updated_at columns
- Removed NOT NULL constraint from legacy alert_type column to maintain compatibility
- Alert creation functionality now working properly with proper validation
- All API parameter order issues fixed across the application (apiRequest method calls)

### UI Improvements
- Updated primary button color to orange (#FB9A4E) across entire application
- Fixed navigation menu by restoring Keywords option access
- Resolved duplicate keyword prevention system
- Optimized API usage from polling to on-demand fetching
- Added 1-minute server-side caching for usage stats

### Database Updates
- Added 6 new brands to production: mParticle, Treasure Data, Insider, Netcore Cloud, WebEngage, MoEngage
- Proper database population with original brands plus new additions
- Alert system fully operational with proper schema

## Previous Changes (January 2025)

### Google Sheets Integration
- Added Google Sheets API integration using googleapis package
- Created GoogleSheetsImportModal component for keyword import
- Implemented server-side Google Sheets service with authentication
- Added API endpoints for sheet info retrieval and keyword import
- Expected sheet format: Column A (Keywords), Column B (Category), Column C (Brand), Column D (Platforms)
- Automatic brand creation if brand doesn't exist
- Duplicate keyword detection and skipping
- Error handling for invalid sheets or API issues
- Integration with QuickActions component for easy access

### CSV Import Alternative
- Created CSVImportModal component as Google Sheets alternative
- Direct file upload without external API dependencies
- Downloadable CSV template for proper formatting
- Real-time preview of uploaded data
- Batch processing with error handling and progress reporting

### Keywords Library Page
- Dedicated /keywords route for comprehensive keyword management
- Search and filter functionality by keyword text, brand, and category
- Statistics overview showing total keywords, brands, and categories
- Individual keyword details with platform tracking settings
- Delete functionality for keyword management
- Navigation integration with main app structure

### Platform Icons & Branding
- Added authentic AI platform icons using react-icons package
- OpenAI (ChatGPT), Anthropic (Claude), Google (Gemini) official icons
- Custom Perplexity icon with brand colors
- Platform badges with proper color schemes throughout the app
- Consistent icon usage in search filters, results tables, and navigation

### Navigation & Quick Actions
- Moved Quick Actions from homepage to navigation dropdown menu
- Clean navigation bar with Dashboard, Keywords, and Analytics tabs
- Quick Actions dropdown includes: Add Keywords, Import CSV, Import from Sheets, Generate Report, Setup Alerts
- All modals accessible from navigation menu with proper icons
- Removed QuickActions component from dashboard for cleaner layout
- Welcome message on dashboard when no search performed

### Setup Requirements
To use Google Sheets import:
1. Create Google Cloud project and enable Google Sheets API
2. Create service account and download JSON key
3. Set GOOGLE_SERVICE_ACCOUNT_KEY environment variable with JSON content
4. Share target Google Sheets with service account email