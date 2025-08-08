# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DetaWise is a comprehensive trading journal and analytics platform built with Next.js 15, TypeScript, and Prisma. It provides trade tracking, performance analytics, charting integration, and AI-powered insights for traders.

## Essential Commands

### Development
- `npm run dev` - Start development server (default port 3000)
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

### Database Operations
- `npx prisma generate` - Generate Prisma client after schema changes
- `npx prisma migrate dev` - Create and apply new migration
- `npx prisma studio` - Open Prisma Studio for database inspection
- Database file: `prisma/dev.db` (SQLite)

### Testing
- `npm run cypress:run` - Run E2E tests headlessly
- `npm run cypress:open` - Open Cypress test runner
- Chart integration tests available in `cypress/e2e/universal-charts.cy.ts`

## Architecture & Key Systems

### Authentication System
- NextAuth.js with credentials provider (`src/lib/auth.ts`)
- Custom user registration with bcrypt password hashing
- Session management with Prisma adapter
- Protected routes via middleware and auth hooks

### Database Schema (Prisma)
Core entities in `prisma/schema.prisma`:
- **User**: Account management, settings, and trailing drawdown calculations
- **Trade**: Individual trades with P&L calculations and AI summaries
- **CalendarEntry**: Daily trading summaries with mood tracking
- **JournalEntry**: Detailed trade notes and emotional tracking
- **Account/Session**: NextAuth integration
- **BrokerConnection/SyncLog**: Automated trade importing
- **Tags/TradeTag**: Trade categorization system

### Trade Management
- Multi-asset support (Futures, Stocks, Forex, Crypto, Options)
- Automatic P&L calculations with commission and fees
- Duplicate detection and data validation
- CSV import functionality with error handling
- AI-powered trade summaries and habit analysis

### Chart Integration System
Universal chart support with multiple providers:
- **TradesViz Integration**: Primary charting via iframe embeds
- **TradingView**: Advanced charting with subscription support
- **Lightweight Charts**: Fast client-side rendering
- **ApexCharts**: Dashboard analytics

Key files:
- `src/lib/tradesvizUrl.ts` - Asset class detection and URL generation
- `src/components/TradeChart.tsx` - Chart embed component
- `src/lib/tradingViewSymbolMapping.ts` - Symbol mapping logic

### Market Data Services
Hybrid market data system (`src/services/`):
- `hybridMarketData.ts` - Primary service with fallbacks
- `enhancedMarketData.ts` - Advanced data processing
- `marketData.ts` - Base market data interface
- Multiple provider support with automatic failover

### AI Integration
- OpenAI integration for trade analysis and summaries
- Habit pattern recognition and performance insights
- Daily trading summaries with emotional analysis
- API endpoints in `src/app/api/ai/`

## Environment Configuration

Required variables in `.env.local`:
```
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_TRADESVIZ_ENABLED=true  # Enable chart integration
OPENAI_API_KEY=your-openai-key      # For AI features
```

## Code Organization

### Component Structure
- `src/components/Dashboard/` - Dashboard-specific components
- `src/components/ui/` - Reusable UI components
- `src/components/` - Main application components

### Hooks & Utilities
- `src/hooks/` - Custom React hooks for data fetching
- `src/lib/` - Utility functions, validation, and configuration
- `src/types/` - TypeScript type definitions

### API Routes
- `src/app/api/` - Next.js API routes organized by feature
- Database operations use Prisma client (`src/lib/prisma.ts`)
- Error handling and validation in all endpoints

## Development Guidelines

### File Conventions
- TypeScript for all new code
- Tailwind CSS for styling with theme support
- Prisma for database operations
- React Server Components where appropriate

### Chart Development
When working with charts:
1. Check TradesViz integration first (`NEXT_PUBLIC_TRADESVIZ_ENABLED`)
2. Use symbol mapping in `src/lib/tradesvizUrl.ts`
3. Test with multiple asset classes (futures, stocks, forex, crypto)
4. Ensure responsive design and theme compatibility

### Database Changes
1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev`
3. Update relevant TypeScript types
4. Test with existing data

### Performance Considerations
- Chart components are optimized with code splitting
- Database queries use proper indexing
- API responses include caching headers
- Lightweight Charts for performance-critical scenarios

## Standard Workflow
1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the todo.md file with a summary of the changes you made and any other relevant information.

## important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
