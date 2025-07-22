import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseDateOption, getCustomRange } from '@/lib/dateUtils'

interface TradeAnalysis {
  symbol: string
  side: 'LONG' | 'SHORT'
  entryDate: Date
  exitDate?: Date
  netPnL?: number
  returnPercent?: number
  status: string
  strategy?: string
  setup?: string
  notes?: string
  market: string
  quantity: number
  entryPrice: number
  exitPrice?: number
}

interface HabitPattern {
  pattern: string
  frequency: number
  winRate: number
  avgPnL: number
  impact: 'positive' | 'negative' | 'neutral'
  recommendation: string
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body - support both old and new formats
    const body = await request.json()
    const { 
      timeframe, 
      dateOption, 
      customStartDate, 
      customEndDate, 
      userId: requestUserId 
    } = body
    
    // For demo mode, always use the demo user ID
    const userId = requestUserId || 'cmcwu8b5m0001m17ilm0triy8'
    
    console.log('AI Habits Analysis - Using userId:', userId)
    console.log('Date parameters:', { timeframe, dateOption, customStartDate, customEndDate })

    // Validate environment variables
    const kimiApiKey = process.env.KIMI_API_KEY
    const kimiApiUrl = process.env.KIMI_API_URL || 'https://api.moonshot.cn/v1/chat/completions'
    const aiServiceEnabled = process.env.AI_SERVICE_ENABLED === 'true'
    
    console.log('AI Service Config:', { 
      hasApiKey: !!kimiApiKey, 
      apiUrl: kimiApiUrl,
      serviceEnabled: aiServiceEnabled 
    })

    // Determine date range based on input parameters
    let dateRange: { start: Date; end: Date }
    let timeframeDescription: string
    
    if (customStartDate && customEndDate) {
      // Custom date range
      dateRange = getCustomRange(new Date(customStartDate), new Date(customEndDate))
      timeframeDescription = `Custom range: ${customStartDate} to ${customEndDate}`
    } else if (dateOption) {
      // New date option format
      const parsedRange = parseDateOption(dateOption)
      if (!parsedRange) {
        return NextResponse.json({ error: 'Invalid date option' }, { status: 400 })
      }
      dateRange = parsedRange
      timeframeDescription = getTimeframeDescription(dateOption)
    } else if (timeframe) {
      // Backward compatibility with numeric timeframe
      const parsedRange = parseDateOption(timeframe.toString())
      if (!parsedRange) {
        return NextResponse.json({ error: 'Invalid timeframe' }, { status: 400 })
      }
      dateRange = parsedRange
      timeframeDescription = `Last ${timeframe} days`
    } else {
      // Default to 90 days
      const parsedRange = parseDateOption('90')
      if (!parsedRange) {
        return NextResponse.json({ error: 'Invalid default timeframe' }, { status: 400 })
      }
      dateRange = parsedRange
      timeframeDescription = 'Last 90 days'
    }

    console.log('Using date range:', dateRange, 'Description:', timeframeDescription)

    const trades = await prisma.trade.findMany({
      where: {
        userId: userId,
        entryDate: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      select: {
        symbol: true,
        side: true,
        entryDate: true,
        exitDate: true,
        netPnL: true,
        returnPercent: true,
        status: true,
        strategy: true,
        setup: true,
        notes: true,
        market: true,
        quantity: true,
        entryPrice: true,
        exitPrice: true
      },
      orderBy: {
        entryDate: 'desc'
      }
    })

    if (trades.length < 10) {
      return NextResponse.json({
        error: 'Insufficient data',
        message: 'Need at least 10 trades for meaningful habit analysis',
        tradesCount: trades.length
      }, { status: 400 })
    }

    // Analyze patterns using intelligent fallback
    const analysis = await analyzeHabitsIntelligent(trades as TradeAnalysis[])

    // Try to enhance with Kimi K2 AI insights if service is enabled and configured
    if (aiServiceEnabled && kimiApiKey) {
      try {
        const aiAnalysis = await getKimiHabitAnalysis(trades as TradeAnalysis[], kimiApiKey, kimiApiUrl)
        if (aiAnalysis) {
          analysis.aiInsights = aiAnalysis
        }
      } catch (error) {
        console.log('Kimi AI unavailable for habit analysis, using intelligent fallback:', error.message)
        analysis.aiInsights = 'AI service temporarily unavailable. Analysis completed using intelligent local algorithms.'
      }
    } else {
      analysis.aiInsights = 'AI service not configured. Using intelligent local analysis only.'
    }

    return NextResponse.json({
      analysis,
      tradesAnalyzed: trades.length,
      timeframe: timeframeDescription,
      dateRange: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString()
      },
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Habit analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze trading habits' },
      { status: 500 }
    )
  }
}

