import { useSession } from "next-auth/react"

export function useAuth() {
  const { data: session, status } = useSession()
  
  return {
    user: session?.user || null,
    isAuthenticated: !!session,
    isLoading: status === "loading",
  }
}