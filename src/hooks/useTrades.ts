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
      
      // Optimistic update - add trade to UI immediately with temporary ID
      const tempId = `temp-${Date.now()}`
      const optimisticTrade = {
        ...tradeData,
        id: tempId
      }
      
      setTrades(prev => [optimisticTrade, ...prev])
      console.log('⚡ Optimistic add applied for trade:', tempId)
      
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
        // Rollback optimistic update on error
        console.log('❌ Rolling back optimistic add for trade:', tempId)
        setTrades(prev => prev.filter(trade => trade.id !== tempId))
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add trade')
      }

      const newTrade = await response.json()
      
      // Convert dates and replace optimistic trade with real trade
      const tradeWithDates = {
        ...newTrade,
        entryDate: new Date(newTrade.entryDate),
        exitDate: newTrade.exitDate ? new Date(newTrade.exitDate) : undefined
      }
      
      setTrades(prev => prev.map(trade => 
        trade.id === tempId ? tradeWithDates : trade
      ))
      
      console.log('✅ Server add confirmed for trade:', newTrade.id)
      return tradeWithDates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  const updateTrade = async (tradeId: string, updates: Partial<Omit<Trade, 'id'>>) => {
    try {
      setError(null)
      
      // Optimistic update - update UI immediately
      const optimisticTrade = {
        ...updates,
        id: tradeId,
        entryDate: updates.entryDate || new Date(),
        exitDate: updates.exitDate || undefined
      }
      
      // Store original trade for rollback
      let originalTrade: Trade | undefined
      setTrades(prev => {
        originalTrade = prev.find(trade => trade.id === tradeId)
        return prev.map(trade => 
          trade.id === tradeId ? { ...trade, ...optimisticTrade } : trade
        )
      })
      
      console.log('⚡ Optimistic update applied for trade:', tradeId)
      
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
        // Rollback optimistic update on error
        if (originalTrade) {
          console.log('❌ Rolling back optimistic update for trade:', tradeId)
          setTrades(prev => prev.map(trade => 
            trade.id === tradeId ? originalTrade! : trade
          ))
        }
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update trade')
      }

      const updatedTrade = await response.json()
      
      // Convert dates and update state with server response
      const tradeWithDates = {
        ...updatedTrade,
        entryDate: new Date(updatedTrade.entryDate),
        exitDate: updatedTrade.exitDate ? new Date(updatedTrade.exitDate) : undefined
      }
      
      setTrades(prev => prev.map(trade => 
        trade.id === tradeId ? tradeWithDates : trade
      ))
      
      console.log('✅ Server update confirmed for trade:', tradeId)
      return tradeWithDates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  const deleteTrade = async (tradeId: string) => {
    try {
      setError(null)
      
      // Optimistic update - remove trade from UI immediately
      let deletedTrade: Trade | undefined
      setTrades(prev => {
        deletedTrade = prev.find(trade => trade.id === tradeId)
        return prev.filter(trade => trade.id !== tradeId)
      })
      
      console.log('⚡ Optimistic delete applied for trade:', tradeId)
      
      const response = await fetch(`/api/trades/${tradeId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        // Rollback optimistic update on error
        if (deletedTrade) {
          console.log('❌ Rolling back optimistic delete for trade:', tradeId)
          setTrades(prev => [...prev, deletedTrade!].sort((a, b) => 
            b.entryDate.getTime() - a.entryDate.getTime()
          ))
        }
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete trade')
      }

      console.log('✅ Server delete confirmed for trade:', tradeId)
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