async function analyzeHabitsIntelligent(trades: TradeAnalysis[]) {
  const patterns: HabitPattern[] = []
  
  // 1. Time-based patterns
  const timePatterns = analyzeTimePatterns(trades)
  patterns.push(...timePatterns)
  
  // 2. Symbol/Market patterns  
  const symbolPatterns = analyzeSymbolPatterns(trades)
  patterns.push(...symbolPatterns)
  
  // 3. Strategy patterns
  const strategyPatterns = analyzeStrategyPatterns(trades)
  patterns.push(...strategyPatterns)
  
  // 4. Emotional/Note patterns
  const emotionalPatterns = analyzeEmotionalPatterns(trades)
  patterns.push(...emotionalPatterns)
  
  // 5. Position sizing patterns
  const sizingPatterns = analyzeSizingPatterns(trades)
  patterns.push(...sizingPatterns)

  // Calculate overall statistics
  const totalTrades = trades.length
  const winningTrades = trades.filter(t => (t.netPnL || 0) > 0).length
  const losingTrades = trades.filter(t => (t.netPnL || 0) < 0).length
  const overallWinRate = (winningTrades / totalTrades) * 100
  const totalPnL = trades.reduce((sum, t) => sum + (t.netPnL || 0), 0)
  const avgPnL = totalPnL / totalTrades

  return {
    patterns: patterns.slice(0, 10), // Top 10 most significant patterns
    overallStats: {
      totalTrades,
      winningTrades,
      losingTrades,
      overallWinRate: Math.round(overallWinRate * 10) / 10,
      totalPnL: Math.round(totalPnL * 100) / 100,
      avgPnL: Math.round(avgPnL * 100) / 100
    },
    keyInsights: generateKeyInsights(patterns, overallWinRate, totalPnL)
  }
}

function analyzeTimePatterns(trades: TradeAnalysis[]): HabitPattern[] {
  const patterns: HabitPattern[] = []
  
  // Analyze by hour of day
  const hourGroups: { [hour: number]: TradeAnalysis[] } = {}
  trades.forEach(trade => {
    const hour = new Date(trade.entryDate).getHours()
    if (!hourGroups[hour]) hourGroups[hour] = []
    hourGroups[hour].push(trade)
  })

  Object.entries(hourGroups).forEach(([hour, hourTrades]) => {
    if (hourTrades.length >= 5) { // Minimum trades for pattern
      const winRate = (hourTrades.filter(t => (t.netPnL || 0) > 0).length / hourTrades.length) * 100
      const avgPnL = hourTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0) / hourTrades.length
      
      let timeDescription = ''
      const h = parseInt(hour)
      if (h >= 6 && h < 9) timeDescription = 'Pre-market hours'
      else if (h >= 9 && h < 11) timeDescription = 'Market open'
      else if (h >= 11 && h < 14) timeDescription = 'Mid-day trading'
      else if (h >= 14 && h < 16) timeDescription = 'Afternoon session'
      else timeDescription = 'After-hours'

      patterns.push({
        pattern: `Trading during ${timeDescription} (${hour}:00)`,
        frequency: hourTrades.length,
        winRate: Math.round(winRate * 10) / 10,
        avgPnL: Math.round(avgPnL * 100) / 100,
        impact: winRate > 60 && avgPnL > 0 ? 'positive' : winRate < 40 || avgPnL < 0 ? 'negative' : 'neutral',
        recommendation: winRate > 60 && avgPnL > 0 
          ? `Strong performance during ${timeDescription}. Consider increasing activity in this time window.`
          : winRate < 40 || avgPnL < 0 
          ? `Poor performance during ${timeDescription}. Consider avoiding trades in this time window.`
          : `Neutral performance during ${timeDescription}.`
      })
    }
  })

  return patterns
}

