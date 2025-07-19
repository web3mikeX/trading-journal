import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface SummaryRequest {
  symbol: string
  side: 'LONG' | 'SHORT'
  quantity: number
  entryPrice: number
  exitPrice?: number
  notes?: string
  status: 'OPEN' | 'CLOSED' | 'CANCELLED'
  grossPnL?: number
  strategy?: string
  setup?: string
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
    
    if (!kimiApiKey) {
      console.error('KIMI_API_KEY not configured')
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
    }

    // Parse request body
    const tradeData: SummaryRequest = await request.json()
    
    // Validate required fields
    if (!tradeData.symbol || !tradeData.side || !tradeData.quantity || !tradeData.entryPrice) {
      return NextResponse.json({ error: 'Missing required trade data' }, { status: 400 })
    }

    // Build prompt for Kimi K2
    const prompt = buildSummaryPrompt(tradeData)

    // Call Kimi K2 API
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
            content: 'You are a professional trading assistant. Create concise, informative trade summaries in exactly 10 words or less. Focus on key details: action, symbol, outcome, and key insight.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 50,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      console.error('Kimi API error:', response.status, response.statusText)
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
    }

    const data = await response.json()
    const summary = data.choices?.[0]?.message?.content?.trim()

    if (!summary) {
      console.error('No summary generated from Kimi API')
      return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
    }

    return NextResponse.json({
      summary: summary,
      tokensUsed: data.usage?.total_tokens || 0
    })

  } catch (error) {
    console.error('AI Summary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function buildSummaryPrompt(trade: SummaryRequest): string {
  const side = trade.side.toLowerCase()
  const symbol = trade.symbol.toUpperCase()
  const quantity = trade.quantity
  const entryPrice = trade.entryPrice
  const exitPrice = trade.exitPrice
  const status = trade.status.toLowerCase()
  const pnl = trade.grossPnL
  const strategy = trade.strategy
  const setup = trade.setup
  const notes = trade.notes

  let prompt = `Summarize this ${side} trade of ${quantity} ${symbol} at $${entryPrice}`
  
  if (status === 'closed' && exitPrice) {
    prompt += ` → $${exitPrice}`
    if (pnl !== undefined) {
      const pnlSign = pnl >= 0 ? '+' : ''
      prompt += ` (${pnlSign}$${pnl.toFixed(2)})`
    }
  } else if (status === 'open') {
    prompt += ` (currently open)`
  }

  if (strategy) {
    prompt += `. Strategy: ${strategy}`
  }

  if (setup) {
    prompt += `. Setup: ${setup}`
  }

  if (notes) {
    prompt += `. Notes: ${notes}`
  }

  prompt += '\n\nCreate a 10-word summary focusing on the key outcome and insight.'

  return prompt
}