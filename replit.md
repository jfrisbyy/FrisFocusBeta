# Trust The Process - Habit Tracker

## Overview

Trust The Process is a full-stack habit tracking application that helps users build consistent routines through a point-based system. Users create tasks with point values, log daily completions, and earn bonus points through "boosters" - achievement-based rewards for hitting specific milestones (e.g., logging 5 of 7 days, completing a Bible book, lifting 3 times weekly).

The application provides three main views:
- **Dashboard**: Weekly overview showing total points, daily breakdown, and active boosters
- **Daily**: Date-based task completion with real-time point calculations
- **Tasks**: CRUD interface for managing tasks and configuring custom booster rules

The system emphasizes visual feedback through color-coded point thresholds and progress indicators, motivating users to maintain momentum and "trust the process" of incremental improvement.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, built using Vite for fast development and optimized production builds.

**Routing**: Wouter for lightweight client-side routing with three main routes: Dashboard (/), Daily (/daily), and Tasks (/tasks).

**UI Component Library**: Shadcn/ui (New York style variant) built on Radix UI primitives, providing accessible, unstyled components that are customized through Tailwind CSS. Components are aliased under `@/components/ui` for easy imports.

**Design System**: 
- Dark mode by default with Material Design principles adapted for productivity
- Inspired by Linear and Notion's data-dense interfaces
- Typography hierarchy uses Inter for UI elements and JetBrains Mono for numerical data
- Color-coded visual feedback system (green/yellow/red) for point thresholds
- Consistent spacing using Tailwind's spacing scale (2, 4, 6, 8, 12, 16)

**State Management**: 
- TanStack Query (React Query) for server state management with infinite stale time and disabled refetching
- Local React state (useState) for UI interactions and form handling
- React Hook Form with Zod validation for form state and validation

**Styling**: Tailwind CSS with custom configuration including:
- Custom border radius values (9px, 6px, 3px)
- Extensive HSL-based color system with alpha value support
- Dark mode through class-based variant
- Custom utility classes for elevation effects (hover-elevate, active-elevate-2)

**Key Design Patterns**:
- Component composition with separate presentation and logic
- Custom hooks for reusable logic (use-toast, use-mobile)
- Example components for documentation and testing
- Utility-first approach prioritizing visual clarity and efficiency

### Backend Architecture

**Runtime**: Node.js with Express framework using ES modules (type: "module").

**API Design**: RESTful endpoints prefixed with `/api`, though current implementation shows routes are not yet implemented (empty registerRoutes function).

**Planned API Structure** (based on requirements document):
- `GET /api/v1/tasks` - List all tasks
- `POST/PUT/DELETE /api/v1/tasks/:id` - CRUD operations for tasks
- `GET /api/v1/days?from&to` - Date range query for day logs
- `GET/POST /api/v1/days/:date` - Single day operations with point calculations
- `GET /api/v1/weeks/:weekStart` - Computed weekly summaries with booster logic

**Request Handling**:
- JSON body parsing with raw body preservation for webhook verification
- URL-encoded form data support
- Request logging middleware with timing and response capture
- Static file serving for production builds

**Development vs Production**:
- Development: Vite dev server with HMR over HTTP server
- Production: Pre-built static assets served via Express
- Build process bundles server code with esbuild (ESM to CJS conversion)
- Allowlist bundling for specific dependencies to optimize cold starts

**Error Handling**: Custom logging function with timestamp formatting, source tracking for different parts of the application.

### Data Storage Solutions

**Current Implementation**: In-memory storage using Map-based data structures (MemStorage class).

**Planned Implementation**: PostgreSQL via Drizzle ORM
- Drizzle Kit configured for schema migrations
- Connection via DATABASE_URL environment variable
- Type-safe queries using drizzle-orm and drizzle-zod for validation

**Data Models** (from requirements):
1. **Task**: id, name, value (point value), category, group, isBooster, boosterRule (custom configuration)
2. **DayLog**: date, completedTaskIds, notes, dailyPoints (computed sum)
3. **WeekSummary** (computed): weekStart, dailyTotals, weekTotal, boostersApplied, finalWeekPoints

**Schema Design**:
- Users table with username/password authentication (currently defined but unused)
- Tasks will require JSON or separate table for boosterRule configuration
- DayLogs will store array of completed task IDs
- Weekly summaries computed on-demand from 7 consecutive DayLogs

**Current Schema** (shared/schema.ts):
```typescript
users {
  id: varchar (UUID default)
  username: text (unique, not null)
  password: text (not null)
}
```

**Migration Strategy**: Drizzle Kit push command for schema synchronization.

### External Dependencies

**UI Framework Dependencies**:
- Radix UI primitives (18+ components: dialogs, popovers, dropdowns, etc.)
- class-variance-authority for component variant management
- tailwind-merge + clsx for className utilities
- lucide-react for icon system

**Form and Validation**:
- react-hook-form for form state management
- @hookform/resolvers for Zod integration
- zod for runtime type validation
- drizzle-zod for database schema validation

**Date Handling**:
- date-fns for date manipulation, formatting, and calculations
- Used extensively for weekly calculations and date pickers

**Data Fetching**:
- @tanstack/react-query (v5) for server state management
- Custom queryClient configuration with fetch-based API requests

**Database and ORM**:
- drizzle-orm for type-safe database queries
- drizzle-kit for migrations
- pg (implied by drizzle config) for PostgreSQL connection
- connect-pg-simple for session storage (though sessions not implemented)

**Development Tools**:
- Vite for build tooling and dev server
- tsx for TypeScript execution
- esbuild for server bundling
- @replit/vite-plugin-* for Replit-specific features

**Build and Runtime**:
- Express for HTTP server
- express-session (installed but unused)
- nanoid for ID generation

**Testing Attributes**: Component test IDs (data-testid) throughout for potential E2E testing setup.

**Production Optimizations**:
- Dependency bundling via esbuild reduces syscall overhead
- Static asset serving with fallback to index.html for SPA routing
- Source map support via @jridgewell/trace-mapping