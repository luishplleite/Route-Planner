# RotaCerta - Delivery Route Management System

## Overview

RotaCerta is a Progressive Web App (PWA) designed for autonomous delivery drivers in Brazil. The application provides intelligent route optimization, real-time delivery tracking, and financial management tools. Key features include voice-enabled address input, Mapbox-powered route optimization (TSP algorithm), visual delivery status management with map markers, and automatic earnings calculation (R$ 2.80 per delivery with Sunday bonuses).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with TypeScript, bundled via Vite
- **Styling**: Tailwind CSS 4 with custom utility design system (Inter + Oswald fonts)
- **UI Components**: Shadcn/ui component library (New York style variant)
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for client-side navigation
- **Maps Integration**: Mapbox GL JS via react-map-gl for map rendering, geocoding, and route optimization

### Backend Architecture
- **Runtime**: Node.js with Express
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod validation schemas
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Session Management**: express-session with connect-pg-simple for PostgreSQL-backed sessions

### Data Storage
- **Database**: PostgreSQL (provisioned via Replit)
- **Schema Location**: `shared/schema.ts` defines all tables using Drizzle
- **Core Tables**:
  - `users` - User accounts (managed by Replit Auth)
  - `sessions` - Session storage for authentication
  - `itineraries` - Daily route plans with status and earnings
  - `stops` - Individual delivery stops with coordinates, status, and sequence order
  - `financialSummaries` - Aggregated earnings reports

### Authentication
- **Provider**: Replit Auth (OpenID Connect)
- **Implementation**: Passport.js with openid-client strategy
- **Session Storage**: PostgreSQL-backed sessions with 1-week TTL
- **Protected Routes**: `isAuthenticated` middleware guards API endpoints

### Key Design Patterns
- **Shared Schema**: Types and validation schemas shared between frontend and backend via `@shared/*` imports
- **API Contract**: Route definitions with input/output Zod schemas in `shared/routes.ts`
- **Component Architecture**: Reusable UI components in `client/src/components/ui/`, domain components in `client/src/components/`
- **Custom Hooks**: `use-auth.ts`, `use-itineraries.ts` encapsulate data fetching logic

## External Dependencies

### Mapbox Services
- **Geocoding API v6**: Address-to-coordinates conversion with autocomplete
- **Directions API v5**: Route calculation and turn-by-turn navigation
- **Optimization API v1**: TSP algorithm for multi-stop route optimization
- **Token**: Expected via `VITE_MAPBOX_TOKEN` environment variable

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migrations via `npm run db:push`

### Authentication
- **Replit Auth**: OpenID Connect provider at `https://replit.com/oidc`
- **Session Secret**: Required via `SESSION_SECRET` environment variable

### Browser APIs
- **Web Speech API**: Voice input for address entry using `SpeechRecognition`
- **Geolocation**: For user location and proximity-based search