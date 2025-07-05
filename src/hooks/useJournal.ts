import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface JournalEntry {
  id: string
  title: string
  content: string
  entryType: 'PRE_TRADE' | 'DURING_TRADE' | 'POST_TRADE' | 'GENERAL' | 'LESSON'
  mood?: number
  confidence?: number
  fear?: number
  excitement?: number
  tradeId?: string
  createdAt: string
  updatedAt: string
  trade?: {
    id: string
    symbol: string
    side: string
    entryDate: string
    exitDate: string | null
    status: string
  }
}

interface CreateJournalEntryData {
  title: string
  content: string
  entryType?: 'PRE_TRADE' | 'DURING_TRADE' | 'POST_TRADE' | 'GENERAL' | 'LESSON'
  mood?: number
  confidence?: number
  fear?: number
  excitement?: number
  tradeId?: string
}

interface UpdateJournalEntryData {
  title?: string
  content?: string
  entryType?: 'PRE_TRADE' | 'DURING_TRADE' | 'POST_TRADE' | 'GENERAL' | 'LESSON'
  mood?: number
  confidence?: number
  fear?: number
  excitement?: number
  tradeId?: string
}

interface JournalResponse {
  entries: JournalEntry[]
  totalCount: number
  hasMore: boolean
}

export const useJournal = () => {
  const { data: session } = useSession()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  // Fetch journal entries
  const fetchEntries = async (
    search?: string,
    entryType?: string,
    tradeId?: string,
    limit = 50,
    offset = 0,
    append = false
  ) => {
    if (!session?.user?.id) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        userId: session.user.id,
        limit: limit.toString(),
        offset: offset.toString()
      })

      if (search) params.append('search', search)
      if (entryType) params.append('entryType', entryType)
      if (tradeId) params.append('tradeId', tradeId)

      const response = await fetch(`/api/journal?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch journal entries')
      }

      const data: JournalResponse = await response.json()
      
      if (append) {
        setEntries(prev => [...prev, ...data.entries])
      } else {
        setEntries(data.entries)
      }
      
      setHasMore(data.hasMore)
      setTotalCount(data.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch journal entries')
    } finally {
      setLoading(false)
    }
  }

  // Create new journal entry
  const createEntry = async (data: CreateJournalEntryData): Promise<JournalEntry | null> => {
    if (!session?.user?.id) return null

    setError(null)

    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userId: session.user.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create journal entry')
      }

      const newEntry: JournalEntry = await response.json()
      setEntries(prev => [newEntry, ...prev])
      setTotalCount(prev => prev + 1)
      
      return newEntry
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create journal entry')
      return null
    }
  }

  // Update journal entry
  const updateEntry = async (id: string, data: UpdateJournalEntryData): Promise<JournalEntry | null> => {
    if (!session?.user?.id) return null

    setError(null)

    try {
      const response = await fetch(`/api/journal/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userId: session.user.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update journal entry')
      }

      const updatedEntry: JournalEntry = await response.json()
      setEntries(prev => prev.map(entry => 
        entry.id === id ? updatedEntry : entry
      ))
      
      return updatedEntry
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update journal entry')
      return null
    }
  }

  // Delete journal entry
  const deleteEntry = async (id: string): Promise<boolean> => {
    if (!session?.user?.id) return false

    setError(null)

    try {
      const response = await fetch(`/api/journal/${id}?userId=${session.user.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete journal entry')
      }

      setEntries(prev => prev.filter(entry => entry.id !== id))
      setTotalCount(prev => prev - 1)
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete journal entry')
      return false
    }
  }

  // Get journal entry by ID
  const getEntry = async (id: string): Promise<JournalEntry | null> => {
    if (!session?.user?.id) return null

    setError(null)

    try {
      const response = await fetch(`/api/journal/${id}?userId=${session.user.id}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch journal entry')
      }

      const entry: JournalEntry = await response.json()
      return entry
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch journal entry')
      return null
    }
  }

  // Load more entries (for pagination)
  const loadMore = () => {
    if (!hasMore || loading) return
    fetchEntries(undefined, undefined, undefined, 50, entries.length, true)
  }

  // Initial load
  useEffect(() => {
    if (session?.user?.id) {
      fetchEntries()
    }
  }, [session?.user?.id])

  return {
    entries,
    loading,
    error,
    hasMore,
    totalCount,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    getEntry,
    loadMore
  }
}

export type { JournalEntry, CreateJournalEntryData, UpdateJournalEntryData }