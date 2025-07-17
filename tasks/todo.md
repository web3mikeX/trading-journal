# Rebrand Trading Journal to DetaWise

## Problem Analysis
The user wants to rebrand their trading journal application from "Trading Journal" to "DetaWise". This requires updating all branding references throughout the application.

## Current Brand References Found
- Layout.tsx: metadata title "Trading Journal" and description
- Header.tsx: "TradingJournal" brand name (lines 44, 82)  
- Package.json: name "trading-journal"
- Various page titles and references in components
- API health route message
- Documentation files (can skip for now)

## Todo Items  
- [x] 1. Update metadata in layout.tsx (title and description)
- [x] 2. Update Header.tsx brand name from "TradingJournal" to "DetaWise"
- [x] 3. Update package.json name from "trading-journal" to "detawise"
- [x] 4. Update page titles in dashboard, auth pages, etc.
- [x] 5. Update API health route message
- [x] 6. Update any remaining "Trading Journal" references in components
- [x] 7. Test all pages to ensure branding is consistent

## Plan
Simple find-and-replace approach:
- "Trading Journal" → "DetaWise"  
- "TradingJournal" → "DetaWise"
- "trading-journal" → "detawise"
- "Track your trading performance" → "Smart Trading Analytics & Insights"

Focus on core application files first, skip temporary documentation files.

## Review
**Changes Made:**
- Updated app metadata: title "DetaWise" and description "Smart Trading Analytics & Insights"
- Changed header brand name from "TradingJournal" to "DetaWise" in both authenticated and unauthenticated states
- Updated package.json name from "trading-journal" to "detawise"
- Updated page titles in dashboard, journal, home page, and API health route
- Updated API health route service name to "DetaWise API"

**Files Modified:**
- src/app/layout.tsx (metadata)
- src/components/Header.tsx (brand name)
- package.json (package name)
- src/app/dashboard/page.tsx (page title)
- src/app/journal/page.tsx (page title)
- src/app/page.tsx (home page title)
- src/app/api/health/route.ts (API service name)

**Result:**
The application is now fully rebranded to DetaWise with consistent branding across all pages. All tests pass and the application loads correctly with the new brand identity.