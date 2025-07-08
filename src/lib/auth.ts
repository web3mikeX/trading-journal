import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null
        
        // Demo mode - accept any email and create user if not exists
        const userId = `demo-${credentials.email.replace(/[^a-zA-Z0-9]/g, '-')}`
        
        try {
          // Check if user exists, if not create it
          const existingUser = await prisma.user.findUnique({
            where: { id: userId }
          })
          
          if (!existingUser) {
            await prisma.user.create({
              data: {
                id: userId,
                email: credentials.email,
                name: credentials.email.split('@')[0],
                image: null,
              }
            })
          }
        } catch (error) {
          console.error('Error creating demo user:', error)
          // Continue anyway - the user might already exist
        }
        
        return {
          id: userId,
          email: credentials.email,
          name: credentials.email.split('@')[0],
          image: null,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  events: {
    async signOut() {
      // Clear any additional session data if needed
    },
  },
}