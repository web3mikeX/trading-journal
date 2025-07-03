import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

// Protect these routes
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/trades/:path*",
    "/analytics/:path*",
    "/journal/:path*",
    "/settings/:path*",
    "/api/trades/:path*",
    "/api/users/:path*",
    "/api/stats/:path*"
  ]
}