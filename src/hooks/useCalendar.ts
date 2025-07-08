import { useState, useEffect } from 'react'

interface CalendarDayData {
  date: string
  pnl: number
  tradesCount: number
  winRate: number
  hasNotes: boolean
  hasImages: boolean
  mood?: number
  notes?: string
  images?: string[]
  trades?: Trade[]
}

interface Trade {
  id: string
  symbol: string
  side: 'LONG' | 'SHORT'
  entryPrice: number
  exitPrice?: number
  quantity: number
  netPnL?: number
  status: 'OPEN' | 'CLOSED' | 'CANCELLED'
  entryDate: Date
  exitDate?: Date
}

interface MonthlyData {
  yearMonth: string
  monthlyPnL: number
  calendarData: { [date: string]: CalendarDayData }
  totalTrades: number
  tradingDays: number
}

interface UseCalendarReturn {
  monthlyData: MonthlyData | null
  dayData: CalendarDayData | null
  loading: boolean
  error: string | null
  fetchMonthlyData: (year: number, month: number) => Promise<void>
  fetchDayData: (date: string) => Promise<void>
  saveDayData: (date: string, data: { notes?: string; mood?: number; images?: string[] }) => Promise<void>
  refreshData: () => Promise<void>
}

export function useCalendar(userId: string | undefined): UseCalendarReturn {
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null)
  const [dayData, setDayData] = useState<CalendarDayData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState({ year: 0, month: 0 })

  const fetchMonthlyData = async (year: number, month: number) => {
    if (!userId) return

    setLoading(true)
    setError(null)
    
    try {
      const yearMonth = `${year}-${String(month + 1).padStart(2, '0')}`
      const response = await fetch(`/api/calendar/month/${yearMonth}?userId=${userId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch monthly data: ${response.statusText}`)
      }
      
      const data = await response.json()
      setMonthlyData(data)
      setCurrentMonth({ year, month })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch monthly data'
      setError(errorMessage)
      console.error('Error fetching monthly data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDayData = async (date: string) => {
    if (!userId) return

    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/calendar/${date}?userId=${userId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch day data: ${response.statusText}`)
      }
      
      const data = await response.json()
      setDayData(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch day data'
      setError(errorMessage)
      console.error('Error fetching day data:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveDayData = async (
    date: string, 
    data: { notes?: string; mood?: number; images?: string[] }
  ) => {
    if (!userId) return

    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/calendar/${date}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          notes: data.notes?.trim() || undefined,
          mood: data.mood,
          images: data.images && data.images.length > 0 ? data.images : undefined
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to save day data: ${response.statusText}`)
      }
      
      const updatedData = await response.json()
      setDayData(updatedData)
      
      // Update monthly data if it exists
      if (monthlyData && monthlyData.calendarData[date]) {
        setMonthlyData(prev => {
          if (!prev) return prev
          return {
            ...prev,
            calendarData: {
              ...prev.calendarData,
              [date]: {
                ...prev.calendarData[date],
                hasNotes: updatedData.hasNotes,
                hasImages: updatedData.hasImages,
                mood: updatedData.mood
              }
            }
          }
        })
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save day data'
      setError(errorMessage)
      console.error('Error saving day data:', err)
      throw err // Re-throw so the calling component can handle it
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    if (currentMonth.year > 0) {
      await fetchMonthlyData(currentMonth.year, currentMonth.month)
    }
  }

  // Clear error after a delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return {
    monthlyData,
    dayData,
    loading,
    error,
    fetchMonthlyData,
    fetchDayData,
    saveDayData,
    refreshData
  }
}