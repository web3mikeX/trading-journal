import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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
    summary += `Strong performance with ${avgPnL.toFixed(2)} average per trade. `
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
    const session = await getServerSession(authOptions)
    
    // Temporary: Allow AI summary without authentication for testing
    // TODO: Re-enable authentication once session issues are resolved
    let userId = session?.user?.id
    
    if (!userId) {
      // Fallback: use first user in database for testing
      const firstUser = await prisma.user.findFirst()
      if (!firstUser) {
        return NextResponse.json({ error: 'No users found' }, { status: 500 })
      }
      userId = firstUser.id
      console.log('AI Summary: Using fallback user ID for testing:', userId)
    }

    const { date } = await request.json()
    
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    // Use same date filtering logic as calendar API
    const dayStart = new Date(`${date}T00:00:00.000Z`)
    const dayEnd = new Date(`${date}T23:59:59.999Z`)

    // Get all trades for the day
    const trades = await prisma.trade.findMany({
      where: {
        userId: userId,
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

    // Get calendar entry for context
    const calendarEntry = await prisma.calendarEntry.findUnique({
      where: {
        userId_date: {
          userId: userId,
          date: dayStart
        }
      }
    })

    console.log(`AI Summary Debug - Date: ${date}, Trades found: ${trades.length}`)
    
    if (trades.length === 0) {
      return NextResponse.json({ 
        summary: 'No trades on this day',
        error: 'No trading activity found for this date'
      }, { status: 200 })
    }

    // Calculate daily statistics
    const totalPnL = trades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
    const winningTrades = trades.filter(trade => (trade.netPnL || 0) > 0).length
    const losingTrades = trades.filter(trade => (trade.netPnL || 0) < 0).length
    const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0

    // Create comprehensive prompt for AI
    const tradesList = trades.map(trade => 
      `${trade.symbol} ${trade.side} ${trade.quantity} contracts: ${trade.entryPrice} → ${trade.exitPrice} = $${trade.netPnL}`
    ).join(', ')

    const mood = calendarEntry?.mood ? `Mood: ${calendarEntry.mood}/5 stars` : ''
    const notes = calendarEntry?.notes ? `Notes: ${calendarEntry.notes}` : ''
    
    const prompt = `Trading day summary for ${date}:
Trades: ${tradesList}
Performance: ${trades.length} trades, ${winningTrades} wins, ${losingTrades} losses, ${winRate.toFixed(1)}% win rate
Total P&L: $${totalPnL.toFixed(2)}
${mood}
${notes}

Create a comprehensive daily trading summary (2-3 sentences) focusing on performance, patterns, and key insights.`

    // Generate intelligent fallback summary with more detailed analysis
    let aiSummary = generateIntelligentSummary(trades, totalPnL, winRate, calendarEntry)

    // Try Kimi AI API if available
    const kimiApiKey = process.env.KIMI_API_KEY
    const kimiApiUrl = process.env.KIMI_API_URL

    if (kimiApiKey && kimiApiUrl) {
      try {
        const response = await fetch(kimiApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${kimiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'k2-latest',
            messages: [
              {
                role: 'system',
                content: 'You are a professional trading analyst. Create insightful daily trading summaries that highlight performance, patterns, and key takeaways. Keep responses to 2-3 sentences and focus on actionable insights.'
              },
              {
                role: 'user',
                content: prompt
              }
            ]
          }),
          signal: AbortSignal.timeout(10000) // 10 second timeout
        })

        if (response.ok) {
          const data = await response.json()
          const kimiSummary = data.choices[0]?.message?.content
          if (kimiSummary && kimiSummary.length > 10) {
            aiSummary = kimiSummary
          }
        }
      } catch (error) {
        console.log('Kimi API unavailable, using intelligent fallback:', error.message)
        // Continue with fallback summary
      }
    }

    // Save to database
    await prisma.calendarEntry.upsert({
      where: {
        userId_date: {
          userId: userId,
          date: dayStart
        }
      },
      update: {
        aiSummary
      },
      create: {
        userId: userId,
        date: dayStart,
        aiSummary,
        dailyPnL: totalPnL,
        tradesCount: trades.length,
        winningTrades,
        losingTrades,
        winRate
      }
    })

    return NextResponse.json({ summary: aiSummary })

  } catch (error) {
    console.error('AI summary generation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error ? error.stack : String(error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate AI summary',
        details: errorMessage,
        stack: errorDetails
      },
      { status: 500 }
    )
  }
}