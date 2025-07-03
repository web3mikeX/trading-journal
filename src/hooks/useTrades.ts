import { useState, useEffect } from 'react'

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

  const fetchTrades = async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/trades?userId=${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch trades')
      }

      const data = await response.json()
      
      // Convert date strings back to Date objects
      const tradesWithDates = data.map((trade: any) => ({
        ...trade,
        entryDate: new Date(trade.entryDate),
        exitDate: trade.exitDate ? new Date(trade.exitDate) : undefined
      }))
      
      setTrades(tradesWithDates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

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