function analyzeSymbolPatterns(trades: TradeAnalysis[]): HabitPattern[] {
  const patterns: HabitPattern[] = []
  
  // Group by symbol
  const symbolGroups: { [symbol: string]: TradeAnalysis[] } = {}
  trades.forEach(trade => {
    if (!symbolGroups[trade.symbol]) symbolGroups[trade.symbol] = []
    symbolGroups[trade.symbol].push(trade)
  })

  Object.entries(symbolGroups).forEach(([symbol, symbolTrades]) => {
    if (symbolTrades.length >= 3) { // Minimum trades for pattern
      const winRate = (symbolTrades.filter(t => (t.netPnL || 0) > 0).length / symbolTrades.length) * 100
      const avgPnL = symbolTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0) / symbolTrades.length
      
      patterns.push({
        pattern: `Trading ${symbol} (${symbolTrades[0].market})`,
        frequency: symbolTrades.length,
        winRate: Math.round(winRate * 10) / 10,
        avgPnL: Math.round(avgPnL * 100) / 100,
        impact: winRate > 60 && avgPnL > 0 ? 'positive' : winRate < 40 || avgPnL < 0 ? 'negative' : 'neutral',
        recommendation: winRate > 60 && avgPnL > 0 
          ? `Strong performance with ${symbol}. Consider focusing more on this instrument.`
          : winRate < 40 || avgPnL < 0 
          ? `Poor performance with ${symbol}. Consider reducing exposure or reviewing strategy.`
          : `Neutral performance with ${symbol}.`
      })
    }
  })

  return patterns.sort((a, b) => b.frequency - a.frequency)
}

function analyzeStrategyPatterns(trades: TradeAnalysis[]): HabitPattern[] {
  const patterns: HabitPattern[] = []
  
  // Group by strategy
  const strategyGroups: { [strategy: string]: TradeAnalysis[] } = {}
  trades.forEach(trade => {
    const strategy = trade.strategy || 'No Strategy'
    if (!strategyGroups[strategy]) strategyGroups[strategy] = []
    strategyGroups[strategy].push(trade)
  })

  Object.entries(strategyGroups).forEach(([strategy, strategyTrades]) => {
    if (strategyTrades.length >= 3) {
      const winRate = (strategyTrades.filter(t => (t.netPnL || 0) > 0).length / strategyTrades.length) * 100
      const avgPnL = strategyTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0) / strategyTrades.length
      
      patterns.push({
        pattern: `${strategy} strategy`,
        frequency: strategyTrades.length,
        winRate: Math.round(winRate * 10) / 10,
        avgPnL: Math.round(avgPnL * 100) / 100,
        impact: winRate > 60 && avgPnL > 0 ? 'positive' : winRate < 40 || avgPnL < 0 ? 'negative' : 'neutral',
        recommendation: winRate > 60 && avgPnL > 0 
          ? `${strategy} strategy is working well. Consider increasing allocation.`
          : winRate < 40 || avgPnL < 0 
          ? `${strategy} strategy needs refinement or should be avoided.`
          : `${strategy} strategy shows mixed results.`
      })
    }
  })

  return patterns
}

function analyzeEmotionalPatterns(trades: TradeAnalysis[]): HabitPattern[] {
  const patterns: HabitPattern[] = []
  
  // Analyze notes for emotional keywords
  const emotionalKeywords = {
    'FOMO': ['fomo', 'fear of missing out', 'rushed', 'impulsive'],
    'Revenge Trading': ['revenge', 'angry', 'frustrated', 'payback'],
    'Overconfident': ['sure thing', 'easy money', 'cant lose', 'overconfident'],
    'Disciplined': ['plan', 'setup', 'patient', 'disciplined', 'waited'],
    'Uncertain': ['unsure', 'doubtful', 'hesitant', 'uncertain']
  }

  Object.entries(emotionalKeywords).forEach(([emotion, keywords]) => {
    const emotionalTrades = trades.filter(trade => {
      if (!trade.notes) return false
      const notes = trade.notes.toLowerCase()
      return keywords.some(keyword => notes.includes(keyword))
    })

    if (emotionalTrades.length >= 2) {
      const winRate = (emotionalTrades.filter(t => (t.netPnL || 0) > 0).length / emotionalTrades.length) * 100
      const avgPnL = emotionalTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0) / emotionalTrades.length
      
      patterns.push({
        pattern: `${emotion} emotional state`,
        frequency: emotionalTrades.length,
        winRate: Math.round(winRate * 10) / 10,
        avgPnL: Math.round(avgPnL * 100) / 100,
        impact: emotion === 'Disciplined' ? 'positive' : ['FOMO', 'Revenge Trading', 'Overconfident'].includes(emotion) ? 'negative' : 'neutral',
        recommendation: emotion === 'Disciplined' 
          ? 'Disciplined trading leads to better results. Continue this approach.'
          : ['FOMO', 'Revenge Trading', 'Overconfident'].includes(emotion)
          ? `${emotion} negatively impacts performance. Work on emotional control and planning.`
          : `Monitor ${emotion} states and their impact on decision-making.`
      })
    }
  })

  return patterns
}

