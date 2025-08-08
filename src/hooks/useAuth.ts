import { useSession } from "next-auth/react"

export function useAuth() {
  const { data: session, status } = useSession()
  
  return {
    user: session?.user ? {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    } : null,
    isAuthenticated: !!session?.user,
    isLoading: status === "loading",
  }
}