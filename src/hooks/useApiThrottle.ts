"use client"

import { useRef, useCallback } from 'react'

interface ApiCallRecord {
  url: string
  timestamp: number
  count: number
}

const MAX_CALLS_PER_MINUTE = 30
const MAX_CALLS_PER_SECOND = 3

export function useApiThrottle() {
  const callsRef = useRef<Map<string, ApiCallRecord>>(new Map())

  const shouldThrottle = useCallback((url: string): boolean => {
    const now = Date.now()
    const record = callsRef.current.get(url)
    
    if (!record) {
      callsRef.current.set(url, {
        url,
        timestamp: now,
        count: 1
      })
      return false
    }
    
    const timeDiff = now - record.timestamp
    
    // Reset counter if more than 1 minute has passed
    if (timeDiff > 60000) {
      callsRef.current.set(url, {
        url,
        timestamp: now,
        count: 1
      })
      return false
    }
    
    // Check if we're making too many calls per second
    if (timeDiff < 1000 && record.count >= MAX_CALLS_PER_SECOND) {
      console.warn(`API throttled: Too many calls to ${url} (${record.count} calls in ${timeDiff}ms)`)
      return true
    }
    
    // Check if we're making too many calls per minute
    if (record.count >= MAX_CALLS_PER_MINUTE) {
      console.warn(`API throttled: Too many calls to ${url} (${record.count} calls in ${timeDiff}ms)`)
      return true
    }
    
    // Update the record
    record.count++
    record.timestamp = now
    
    return false
  }, [])

  const trackApiCall = useCallback((url: string) => {
    const now = Date.now()
    const record = callsRef.current.get(url)
    
    if (!record) {
      callsRef.current.set(url, {
        url,
        timestamp: now,
        count: 1
      })
    } else {
      record.count++
      record.timestamp = now
    }
  }, [])

  const getCallStats = useCallback((url: string) => {
    const record = callsRef.current.get(url)
    if (!record) return null
    
    const now = Date.now()
    const timeDiff = now - record.timestamp
    
    return {
      count: record.count,
      lastCallTime: record.timestamp,
      timeSinceLastCall: timeDiff
    }
  }, [])

  return {
    shouldThrottle,
    trackApiCall,
    getCallStats
  }
}