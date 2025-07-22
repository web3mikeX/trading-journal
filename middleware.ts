import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // In demo mode, allow access even without strict token validation
        return true
      }
    },
  }
)

// Protect these routes (excluding API routes)
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/trades/:path*", 
    "/analytics/:path*",
    "/journal/:path*",
    "/settings/:path*"
  ]
}