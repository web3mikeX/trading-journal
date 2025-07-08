'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard')
      } else {
        router.push('/auth/signin')
      }
    }
  }, [isAuthenticated, isLoading, router])
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Trading Journal</h1>
        <p className="text-gray-600">
          {isLoading ? 'Loading...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  )
}
