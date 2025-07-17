# Fix NextAuth CLIENT_FETCH_ERROR

## Problem Analysis
The localhost:3000 is getting a NextAuth CLIENT_FETCH_ERROR "Failed to fetch" error. This typically occurs when:
1. NextAuth API routes are not accessible
2. There's a configuration issue with the auth setup
3. The SessionProvider is trying to fetch session data but can't reach the API

## Current State
- The app uses NextAuth with SessionProvider
- Auth is configured with credentials provider
- useAuth hook bypasses NextAuth and returns hardcoded demo user
- Layout wraps app with ClientAuthProvider > AuthProvider > SessionProvider

## Todo Items
- [x] 1. Check if NextAuth API route is accessible at /api/auth/session
- [x] 2. Verify environment variables are properly set
- [x] 3. Test if the auth API endpoints are working
- [x] 4. Check for any NEXTAUTH_URL configuration issues
- [x] 5. Consider if the hardcoded demo mode in useAuth is conflicting with SessionProvider
- [x] 6. Fix the CLIENT_FETCH_ERROR by addressing root cause

## Plan
Since the useAuth hook completely bypasses NextAuth and returns a hardcoded demo user, but the SessionProvider is still trying to fetch session data, this creates a conflict. The simplest fix is to either:
1. Remove SessionProvider since auth is bypassed, OR
2. Configure SessionProvider to not auto-fetch when in demo mode

Option 1 is simpler and aligns with the current demo-only approach.

## Review
**Changes Made:**
- Removed SessionProvider from AuthProvider.tsx since authentication is completely bypassed in favor of demo mode
- This eliminates the CLIENT_FETCH_ERROR by preventing NextAuth from trying to fetch session data
- The app now uses only the hardcoded demo user from useAuth.ts without any NextAuth session management

**Result:**
The NextAuth CLIENT_FETCH_ERROR should be resolved as SessionProvider is no longer trying to fetch session data from NextAuth APIs that conflict with the demo mode implementation.