function analyzeSizingPatterns(trades: TradeAnalysis[]): HabitPattern[] {
  const patterns: HabitPattern[] = []
  
  // Analyze position sizes relative to account
  const quantities = trades.map(t => t.quantity).sort((a, b) => a - b)
  const median = quantities[Math.floor(quantities.length / 2)]
  
  const largeTrades = trades.filter(t => t.quantity > median * 1.5)

  if (largeTrades.length >= 3) {
    const winRate = (largeTrades.filter(t => (t.netPnL || 0) > 0).length / largeTrades.length) * 100
    const avgPnL = largeTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0) / largeTrades.length
    
    patterns.push({
      pattern: 'Large position sizes',
      frequency: largeTrades.length,
      winRate: Math.round(winRate * 10) / 10,
      avgPnL: Math.round(avgPnL * 100) / 100,
      impact: winRate > 60 && avgPnL > 0 ? 'positive' : 'negative',
      recommendation: winRate > 60 && avgPnL > 0 
        ? 'Large positions are working well when you have conviction.'
        : 'Large positions may be increasing risk. Consider more consistent sizing.'
    })
  }

  return patterns
}

function generateKeyInsights(patterns: HabitPattern[], overallWinRate: number, totalPnL: number): string[] {
  const insights: string[] = []
  
  // Find most impactful patterns
  const positivePatterns = patterns.filter(p => p.impact === 'positive').sort((a, b) => b.avgPnL - a.avgPnL)
  const negativePatterns = patterns.filter(p => p.impact === 'negative').sort((a, b) => a.avgPnL - b.avgPnL)
  
  if (positivePatterns.length > 0) {
    insights.push(`Your strongest pattern: ${positivePatterns[0].pattern} with ${positivePatterns[0].winRate}% win rate`)
  }
  
  if (negativePatterns.length > 0) {
    insights.push(`Area for improvement: ${negativePatterns[0].pattern} shows poor performance`)
  }
  
  if (overallWinRate > 60) {
    insights.push('Strong overall win rate suggests good strategy selection')
  } else if (overallWinRate < 40) {
    insights.push('Low win rate indicates need for strategy refinement')
  }
  
  if (totalPnL > 0) {
    insights.push('Positive overall P&L shows profitable trading approach')
  } else {
    insights.push('Negative P&L requires immediate attention to risk management')
  }
  
  return insights
}

async function getKimiHabitAnalysis(trades: TradeAnalysis[], apiKey: string, apiUrl: string): Promise<string | null> {
  try {
    // Prepare data summary for AI analysis
    const summary = {
      totalTrades: trades.length,
      winRate: (trades.filter(t => (t.netPnL || 0) > 0).length / trades.length) * 100,
      totalPnL: trades.reduce((sum, t) => sum + (t.netPnL || 0), 0),
      symbols: [...new Set(trades.map(t => t.symbol))],
      strategies: [...new Set(trades.map(t => t.strategy).filter(Boolean))],
      markets: [...new Set(trades.map(t => t.market))]
    }

    const prompt = `Analyze this trader's habits based on ${trades.length} trades:
- Win Rate: ${summary.winRate.toFixed(1)}%
- Total P&L: $${summary.totalPnL.toFixed(2)}
- Traded Symbols: ${summary.symbols.join(', ')}
- Markets: ${summary.markets.join(', ')}
- Strategies Used: ${summary.strategies.join(', ') || 'None specified'}

Identify the top 3 most important behavioral patterns and provide specific, actionable recommendations for improvement. Focus on psychological and strategic aspects.`

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
            content: 'You are an expert trading psychologist and performance analyst. Provide deep insights into trading behavior patterns and specific recommendations for improvement.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7
      }),
      signal: AbortSignal.timeout(15000)
    })

    if (response.ok) {
      const data = await response.json()
      return data.choices[0]?.message?.content || null
    }
    
    return null
  } catch (error) {
    console.log('Kimi AI analysis failed:', error)
    return null
  }
}

function getTimeframeDescription(dateOption: string): string {
  switch (dateOption) {
    case 'today':
      return 'Today'
    case 'yesterday':
      return 'Yesterday'
    case 'thisWeek':
      return 'This Week'
    case 'lastWeek':
      return 'Last Week'
    case '30':
      return 'Last 30 days'
    case '60':
      return 'Last 60 days'
    case '90':
      return 'Last 90 days'
    case '180':
      return 'Last 6 months'
    case '365':
      return 'Last year'
    default:
      const days = parseInt(dateOption)
      return !isNaN(days) ? `Last ${days} days` : 'Unknown timeframe'
  }
}