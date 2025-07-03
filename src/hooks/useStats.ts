import { useState, useEffect } from 'react'

interface Stats {
  totalPnL: number
  winRate: number
  totalTrades: number
  openTrades: number
  closedTrades: number
  profitFactor: number
  averageWin: number
  averageLoss: number
  currentMonthReturn: number
  performanceData: Array<{
    date: string
    balance: number
    pnl: number
    trades: number
  }>
  recentTrades: Array<{
    id: string
    symbol: string
    side: 'LONG' | 'SHORT'
    entryDate: Date
    exitDate?: Date
    netPnL?: number
    status: 'OPEN' | 'CLOSED' | 'CANCELLED'
  }>
  winningTrades: number
  losingTrades: number
}

export function useStats(userId: string) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/stats?userId=${userId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }

        const data = await response.json()
        
        // Convert date strings back to Date objects for recentTrades
        data.recentTrades = data.recentTrades.map((trade: any) => ({
          ...trade,
          entryDate: new Date(trade.entryDate),
          exitDate: trade.exitDate ? new Date(trade.exitDate) : undefined
        }))
        
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [userId])

  const refetchStats = async () => {
    if (!userId) return
    
    try {
      setError(null)
      const response = await fetch(`/api/stats?userId=${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }

      const data = await response.json()
      
      // Convert date strings back to Date objects for recentTrades
      data.recentTrades = data.recentTrades.map((trade: any) => ({
        ...trade,
        entryDate: new Date(trade.entryDate),
        exitDate: trade.exitDate ? new Date(trade.exitDate) : undefined
      }))
      
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return { stats, loading, error, refetchStats }
}