import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function generateIntelligentSummary(trades: any[], totalPnL: number, winRate: number, calendarEntry: any) {
  const tradesCount = trades.length
  const winningTrades = trades.filter(trade => (trade.netPnL || 0) > 0).length
  const losingTrades = trades.filter(trade => (trade.netPnL || 0) < 0).length
  const avgPnL = totalPnL / tradesCount
  
  // Analyze trading patterns
  const symbols = [...new Set(trades.map(t => t.symbol))]
  const sides = trades.map(t => t.side)
  const longTrades = sides.filter(s => s === 'LONG').length
  const shortTrades = sides.filter(s => s === 'SHORT').length
  
  // Performance analysis
  const isProfit = totalPnL > 0
  const strongWinRate = winRate >= 60
  const averageWinRate = winRate >= 40 && winRate < 60
  
  // Build summary components
  let summary = `Executed ${tradesCount} trade${tradesCount > 1 ? 's' : ''} `
  
  // Add symbols
  if (symbols.length === 1) {
    summary += `on ${symbols[0]} `
  } else if (symbols.length <= 3) {
    summary += `across ${symbols.join(', ')} `
  } else {
    summary += `across ${symbols.length} symbols `
  }
  
  // Add performance
  summary += `with ${winRate.toFixed(0)}% win rate for ${isProfit ? '+' : ''}$${totalPnL.toFixed(2)} total P&L. `
  
  // Add insights
  if (strongWinRate && isProfit) {
    summary += `Strong performance with $${avgPnL.toFixed(2)} average per trade. `
  } else if (averageWinRate && isProfit) {
    summary += `Solid trading session with consistent risk management. `
  } else if (strongWinRate && !isProfit) {
    summary += `High win rate but losses exceeded gains - review position sizing. `
  } else if (!isProfit && winRate < 40) {
    summary += `Challenging session - consider strategy review and risk management. `
  }
  
  // Add trading direction insight
  if (longTrades > shortTrades * 2) {
    summary += `Primarily long-biased trading strategy.`
  } else if (shortTrades > longTrades * 2) {
    summary += `Primarily short-biased trading approach.`
  } else if (longTrades > 0 && shortTrades > 0) {
    summary += `Balanced long/short directional approach.`
  }
  
  // Add mood context if available
  if (calendarEntry?.mood) {
    if (calendarEntry.mood >= 4 && isProfit) {
      summary += ` Positive mood aligned with profitable results.`
    } else if (calendarEntry.mood <= 2 && !isProfit) {
      summary += ` Low mood may have impacted trading decisions.`
    }
  }
  
  return summary.trim()
}

export async function POST(request: NextRequest) {
  try {
    const { date } = await request.json()
    
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    // Use same date filtering logic as calendar API
    const dayStart = new Date(`${date}T00:00:00.000Z`)
    const dayEnd = new Date(`${date}T23:59:59.999Z`)

    // Get all trades for the day (without user filtering for testing)
    const trades = await prisma.trade.findMany({
      where: {
        entryDate: {
          gte: dayStart,
          lte: dayEnd
        }
      },
      select: {
        symbol: true,
        side: true,
        entryPrice: true,
        exitPrice: true,
        quantity: true,
        netPnL: true,
        aiSummary: true
      }
    })

    console.log(`AI Summary Test - Date: ${date}, Trades found: ${trades.length}`)
    
    if (trades.length === 0) {
      return NextResponse.json({ 
        summary: 'No trades found for this date',
        error: 'No trading activity found'
      }, { status: 200 })
    }

    // Calculate daily statistics
    const totalPnL = trades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
    const winningTrades = trades.filter(trade => (trade.netPnL || 0) > 0).length
    const losingTrades = trades.filter(trade => (trade.netPnL || 0) < 0).length
    const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0

    // Generate intelligent summary
    const aiSummary = generateIntelligentSummary(trades, totalPnL, winRate, null)

    return NextResponse.json({ 
      summary: aiSummary,
      debug: {
        tradesCount: trades.length,
        totalPnL,
        winRate: winRate.toFixed(1) + '%',
        date
      }
    })

  } catch (error) {
    console.error('AI summary test error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI summary test' },
      { status: 500 }
    )
  }
}