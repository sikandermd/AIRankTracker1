# AI Ranking Tracker

## Overview
This full-stack web application monitors and analyzes brand visibility across major AI search engines (ChatGPT, Claude, Gemini, Perplexity). Its core purpose is to provide an interactive dashboard for tracking brand mentions, analyzing competitor presence, and managing keyword campaigns within AI responses. The project aims to be a leading tool for brand managers and marketers to understand and improve their AI SEO performance.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (August 5, 2025)
- **Deployment Fix**: Implemented comprehensive migration-free deployment solution to resolve Replit platform infrastructure issues
- **Console Errors**: Fixed JavaScript errors in AI Recommendations page (removed unused Brain import)
- **Production Startup**: Created `start-production.js` script that bypasses all database migration attempts
- **Database Optimization**: Enhanced connection settings for deployment stability
- **Configuration**: Updated replit.toml with migration-free deployment approach

## System Architecture

### UI/UX Decisions
The application uses Radix UI components with shadcn/ui for styling, built on Tailwind CSS with CSS variables for theming. Key UI components include a dashboard for overview, search filters for multi-platform keyword submission, results tables, and detail modals for in-depth analysis. The design prioritizes a clean, fast interface optimized for performance, featuring consistent AI-themed branding and intuitive navigation with an "🤖 AI Visibility Inspector" naming convention. Visual elements include platform-specific icons and color-coded badges for metrics like position tracking.

### Technical Implementations
-   **Frontend**: React 18 with TypeScript, Vite, Wouter for routing, TanStack Query for state management, React Hook Form with Zod for forms.
-   **Backend**: Node.js with Express.js REST API, TypeScript with ES modules.
-   **Database**: PostgreSQL (configured for Neon serverless) with Drizzle ORM for type-safe operations.
-   **Session Management**: PostgreSQL-based sessions using `connect-pg-simple`.
-   **AI Integration**: OpenAI GPT-4o for analyzing AI responses.
-   **Core Services**: Tracking Service orchestrates keyword monitoring, AI Analyzer uses GPT-4o for brand mention analysis, and a Storage Layer provides abstract data access.
-   **Data Flow**: Involves keyword submission, querying AI platforms, OpenAI analysis of responses, data storage with metadata, dashboard updates, and automatic competitor tracking.
-   **Monorepo Structure**: Shared schemas between client and server ensure consistent data types.

### Feature Specifications
-   **Keyword Management**: Comprehensive keyword library with search, filter, and delete functionality. Supports import from Google Sheets (with automatic brand creation and duplicate detection) and CSV.
-   **Position Tracking**: Automatic and manual position tracking for organic keywords across Google Search Console, with country-specific tracking, position history, and trend indicators.
-   **Alert System**: Configurable alerts for mention changes, position improvements, new platform mentions, and mention increases, delivered via Brevo email service with detailed HTML templates.
-   **Reporting**: Generates reports based on tracking data.

## External Dependencies

### Database
-   **Neon PostgreSQL**: Serverless PostgreSQL database.

### AI Services
-   **OpenAI API**: GPT-4o model for analyzing AI responses.
-   **Integration with**: ChatGPT, Claude, Gemini, and Perplexity APIs.

### Google Services
-   **Google Sheets API**: For importing keywords from spreadsheets, using service account authentication.
-   **Google Search Console API**: For organic keyword position tracking and historical data, using service account authentication.

### Email Service
-   **Brevo**: For sending alert notifications and confirmations.

### Development Tools
-   **Drizzle Kit**: For database migrations and schema management.
-   **ESBuild**: For production bundling of server-side code.
-   **PostCSS**: For CSS processing with Tailwind CSS.

### UI Libraries
-   **Radix UI**: Accessible, unstyled UI primitives.
-   **Lucide React**: Icon library.
-   **Date-fns**: Date manipulation utilities.
-   **Class Variance Authority**: Utility for managing component variants.
-   **React-icons**: For AI platform icons.