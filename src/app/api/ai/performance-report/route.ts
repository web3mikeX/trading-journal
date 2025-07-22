import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface PerformanceMetrics {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  totalPnL: number
  averageWin: number
  averageLoss: number
  profitFactor: number
  sharpeRatio: number
  maxDrawdown: number
  maxDrawdownPercent: number
  consecutiveWins: number
  consecutiveLosses: number
  averageHoldTime: number
  largestWin: number
  largestLoss: number
}

interface MarketBreakdown {
  market: string
  trades: number
  winRate: number
  totalPnL: number
  avgPnL: number
}

interface TimeAnalysis {
  hourOfDay: { [hour: number]: { trades: number; winRate: number; avgPnL: number } }
  dayOfWeek: { [day: number]: { trades: number; winRate: number; avgPnL: number } }
  monthOfYear: { [month: number]: { trades: number; winRate: number; avgPnL: number } }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate environment variables
    const kimiApiKey = process.env.KIMI_API_KEY
    const kimiApiUrl = process.env.KIMI_API_URL || 'https://api.kimi.ai/v1/chat/completions'

    const { timeframe = 365, reportType = 'comprehensive' } = await request.json()
    const userId = session.user.id

    // Get trades from the specified timeframe
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - timeframe)

    const trades = await prisma.trade.findMany({
      where: {
        userId: userId,
        entryDate: {
          gte: fromDate
        }
      },
      orderBy: {
        entryDate: 'asc'
      }
    })

    if (trades.length === 0) {
      return NextResponse.json({
        error: 'No data',
        message: 'No trades found for the specified timeframe'
      }, { status: 400 })
    }

    // Calculate comprehensive performance metrics
    const metrics = calculatePerformanceMetrics(trades)
    const marketBreakdown = calculateMarketBreakdown(trades)
    const timeAnalysis = calculateTimeAnalysis(trades)
    const streakAnalysis = calculateStreakAnalysis(trades)
    
    // Generate intelligent insights
    const insights = generatePerformanceInsights(metrics, marketBreakdown, timeAnalysis)

    // Try to enhance with Kimi K2 AI analysis
    let aiInsights = null
    if (kimiApiKey && kimiApiUrl) {
      try {
        aiInsights = await getKimiPerformanceAnalysis(
          metrics, 
          marketBreakdown, 
          timeAnalysis, 
          trades.length,
          kimiApiKey, 
          kimiApiUrl
        )
      } catch (error) {
        console.log('Kimi AI unavailable for performance analysis')
      }
    }

    return NextResponse.json({
      metrics,
      marketBreakdown,
      timeAnalysis,
      streakAnalysis,
      insights,
      aiInsights,
      reportMetadata: {
        generatedAt: new Date().toISOString(),
        timeframe: `${timeframe} days`,
        tradesAnalyzed: trades.length,
        reportType
      }
    })

  } catch (error) {
    console.error('Performance report error:', error)
    return NextResponse.json(
      { error: 'Failed to generate performance report' },
      { status: 500 }
    )
  }
}

