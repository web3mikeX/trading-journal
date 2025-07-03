"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"

interface AuthContextType {
  isAuthenticated: boolean
  user: { name: string; email: string } | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedAuth = localStorage.getItem("auth")
    console.log("AuthProvider mounted, checking localStorage:", savedAuth)
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth)
        console.log("Found saved auth data:", authData)
        setIsAuthenticated(true)
        setUser(authData.user)
      } catch (error) {
        console.error("Error parsing saved auth data:", error)
        localStorage.removeItem("auth")
      }
    } else {
      console.log("No saved auth data found")
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log("Login attempt:", { email, password })
    // Simple demo authentication - trim whitespace and check multiple valid combinations
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPassword = password.trim()
    
    console.log("Trimmed values:", { trimmedEmail, trimmedPassword })
    
    if ((trimmedEmail === "demo@example.com" && trimmedPassword === "password") ||
        (trimmedEmail === "demo" && trimmedPassword === "password") ||
        (trimmedEmail === "admin" && trimmedPassword === "admin")) {
      console.log("Login successful!")
      const userData = { name: "Demo User", email: trimmedEmail }
      setIsAuthenticated(true)
      setUser(userData)
      localStorage.setItem("auth", JSON.stringify({ user: userData }))
      return true
    }
    console.log("Login failed - credentials don't match any valid combinations")
    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem("auth")
    router.push("/auth/signin")
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}