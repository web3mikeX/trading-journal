import { useState, useEffect, useCallback } from 'react'

interface Trade {
  id: string
  symbol: string
  side: "LONG" | "SHORT"
  entryDate: Date
  exitDate?: Date
  entryPrice: number
  exitPrice?: number
  quantity: number
  netPnL?: number
  status: "OPEN" | "CLOSED" | "CANCELLED"
  strategy?: string
  notes?: string
}

export function useTrades(userId: string) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTrades = useCallback(async () => {
    if (!userId) {
      console.log('useTrades: No userId provided')
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('useTrades: Fetching trades for userId:', userId)
      
      const response = await fetch(`/api/trades?userId=${userId}`, {
        headers: {
          'Cache-Control': 'max-age=60' // 1 minute cache
        }
      })
      
      console.log('useTrades: Response status:', response.status, response.ok)
      
      if (!response.ok) {
        throw new Error('Failed to fetch trades')
      }

      const data = await response.json()
      console.log('useTrades: Raw data received:', data.length, 'trades')
      
      // Convert date strings back to Date objects
      const tradesWithDates = data.map((trade: any) => ({
        ...trade,
        entryDate: new Date(trade.entryDate),
        exitDate: trade.exitDate ? new Date(trade.exitDate) : undefined
      }))
      
      console.log('useTrades: Setting trades with dates:', tradesWithDates.length)
      setTrades(tradesWithDates)
    } catch (err) {
      console.error('useTrades: Error fetching trades:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      console.log('useTrades: Setting loading to false')
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchTrades()
  }, [userId])

  const addTrade = async (tradeData: Omit<Trade, 'id'>) => {
    try {
      setError(null)
      
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...tradeData,
          userId,
          entryDate: tradeData.entryDate.toISOString(),
          exitDate: tradeData.exitDate?.toISOString(),
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add trade')
      }

      const newTrade = await response.json()
      
      // Convert dates and add to state
      const tradeWithDates = {
        ...newTrade,
        entryDate: new Date(newTrade.entryDate),
        exitDate: newTrade.exitDate ? new Date(newTrade.exitDate) : undefined
      }
      
      setTrades(prev => [tradeWithDates, ...prev])
      return tradeWithDates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  const updateTrade = async (tradeId: string, updates: Partial<Omit<Trade, 'id'>>) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/trades/${tradeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updates,
          entryDate: updates.entryDate?.toISOString(),
          exitDate: updates.exitDate?.toISOString(),
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update trade')
      }

      const updatedTrade = await response.json()
      
      // Convert dates and update state
      const tradeWithDates = {
        ...updatedTrade,
        entryDate: new Date(updatedTrade.entryDate),
        exitDate: updatedTrade.exitDate ? new Date(updatedTrade.exitDate) : undefined
      }
      
      setTrades(prev => prev.map(trade => 
        trade.id === tradeId ? tradeWithDates : trade
      ))
      
      return tradeWithDates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  const deleteTrade = async (tradeId: string) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/trades/${tradeId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete trade')
      }

      setTrades(prev => prev.filter(trade => trade.id !== tradeId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  return { 
    trades, 
    loading, 
    error, 
    fetchTrades, 
    addTrade, 
    updateTrade, 
    deleteTrade 
  }
}