function calculatePerformanceMetrics(trades: any[]): PerformanceMetrics {
  const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.netPnL !== null)
  const winningTrades = closedTrades.filter(t => t.netPnL > 0)
  const losingTrades = closedTrades.filter(t => t.netPnL < 0)
  
  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0)
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0
  
  const totalWinAmount = winningTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0)
  const totalLossAmount = Math.abs(losingTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0))
  
  const averageWin = winningTrades.length > 0 ? totalWinAmount / winningTrades.length : 0
  const averageLoss = losingTrades.length > 0 ? totalLossAmount / losingTrades.length : 0
  const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : 0

  // Calculate Sharpe ratio (simplified)
  const returns = closedTrades.map(t => (t.netPnL || 0))
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  const stdDev = Math.sqrt(variance)
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0 // Annualized

  // Calculate drawdown
  let runningBalance = 10000 // Assume starting balance
  let peak = runningBalance
  let maxDrawdown = 0
  let maxDrawdownPercent = 0

  closedTrades.forEach(trade => {
    runningBalance += (trade.netPnL || 0)
    if (runningBalance > peak) {
      peak = runningBalance
    }
    const drawdown = peak - runningBalance
    const drawdownPercent = (drawdown / peak) * 100
    
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
      maxDrawdownPercent = drawdownPercent
    }
  })

  // Calculate streaks
  let currentWinStreak = 0
  let currentLossStreak = 0
  let maxWinStreak = 0
  let maxLossStreak = 0

  closedTrades.forEach(trade => {
    if (trade.netPnL > 0) {
      currentWinStreak++
      currentLossStreak = 0
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak)
    } else {
      currentLossStreak++
      currentWinStreak = 0
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak)
    }
  })

  // Calculate average hold time (in hours)
  const tradesWithDuration = closedTrades.filter(t => t.exitDate && t.entryDate)
  const averageHoldTime = tradesWithDuration.length > 0 
    ? tradesWithDuration.reduce((sum, t) => {
        const duration = new Date(t.exitDate).getTime() - new Date(t.entryDate).getTime()
        return sum + (duration / (1000 * 60 * 60)) // Convert to hours
      }, 0) / tradesWithDuration.length
    : 0

  const largestWin = winningTrades.length > 0 
    ? Math.max(...winningTrades.map(t => t.netPnL || 0)) 
    : 0
  const largestLoss = losingTrades.length > 0 
    ? Math.min(...losingTrades.map(t => t.netPnL || 0)) 
    : 0

  return {
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: Math.round(winRate * 100) / 100,
    totalPnL: Math.round(totalPnL * 100) / 100,
    averageWin: Math.round(averageWin * 100) / 100,
    averageLoss: Math.round(averageLoss * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    maxDrawdownPercent: Math.round(maxDrawdownPercent * 100) / 100,
    consecutiveWins: maxWinStreak,
    consecutiveLosses: maxLossStreak,
    averageHoldTime: Math.round(averageHoldTime * 100) / 100,
    largestWin: Math.round(largestWin * 100) / 100,
    largestLoss: Math.round(largestLoss * 100) / 100
  }
}

function calculateMarketBreakdown(trades: any[]): MarketBreakdown[] {
  const marketGroups: { [market: string]: any[] } = {}
  
  trades.forEach(trade => {
    const market = trade.market || 'UNKNOWN'
    if (!marketGroups[market]) marketGroups[market] = []
    marketGroups[market].push(trade)
  })

  return Object.entries(marketGroups).map(([market, marketTrades]) => {
    const closedTrades = marketTrades.filter(t => t.status === 'CLOSED' && t.netPnL !== null)
    const winningTrades = closedTrades.filter(t => t.netPnL > 0)
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0)
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0
    const avgPnL = closedTrades.length > 0 ? totalPnL / closedTrades.length : 0

    return {
      market,
      trades: marketTrades.length,
      winRate: Math.round(winRate * 100) / 100,
      totalPnL: Math.round(totalPnL * 100) / 100,
      avgPnL: Math.round(avgPnL * 100) / 100
    }
  }).sort((a, b) => b.trades - a.trades)
}

function calculateTimeAnalysis(trades: any[]): TimeAnalysis {
  const hourOfDay: { [hour: number]: { trades: number; winRate: number; avgPnL: number } } = {}
  const dayOfWeek: { [day: number]: { trades: number; winRate: number; avgPnL: number } } = {}
  const monthOfYear: { [month: number]: { trades: number; winRate: number; avgPnL: number } } = {}

  // Initialize all time periods
  for (let h = 0; h < 24; h++) hourOfDay[h] = { trades: 0, winRate: 0, avgPnL: 0 }
  for (let d = 0; d < 7; d++) dayOfWeek[d] = { trades: 0, winRate: 0, avgPnL: 0 }
  for (let m = 0; m < 12; m++) monthOfYear[m] = { trades: 0, winRate: 0, avgPnL: 0 }

  const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.netPnL !== null)

  closedTrades.forEach(trade => {
    const entryDate = new Date(trade.entryDate)
    const hour = entryDate.getHours()
    const day = entryDate.getDay()
    const month = entryDate.getMonth()

    // Hour analysis
    hourOfDay[hour].trades++
    if (trade.netPnL > 0) hourOfDay[hour].winRate++
    hourOfDay[hour].avgPnL += trade.netPnL

    // Day analysis  
    dayOfWeek[day].trades++
    if (trade.netPnL > 0) dayOfWeek[day].winRate++
    dayOfWeek[day].avgPnL += trade.netPnL

    // Month analysis
    monthOfYear[month].trades++
    if (trade.netPnL > 0) monthOfYear[month].winRate++
    monthOfYear[month].avgPnL += trade.netPnL
  })

  // Calculate percentages and averages
  Object.keys(hourOfDay).forEach(hour => {
    const h = parseInt(hour)
    if (hourOfDay[h].trades > 0) {
      hourOfDay[h].winRate = Math.round((hourOfDay[h].winRate / hourOfDay[h].trades) * 10000) / 100
      hourOfDay[h].avgPnL = Math.round((hourOfDay[h].avgPnL / hourOfDay[h].trades) * 100) / 100
    }
  })

  Object.keys(dayOfWeek).forEach(day => {
    const d = parseInt(day)
    if (dayOfWeek[d].trades > 0) {
      dayOfWeek[d].winRate = Math.round((dayOfWeek[d].winRate / dayOfWeek[d].trades) * 10000) / 100
      dayOfWeek[d].avgPnL = Math.round((dayOfWeek[d].avgPnL / dayOfWeek[d].trades) * 100) / 100
    }
  })

  Object.keys(monthOfYear).forEach(month => {
    const m = parseInt(month)
    if (monthOfYear[m].trades > 0) {
      monthOfYear[m].winRate = Math.round((monthOfYear[m].winRate / monthOfYear[m].trades) * 10000) / 100
      monthOfYear[m].avgPnL = Math.round((monthOfYear[m].avgPnL / monthOfYear[m].trades) * 100) / 100
    }
  })

  return { hourOfDay, dayOfWeek, monthOfYear }
}

function calculateStreakAnalysis(trades: any[]) {
  const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.netPnL !== null)
  
  let currentStreak = 0
  let currentStreakType: 'win' | 'loss' | null = null
  const streaks: Array<{ type: 'win' | 'loss'; length: number; totalPnL: number }> = []

  closedTrades.forEach((trade, index) => {
    const isWin = trade.netPnL > 0
    
    if (currentStreakType === null) {
      currentStreakType = isWin ? 'win' : 'loss'
      currentStreak = 1
    } else if ((currentStreakType === 'win' && isWin) || (currentStreakType === 'loss' && !isWin)) {
      currentStreak++
    } else {
      // Streak ended, record it
      const streakTrades = closedTrades.slice(index - currentStreak, index)
      const totalPnL = streakTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0)
      
      streaks.push({
        type: currentStreakType,
        length: currentStreak,
        totalPnL: Math.round(totalPnL * 100) / 100
      })
      
      currentStreakType = isWin ? 'win' : 'loss'
      currentStreak = 1
    }
  })

  // Add final streak
  if (currentStreakType && currentStreak > 0) {
    const streakTrades = closedTrades.slice(-currentStreak)
    const totalPnL = streakTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0)
    
    streaks.push({
      type: currentStreakType,
      length: currentStreak,
      totalPnL: Math.round(totalPnL * 100) / 100
    })
  }

  return {
    longestWinStreak: Math.max(...streaks.filter(s => s.type === 'win').map(s => s.length), 0),
    longestLossStreak: Math.max(...streaks.filter(s => s.type === 'loss').map(s => s.length), 0),
    bestWinStreakPnL: Math.max(...streaks.filter(s => s.type === 'win').map(s => s.totalPnL), 0),
    worstLossStreakPnL: Math.min(...streaks.filter(s => s.type === 'loss').map(s => s.totalPnL), 0),
    totalStreaks: streaks.length
  }
}

function generatePerformanceInsights(
  metrics: PerformanceMetrics, 
  marketBreakdown: MarketBreakdown[], 
  timeAnalysis: TimeAnalysis
): string[] {
  const insights: string[] = []

  // Win rate insights
  if (metrics.winRate > 60) {
    insights.push(`Excellent win rate of ${metrics.winRate}% indicates strong strategy selection`)
  } else if (metrics.winRate < 40) {
    insights.push(`Low win rate of ${metrics.winRate}% suggests need for strategy refinement`)
  }

  // Profit factor insights
  if (metrics.profitFactor > 2) {
    insights.push(`Strong profit factor of ${metrics.profitFactor} shows excellent risk-reward management`)
  } else if (metrics.profitFactor < 1) {
    insights.push(`Profit factor below 1.0 indicates losses exceed wins - review position sizing`)
  }

  // Risk management insights
  if (metrics.maxDrawdownPercent > 20) {
    insights.push(`High maximum drawdown of ${metrics.maxDrawdownPercent}% suggests excessive risk taking`)
  }

  // Market insights
  const bestMarket = marketBreakdown[0]
  if (bestMarket && marketBreakdown.length > 1) {
    insights.push(`${bestMarket.market} is your most active market with ${bestMarket.trades} trades`)
  }

  // Time-based insights
  const bestHours = Object.entries(timeAnalysis.hourOfDay)
    .filter(([_, data]) => data.trades >= 3)
    .sort((a, b) => b[1].winRate - a[1].winRate)
    .slice(0, 2)

  if (bestHours.length > 0) {
    const [hour, data] = bestHours[0]
    insights.push(`Best performance at ${hour}:00 with ${data.winRate}% win rate`)
  }

  // Streak insights
  if (metrics.consecutiveLosses > 5) {
    insights.push(`Long losing streak of ${metrics.consecutiveLosses} trades indicates need for pause/review`)
  }

  return insights
}

async function getKimiPerformanceAnalysis(
  metrics: PerformanceMetrics,
  marketBreakdown: MarketBreakdown[],
  timeAnalysis: TimeAnalysis,
  totalTrades: number,
  apiKey: string,
  apiUrl: string
): Promise<string | null> {
  try {
    const bestHour = Object.entries(timeAnalysis.hourOfDay)
      .filter(([_, data]) => data.trades >= 2)
      .sort((a, b) => b[1].avgPnL - a[1].avgPnL)[0]

    const worstHour = Object.entries(timeAnalysis.hourOfDay)
      .filter(([_, data]) => data.trades >= 2)
      .sort((a, b) => a[1].avgPnL - b[1].avgPnL)[0]

    const prompt = `Analyze this comprehensive trading performance data:

PERFORMANCE METRICS:
- Total Trades: ${totalTrades}
- Win Rate: ${metrics.winRate}%
- Total P&L: $${metrics.totalPnL}
- Profit Factor: ${metrics.profitFactor}
- Sharpe Ratio: ${metrics.sharpeRatio}
- Max Drawdown: ${metrics.maxDrawdownPercent}%
- Average Win: $${metrics.averageWin}
- Average Loss: $${metrics.averageLoss}
- Largest Win: $${metrics.largestWin}
- Largest Loss: $${metrics.largestLoss}

MARKET BREAKDOWN:
${marketBreakdown.map(m => `- ${m.market}: ${m.trades} trades, ${m.winRate}% win rate, $${m.totalPnL} P&L`).join('\n')}

TIME ANALYSIS:
${bestHour ? `- Best Hour: ${bestHour[0]}:00 (Avg P&L: $${bestHour[1].avgPnL})` : ''}
${worstHour ? `- Worst Hour: ${worstHour[0]}:00 (Avg P&L: $${worstHour[1].avgPnL})` : ''}

Provide a comprehensive analysis focusing on:
1. Overall performance assessment
2. Key strengths and weaknesses
3. Risk management effectiveness
4. Market specialization opportunities
5. Specific actionable recommendations for improvement

Be detailed and professional in your analysis.`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'k2-latest',
        messages: [
          {
            role: 'system',
            content: 'You are an expert quantitative trading analyst with deep expertise in performance evaluation, risk management, and trading psychology. Provide comprehensive, actionable insights based on trading data.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1200,
        temperature: 0.7
      }),
      signal: AbortSignal.timeout(20000)
    })

    if (response.ok) {
      const data = await response.json()
      return data.choices[0]?.message?.content || null
    }
    
    return null
  } catch (error) {
    console.log('Kimi AI performance analysis failed:', error)
    return null
  }
}