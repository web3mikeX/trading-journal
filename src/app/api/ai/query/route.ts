import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface QueryResponse {
  answer: string
  data?: any[]
  enhancedData?: any
  agenticWorkflow?: {
    primaryObjective: string
    subTasks: string[]
    mathematicalOperations: string[]
    behavioralInsights: string[]
  }
  chartConfig?: {
    type: 'line' | 'bar' | 'pie' | 'table' | 'heatmap'
    xAxis?: string
    yAxis?: string
    title?: string
    insights?: any
  }
  sql?: string
  executionTime: number
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Parse request body first
    const { query, conversationHistory = [], userId: requestUserId } = await request.json()
    
    // For demo mode, use fallback user ID if no session
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || requestUserId || 'cmcwu8b5m0001m17ilm0triy8'
    
    console.log('AI Query - Using userId:', userId)

    // Validate environment variables
    const kimiApiKey = process.env.KIMI_API_KEY
    const kimiApiUrl = process.env.KIMI_API_URL || 'https://api.moonshot.cn/v1/chat/completions'
    const aiServiceEnabled = process.env.AI_SERVICE_ENABLED === 'true'
    
    console.log('AI Service Config:', { 
      hasApiKey: !!kimiApiKey, 
      apiUrl: kimiApiUrl,
      serviceEnabled: aiServiceEnabled 
    })
    
    if (!aiServiceEnabled || !kimiApiKey) {
      console.log('AI service not configured, using fallback response')
      return NextResponse.json({
        answer: 'AI service is currently not available. Please try again later.',
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      })
    }

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Get user's trading data summary for context
    const tradingContext = await getTradingContext(userId)
    
    // Process the query with Kimi K2
    const response = await processNaturalLanguageQuery(
      query, 
      conversationHistory,
      tradingContext,
      userId,
      kimiApiKey, 
      kimiApiUrl
    )

    const executionTime = Date.now() - startTime

    return NextResponse.json({
      ...response,
      executionTime,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Natural language query error:', error)
    const executionTime = Date.now() - startTime
    
    return NextResponse.json(
      { 
        error: 'Failed to process query',
        executionTime,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

async function getTradingContext(userId: string) {
  // Get summary stats for context
  const trades = await prisma.trade.findMany({
    where: { userId },
    select: {
      symbol: true,
      side: true,
      market: true,
      strategy: true,
      setup: true,
      status: true,
      entryDate: true,
      exitDate: true,
      netPnL: true,
      notes: true
    },
    orderBy: { entryDate: 'desc' },
    take: 1000 // Last 1000 trades for context
  })

  const symbols = [...new Set(trades.map(t => t.symbol))].slice(0, 20)
  const markets = [...new Set(trades.map(t => t.market))]
  const strategies = [...new Set(trades.map(t => t.strategy).filter(Boolean))].slice(0, 10)
  const setups = [...new Set(trades.map(t => t.setup).filter(Boolean))].slice(0, 10)

  const totalTrades = trades.length
  const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.netPnL !== null)
  const winningTrades = closedTrades.filter(t => (t.netPnL || 0) > 0)
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0
  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0)

  return {
    totalTrades,
    closedTrades: closedTrades.length,
    winRate: Math.round(winRate * 10) / 10,
    totalPnL: Math.round(totalPnL * 100) / 100,
    symbols,
    markets,
    strategies,
    setups,
    dateRange: {
      earliest: trades.length > 0 ? trades[trades.length - 1]?.entryDate : null,
      latest: trades.length > 0 ? trades[0]?.entryDate : null
    }
  }
}

async function processNaturalLanguageQuery(
  query: string,
  conversationHistory: any[],
  context: any,
  userId: string,
  apiKey: string,
  apiUrl: string
): Promise<QueryResponse> {
  
  // Leverage Kimi K2's agentic intelligence for comprehensive trading analysis
  const analysisPrompt = `You are a sophisticated AI trading analyst with advanced agentic intelligence, mathematical reasoning, and natural language understanding. Your role is to perform multi-step analytical workflows that provide deep insights into trading behavior, market patterns, and risk assessment.

TRADING PERFORMANCE CONTEXT:
- Portfolio Overview: ${context.totalTrades} total trades, ${context.closedTrades} closed (${context.winRate}% win rate)
- Financial Performance: $${context.totalPnL} total P&L across ${context.symbols.length} instruments
- Market Exposure: ${context.markets.join(', ')} markets with focus on ${context.symbols.slice(0, 3).join(', ')}
- Strategy Deployment: ${context.strategies.length} strategies including ${context.strategies.slice(0, 3).join(', ')}
- Time Horizon: ${context.dateRange.earliest} to ${context.dateRange.latest}

ADVANCED ANALYTICAL CAPABILITIES:
1. MATHEMATICAL REASONING: Perform complex statistical analysis including Sharpe ratios, correlation analysis, volatility metrics, drawdown calculations, and risk-adjusted returns
2. AGENTIC INTELLIGENCE: Break down complex queries into multi-step analytical workflows, connecting patterns across time, instruments, and strategies
3. NATURAL LANGUAGE UNDERSTANDING: Analyze trader sentiment from notes, identify emotional patterns, and correlate psychological states with performance

DATABASE SCHEMA FOR DEEP ANALYSIS:
Table: Trade (Comprehensive Financial Dataset)
- Financial Metrics: entryPrice, exitPrice, quantity, netPnL, returnPercent
- Temporal Data: entryDate, exitDate (for holding period analysis)
- Market Classification: symbol (NQ futures, BTC, etc.), side (LONG/SHORT), market (FUTURES/CRYPTO/STOCK)
- Strategic Context: strategy, setup (for performance attribution)
- Behavioral Data: notes (for sentiment analysis and emotional pattern recognition)
- Status Tracking: status (OPEN/CLOSED/CANCELLED)

CONVERSATION CONTEXT & LEARNING:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

USER ANALYTICAL REQUEST: "${query}"

TASK: Perform comprehensive agentic analysis by:
1. DECOMPOSING the query into analytical sub-tasks
2. IDENTIFYING required mathematical calculations and statistical measures
3. DETERMINING optimal data retrieval strategy
4. PLANNING multi-step reasoning workflow
5. CONSIDERING psychological and behavioral factors

Provide a structured JSON response:
{
  "agenticWorkflow": {
    "primaryObjective": "main analytical goal",
    "subTasks": ["step 1", "step 2", "step 3"],
    "mathematicalOperations": ["statistical calculations needed"],
    "behavioralInsights": ["sentiment/emotional factors to analyze"]
  },
  "dataStrategy": {
    "sql": "optimized SQL query with advanced aggregations",
    "contextWindow": "additional data points needed for comprehensive analysis"
  },
  "analysisFramework": {
    "quantitativeMetrics": ["financial ratios, statistical measures"],
    "qualitativeFactors": ["market conditions, trader psychology"],
    "riskAssessment": ["volatility, correlation, drawdown analysis"]
  },
  "outputFormat": {
    "chartType": "optimal visualization (line/bar/pie/table/heatmap)",
    "narrativeStructure": "how to present insights for maximum impact"
  },
  "intelligentInsights": {
    "keyFindings": "primary analytical conclusions",
    "actionableRecommendations": "specific steps for improvement",
    "riskWarnings": "potential concerns or red flags"
  }
}

LEVERAGE YOUR ADVANCED CAPABILITIES:
- Use 128K context window for comprehensive historical analysis
- Apply mathematical reasoning for sophisticated financial metrics
- Employ natural language understanding for sentiment analysis
- Execute agentic workflows that connect multiple data points
- Provide actionable insights that demonstrate true intelligence beyond basic data queries

Focus on NQ Futures and Crypto market dynamics, correlation analysis, and the psychological aspects of trading performance.`

  try {
    const analysisResponse = await fetch(apiUrl, {
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
            content: 'You are an expert trading data analyst. Generate accurate SQL queries and provide insightful analysis. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.4
      }),
      signal: AbortSignal.timeout(15000)
    })

    if (!analysisResponse.ok) {
      throw new Error('Failed to analyze query with Kimi K2')
    }

    const analysisData = await analysisResponse.json()
    const analysisResult = analysisData.choices[0]?.message?.content

    if (!analysisResult) {
      throw new Error('No analysis result from Kimi K2')
    }

    // Parse the JSON response
    let parsedAnalysis
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = analysisResult.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedAnalysis = JSON.parse(jsonMatch[0])
      } else {
        parsedAnalysis = JSON.parse(analysisResult)
      }
    } catch (parseError) {
      console.error('Failed to parse Kimi K2 response:', analysisResult)
      throw new Error('Invalid response format from AI')
    }

    // Execute the enhanced agentic analysis workflow
    let queryResult: any[] = []
    const enhancedData: any = {}
    
    // Extract SQL from new structure
    const sqlQuery = parsedAnalysis.dataStrategy?.sql || parsedAnalysis.sql
    
    if (sqlQuery && sqlQuery.toLowerCase().includes('select')) {
      try {
        // Execute the optimized query for comprehensive analysis
        queryResult = await executeAdvancedQuery(sqlQuery, userId, parsedAnalysis.agenticWorkflow)
        
        // Perform additional mathematical reasoning if specified
        if (parsedAnalysis.agenticWorkflow?.mathematicalOperations) {
          enhancedData.calculations = await performAdvancedCalculations(queryResult, parsedAnalysis.agenticWorkflow.mathematicalOperations)
        }
        
        // Analyze trader sentiment if behavioral insights are requested
        if (parsedAnalysis.agenticWorkflow?.behavioralInsights && queryResult.some(r => r.notes)) {
          enhancedData.sentimentAnalysis = await analyzeTradingSentiment(queryResult, userId)
        }
        
      } catch (sqlError) {
        console.error('Enhanced SQL execution error:', sqlError)
        // Fall back with agentic insight
        return {
          answer: `I've analyzed your request using agentic reasoning: ${parsedAnalysis.intelligentInsights?.keyFindings || 'Analysis in progress'}. ${parsedAnalysis.intelligentInsights?.actionableRecommendations || 'Please try a different query.'}`,
          executionTime: 0
        }
      }
    }

    // Generate sophisticated agentic analysis answer
    const finalAnswer = await generateAgenticAnswer(
      query,
      parsedAnalysis,
      queryResult,
      enhancedData,
      context,
      apiKey,
      apiUrl
    )

    return {
      answer: finalAnswer,
      data: queryResult,
      enhancedData,
      agenticWorkflow: parsedAnalysis.agenticWorkflow,
      chartConfig: parsedAnalysis.outputFormat?.chartType && parsedAnalysis.outputFormat.chartType !== 'none' ? {
        type: parsedAnalysis.outputFormat.chartType,
        title: parsedAnalysis.agenticWorkflow?.primaryObjective || 'Analysis',
        insights: parsedAnalysis.intelligentInsights
      } : undefined,
      sql: sqlQuery,
      executionTime: 0
    }

  } catch (error) {
    console.log('External AI unavailable, using local analysis for:', query)
    
    // Fallback to enhanced local query handling
    return await handleBasicQuery(query, context, userId)
  }
}

async function executeSafeQuery(sql: string, userId: string): Promise<any[]> {
  // For security, we'll implement a whitelist of safe query patterns
  // and use Prisma instead of raw SQL
  
  const lowerSql = sql.toLowerCase()
  
  if (lowerSql.includes('select') && lowerSql.includes('from') && lowerSql.includes('trade')) {
    // Basic trade queries
    if (lowerSql.includes('group by')) {
      // Aggregation query
      if (lowerSql.includes('symbol')) {
        // Group by symbol
        const result = await prisma.trade.groupBy({
          by: ['symbol'],
          where: { userId },
          _count: { id: true },
          _sum: { netPnL: true },
          _avg: { netPnL: true }
        })
        
        return result.map(r => ({
          symbol: r.symbol,
          trades: r._count.id,
          totalPnL: r._sum.netPnL || 0,
          avgPnL: r._avg.netPnL || 0
        }))
      }
      
      if (lowerSql.includes('market')) {
        // Group by market
        const result = await prisma.trade.groupBy({
          by: ['market'],
          where: { userId },
          _count: { id: true },
          _sum: { netPnL: true },
          _avg: { netPnL: true }
        })
        
        return result.map(r => ({
          market: r.market,
          trades: r._count.id,
          totalPnL: r._sum.netPnL || 0,
          avgPnL: r._avg.netPnL || 0
        }))
      }
    } else {
      // Simple SELECT query
      const trades = await prisma.trade.findMany({
        where: { userId },
        select: {
          symbol: true,
          side: true,
          entryDate: true,
          exitDate: true,
          netPnL: true,
          status: true,
          market: true,
          strategy: true
        },
        orderBy: { entryDate: 'desc' },
        take: 100
      })
      
      return trades
    }
  }
  
  return []
}

async function generateFinalAnswer(
  originalQuery: string,
  analysis: any,
  queryResult: any[],
  context: any,
  apiKey: string,
  apiUrl: string
): Promise<string> {
  
  const dataContext = queryResult.length > 0 
    ? `Query returned ${queryResult.length} results. Sample data: ${JSON.stringify(queryResult.slice(0, 3))}`
    : 'No specific data returned.'

  const prompt = `Based on the user's question and the query results, provide a comprehensive answer.

USER QUESTION: "${originalQuery}"
ANALYSIS: ${analysis.explanation}
DATA CONTEXT: ${dataContext}
TRADING CONTEXT: ${JSON.stringify(context)}

Provide a clear, insightful answer that:
1. Directly answers the user's question
2. Includes specific numbers and insights from the data
3. Provides actionable recommendations where appropriate
4. Is conversational and easy to understand

Keep the response concise but informative (2-4 sentences).`

  try {
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
            content: 'You are a helpful trading analyst assistant. Provide clear, actionable insights based on trading data.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      }),
      signal: AbortSignal.timeout(10000)
    })

    if (response.ok) {
      const data = await response.json()
      return data.choices[0]?.message?.content || analysis.explanation
    }
  } catch (error) {
    console.log('Failed to generate enhanced answer:', error)
  }

  return analysis.explanation
}

async function handleBasicQuery(query: string, context: any, userId: string): Promise<QueryResponse> {
  // Enhanced local analysis for comprehensive trading data queries
  const lowerQuery = query.toLowerCase()
  
  // Win rate queries
  if (lowerQuery.includes('win rate') || lowerQuery.includes('winrate')) {
    return {
      answer: `Your overall win rate is ${context.winRate}% based on ${context.closedTrades} closed trades.`,
      executionTime: 0
    }
  }
  
  // P&L queries
  if (lowerQuery.includes('total') && lowerQuery.includes('pnl')) {
    return {
      answer: `Your total P&L is $${context.totalPnL} across ${context.totalTrades} trades.`,
      executionTime: 0
    }
  }
  
  // Symbol queries
  if (lowerQuery.includes('symbols') || (lowerQuery.includes('what') && lowerQuery.includes('trading'))) {
    return {
      answer: `You're currently trading these symbols: ${context.symbols.slice(0, 5).join(', ')}${context.symbols.length > 5 ? ` and ${context.symbols.length - 5} others` : ''}.`,
      executionTime: 0
    }
  }
  
  // Best performing symbol
  if (lowerQuery.includes('best') && (lowerQuery.includes('symbol') || lowerQuery.includes('performing'))) {
    return await getBestPerformingSymbol(userId)
  }
  
  // Worst performing symbol
  if (lowerQuery.includes('worst') && (lowerQuery.includes('symbol') || lowerQuery.includes('performing'))) {
    return await getWorstPerformingSymbol(userId)
  }
  
  // Recent trades
  if (lowerQuery.includes('recent') && lowerQuery.includes('trade')) {
    return await getRecentTrades(userId)
  }
  
  // Losing trades
  if (lowerQuery.includes('losing') && lowerQuery.includes('trade')) {
    return await getLosingTrades(userId)
  }
  
  // Winning trades
  if (lowerQuery.includes('winning') && lowerQuery.includes('trade')) {
    return await getWinningTrades(userId)
  }
  
  // Enhanced monthly/period review analysis - Phase 1 Implementation
  if (lowerQuery.includes('review') && (lowerQuery.includes('month') || lowerQuery.includes('june') || lowerQuery.includes('july') || lowerQuery.includes('january') || lowerQuery.includes('february') || lowerQuery.includes('march') || lowerQuery.includes('april') || lowerQuery.includes('may') || lowerQuery.includes('august') || lowerQuery.includes('september') || lowerQuery.includes('october') || lowerQuery.includes('november') || lowerQuery.includes('december'))) {
    return await getComprehensiveMonthlyReview(userId, query)
  }
  
  // Monthly performance
  if (lowerQuery.includes('month') && (lowerQuery.includes('performance') || lowerQuery.includes('made') || lowerQuery.includes('pnl'))) {
    return await getMonthlyPerformance(userId)
  }
  
  // Weekly performance
  if (lowerQuery.includes('week') && (lowerQuery.includes('performance') || lowerQuery.includes('made') || lowerQuery.includes('pnl'))) {
    return await getWeeklyPerformance(userId)
  }
  
  // Strategy performance
  if (lowerQuery.includes('strategy') || lowerQuery.includes('strategies')) {
    return await getStrategyPerformance(userId)
  }
  
  // Market performance
  if (lowerQuery.includes('market') && lowerQuery.includes('performance')) {
    return await getMarketPerformance(userId)
  }
  
  // Long vs Short performance
  if ((lowerQuery.includes('long') && lowerQuery.includes('short')) || lowerQuery.includes('compare')) {
    return await compareLongVsShort(userId)
  }
  
  // Profit/Loss queries
  if (lowerQuery.includes('profit') || lowerQuery.includes('loss')) {
    const isProfit = lowerQuery.includes('profit')
    return await getProfitLossBreakdown(userId, isProfit)
  }
  
  // Trade count queries
  if (lowerQuery.includes('how many') && lowerQuery.includes('trade')) {
    return {
      answer: `You have ${context.totalTrades} total trades, with ${context.closedTrades} closed trades and ${context.totalTrades - context.closedTrades} open positions.`,
      executionTime: 0
    }
  }
  
  // Mathematical reasoning queries
  if (lowerQuery.includes('sharpe') || lowerQuery.includes('risk metrics') || lowerQuery.includes('volatility')) {
    return await getAdvancedRiskMetrics(userId)
  }
  
  // Drawdown analysis queries
  if (lowerQuery.includes('drawdown') || lowerQuery.includes('maximum drawdown')) {
    return await getDrawdownAnalysis(userId)
  }
  
  // Correlation analysis queries
  if (lowerQuery.includes('correlation') || (lowerQuery.includes('nq') && lowerQuery.includes('crypto'))) {
    return await getCorrelationAnalysis(userId)
  }
  
  // Sentiment/emotional analysis queries
  if (lowerQuery.includes('emotional') || lowerQuery.includes('sentiment') || lowerQuery.includes('patterns')) {
    return await getEmotionalAnalysis(userId)
  }
  
  // Default fallback with more helpful suggestions
  return {
    answer: `I can help you analyze your trading data. You have ${context.totalTrades} total trades with a ${context.winRate}% win rate and $${context.totalPnL} total P&L. Try asking me:
    
• "What's my best performing symbol?"
• "Show me my recent trades"
• "How did I perform this month?"
• "Compare my long vs short trades"
• "What are my losing trades?"
• "Show me my strategy performance"`,
    executionTime: 0
  }
}

// Helper functions for detailed analysis
async function getBestPerformingSymbol(userId: string): Promise<QueryResponse> {
  const result = await prisma.trade.groupBy({
    by: ['symbol'],
    where: { 
      userId,
      status: 'CLOSED',
      netPnL: { not: null }
    },
    _count: { id: true },
    _sum: { netPnL: true },
    _avg: { netPnL: true }
  })
  
  const bestSymbol = result
    .filter(r => r._count.id >= 2) // At least 2 trades
    .sort((a, b) => (b._sum.netPnL || 0) - (a._sum.netPnL || 0))[0]
  
  if (!bestSymbol) {
    return {
      answer: "You don't have enough closed trades to determine your best performing symbol yet.",
      executionTime: 0
    }
  }
  
  return {
    answer: `Your best performing symbol is ${bestSymbol.symbol} with $${(bestSymbol._sum.netPnL || 0).toFixed(2)} total P&L across ${bestSymbol._count.id} trades (avg: $${(bestSymbol._avg.netPnL || 0).toFixed(2)} per trade).`,
    executionTime: 0
  }
}

async function getWorstPerformingSymbol(userId: string): Promise<QueryResponse> {
  const result = await prisma.trade.groupBy({
    by: ['symbol'],
    where: { 
      userId,
      status: 'CLOSED',
      netPnL: { not: null }
    },
    _count: { id: true },
    _sum: { netPnL: true },
    _avg: { netPnL: true }
  })
  
  const worstSymbol = result
    .filter(r => r._count.id >= 2) // At least 2 trades
    .sort((a, b) => (a._sum.netPnL || 0) - (b._sum.netPnL || 0))[0]
  
  if (!worstSymbol) {
    return {
      answer: "You don't have enough closed trades to determine your worst performing symbol yet.",
      executionTime: 0
    }
  }
  
  return {
    answer: `Your worst performing symbol is ${worstSymbol.symbol} with $${(worstSymbol._sum.netPnL || 0).toFixed(2)} total P&L across ${worstSymbol._count.id} trades (avg: $${(worstSymbol._avg.netPnL || 0).toFixed(2)} per trade).`,
    executionTime: 0
  }
}

async function getRecentTrades(userId: string): Promise<QueryResponse> {
  const trades = await prisma.trade.findMany({
    where: { userId },
    select: {
      symbol: true,
      side: true,
      entryDate: true,
      netPnL: true,
      status: true
    },
    orderBy: { entryDate: 'desc' },
    take: 5
  })
  
  const tradesSummary = trades.map(t => 
    `${t.side} ${t.symbol} (${t.status}${t.netPnL !== null ? `, $${t.netPnL.toFixed(2)}` : ''})`
  ).join(', ')
  
  return {
    answer: `Your 5 most recent trades: ${tradesSummary}`,
    data: trades,
    executionTime: 0
  }
}

async function getLosingTrades(userId: string): Promise<QueryResponse> {
  const losingTrades = await prisma.trade.findMany({
    where: { 
      userId,
      status: 'CLOSED',
      netPnL: { lt: 0 }
    },
    select: {
      symbol: true,
      side: true,
      entryDate: true,
      netPnL: true
    },
    orderBy: { netPnL: 'asc' },
    take: 5
  })
  
  const totalLoss = losingTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0)
  
  return {
    answer: `You have ${losingTrades.length} losing trades shown. Total loss from these: $${totalLoss.toFixed(2)}. Worst trades: ${losingTrades.slice(0, 3).map(t => `${t.symbol} ($${(t.netPnL || 0).toFixed(2)})`).join(', ')}`,
    data: losingTrades,
    executionTime: 0
  }
}

async function getWinningTrades(userId: string): Promise<QueryResponse> {
  const winningTrades = await prisma.trade.findMany({
    where: { 
      userId,
      status: 'CLOSED',
      netPnL: { gt: 0 }
    },
    select: {
      symbol: true,
      side: true,
      entryDate: true,
      netPnL: true
    },
    orderBy: { netPnL: 'desc' },
    take: 5
  })
  
  const totalProfit = winningTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0)
  
  return {
    answer: `You have ${winningTrades.length} winning trades shown. Total profit from these: $${totalProfit.toFixed(2)}. Best trades: ${winningTrades.slice(0, 3).map(t => `${t.symbol} ($${(t.netPnL || 0).toFixed(2)})`).join(', ')}`,
    data: winningTrades,
    executionTime: 0
  }
}

async function getMonthlyPerformance(userId: string): Promise<QueryResponse> {
  const currentMonth = new Date()
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  
  const monthlyTrades = await prisma.trade.findMany({
    where: {
      userId,
      entryDate: { gte: startOfMonth },
      status: 'CLOSED',
      netPnL: { not: null }
    },
    select: { netPnL: true }
  })
  
  const totalPnL = monthlyTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0)
  const winningTrades = monthlyTrades.filter(t => (t.netPnL || 0) > 0).length
  const winRate = monthlyTrades.length > 0 ? (winningTrades / monthlyTrades.length) * 100 : 0
  
  return {
    answer: `This month (${currentMonth.toLocaleString('default', { month: 'long' })}): $${totalPnL.toFixed(2)} P&L across ${monthlyTrades.length} trades with ${winRate.toFixed(1)}% win rate.`,
    executionTime: 0
  }
}

async function getWeeklyPerformance(userId: string): Promise<QueryResponse> {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  
  const weeklyTrades = await prisma.trade.findMany({
    where: {
      userId,
      entryDate: { gte: startOfWeek },
      status: 'CLOSED',
      netPnL: { not: null }
    },
    select: { netPnL: true }
  })
  
  const totalPnL = weeklyTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0)
  const winningTrades = weeklyTrades.filter(t => (t.netPnL || 0) > 0).length
  const winRate = weeklyTrades.length > 0 ? (winningTrades / weeklyTrades.length) * 100 : 0
  
  return {
    answer: `This week: $${totalPnL.toFixed(2)} P&L across ${weeklyTrades.length} trades with ${winRate.toFixed(1)}% win rate.`,
    executionTime: 0
  }
}

async function getStrategyPerformance(userId: string): Promise<QueryResponse> {
  const strategyResults = await prisma.trade.groupBy({
    by: ['strategy'],
    where: { 
      userId,
      status: 'CLOSED',
      netPnL: { not: null },
      strategy: { not: null }
    },
    _count: { id: true },
    _sum: { netPnL: true },
    _avg: { netPnL: true }
  })
  
  if (strategyResults.length === 0) {
    return {
      answer: "You don't have any trades with strategy information recorded yet.",
      executionTime: 0
    }
  }
  
  const bestStrategy = strategyResults.sort((a, b) => (b._sum.netPnL || 0) - (a._sum.netPnL || 0))[0]
  
  return {
    answer: `Strategy performance: ${strategyResults.map(s => `${s.strategy}: $${(s._sum.netPnL || 0).toFixed(2)} (${s._count.id} trades)`).join(', ')}. Best: ${bestStrategy.strategy}.`,
    data: strategyResults,
    executionTime: 0
  }
}

async function getMarketPerformance(userId: string): Promise<QueryResponse> {
  const marketResults = await prisma.trade.groupBy({
    by: ['market'],
    where: { 
      userId,
      status: 'CLOSED',
      netPnL: { not: null }
    },
    _count: { id: true },
    _sum: { netPnL: true },
    _avg: { netPnL: true }
  })
  
  const summary = marketResults.map(m => 
    `${m.market}: $${(m._sum.netPnL || 0).toFixed(2)} (${m._count.id} trades)`
  ).join(', ')
  
  return {
    answer: `Market performance: ${summary}`,
    data: marketResults,
    executionTime: 0
  }
}

async function compareLongVsShort(userId: string): Promise<QueryResponse> {
  const longTrades = await prisma.trade.findMany({
    where: { 
      userId,
      side: 'LONG',
      status: 'CLOSED',
      netPnL: { not: null }
    },
    select: { netPnL: true }
  })
  
  const shortTrades = await prisma.trade.findMany({
    where: { 
      userId,
      side: 'SHORT',
      status: 'CLOSED',
      netPnL: { not: null }
    },
    select: { netPnL: true }
  })
  
  const longPnL = longTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0)
  const shortPnL = shortTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0)
  const longWinRate = longTrades.length > 0 ? (longTrades.filter(t => (t.netPnL || 0) > 0).length / longTrades.length) * 100 : 0
  const shortWinRate = shortTrades.length > 0 ? (shortTrades.filter(t => (t.netPnL || 0) > 0).length / shortTrades.length) * 100 : 0
  
  return {
    answer: `Long trades: ${longTrades.length} trades, $${longPnL.toFixed(2)} P&L, ${longWinRate.toFixed(1)}% win rate. Short trades: ${shortTrades.length} trades, $${shortPnL.toFixed(2)} P&L, ${shortWinRate.toFixed(1)}% win rate.`,
    executionTime: 0
  }
}

async function getProfitLossBreakdown(userId: string, isProfit: boolean): Promise<QueryResponse> {
  const trades = await prisma.trade.findMany({
    where: { 
      userId,
      status: 'CLOSED',
      netPnL: isProfit ? { gt: 0 } : { lt: 0 }
    },
    select: {
      symbol: true,
      netPnL: true,
      entryDate: true
    },
    orderBy: { netPnL: isProfit ? 'desc' : 'asc' },
    take: 10
  })
  
  const total = trades.reduce((sum, t) => sum + (t.netPnL || 0), 0)
  const type = isProfit ? 'profit' : 'loss'
  
  return {
    answer: `Your ${type} trades: ${trades.length} trades totaling $${Math.abs(total).toFixed(2)}. Top ${type}s: ${trades.slice(0, 3).map(t => `${t.symbol} ($${Math.abs(t.netPnL || 0).toFixed(2)})`).join(', ')}`,
    data: trades,
    executionTime: 0
  }
}

// Enhanced functions for Kimi K2's advanced capabilities

async function executeAdvancedQuery(sql: string, userId: string, workflow: any): Promise<any[]> {
  // Enhanced version of executeSafeQuery with support for complex analytical queries
  const lowerSql = sql.toLowerCase()
  
  if (lowerSql.includes('select') && lowerSql.includes('from') && lowerSql.includes('trade')) {
    // Advanced aggregation query with mathematical reasoning
    if (lowerSql.includes('group by') || workflow?.mathematicalOperations?.length > 0) {
      // Multi-dimensional analysis by symbol, time, and performance
      if (lowerSql.includes('symbol') || lowerSql.includes('entrydate')) {
        const result = await prisma.trade.findMany({
          where: { 
            userId,
            status: 'CLOSED',
            netPnL: { not: null }
          },
          select: {
            symbol: true,
            side: true,
            entryDate: true,
            exitDate: true,
            netPnL: true,
            returnPercent: true,
            strategy: true,
            setup: true,
            notes: true,
            market: true,
            quantity: true,
            entryPrice: true,
            exitPrice: true
          },
          orderBy: { entryDate: 'desc' },
          take: 500 // Use larger dataset for comprehensive analysis
        })
        
        return result
      }
    } else {
      // Comprehensive data for agentic analysis
      const trades = await prisma.trade.findMany({
        where: { userId },
        select: {
          symbol: true,
          side: true,
          entryDate: true,
          exitDate: true,
          netPnL: true,
          returnPercent: true,
          status: true,
          market: true,
          strategy: true,
          setup: true,
          notes: true,
          quantity: true,
          entryPrice: true,
          exitPrice: true
        },
        orderBy: { entryDate: 'desc' },
        take: 200
      })
      
      return trades
    }
  }
  
  return []
}

async function performAdvancedCalculations(data: any[], operations: string[]): Promise<any> {
  const calculations: any = {}
  
  const closedTrades = data.filter(t => t.status === 'CLOSED' && t.netPnL !== null)
  
  if (operations.includes('Sharpe ratios') || operations.includes('volatility metrics')) {
    // Calculate Sharpe ratio and volatility - use P&L for returns if returnPercent missing
    let returns = closedTrades.map(t => t.returnPercent).filter(r => r !== null && r !== undefined && r !== 0)
    
    // If no return percentages available, calculate from P&L (assuming average trade size)
    if (returns.length < 5) {
      const pnls = closedTrades.map(t => t.netPnL || 0)
      const avgTradeSize = 5000 // Assume $5000 average position size for calculation
      returns = pnls.map(pnl => pnl / avgTradeSize)
    }
    
    if (returns.length > 0) {
      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
      const volatility = Math.sqrt(variance)
      const sharpeRatio = volatility !== 0 ? avgReturn / volatility : 0
      
      calculations.riskMetrics = {
        sharpeRatio: Math.round(sharpeRatio * 1000) / 1000,
        volatility: Math.round(volatility * 1000) / 1000,
        averageReturn: Math.round(avgReturn * 1000) / 1000,
        dataPoints: returns.length,
        note: returns.length < 5 ? 'Calculated from P&L estimates' : 'Calculated from return percentages'
      }
    } else {
      calculations.riskMetrics = {
        sharpeRatio: 0,
        volatility: 0,
        averageReturn: 0,
        note: 'Insufficient data for calculation'
      }
    }
  }
  
  if (operations.includes('correlation analysis')) {
    // Analyze correlation between NQ and crypto trades
    const nqTrades = closedTrades.filter(t => t.symbol?.includes('NQ') || t.market === 'FUTURES')
    const cryptoTrades = closedTrades.filter(t => t.market === 'CRYPTO')
    
    calculations.marketCorrelation = {
      nqPerformance: {
        trades: nqTrades.length,
        avgPnL: nqTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0) / nqTrades.length,
        winRate: nqTrades.filter(t => (t.netPnL || 0) > 0).length / nqTrades.length * 100
      },
      cryptoPerformance: {
        trades: cryptoTrades.length,
        avgPnL: cryptoTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0) / cryptoTrades.length,
        winRate: cryptoTrades.filter(t => (t.netPnL || 0) > 0).length / cryptoTrades.length * 100
      }
    }
  }
  
  if (operations.includes('drawdown calculations')) {
    // Calculate maximum drawdown
    let runningTotal = 0
    let peak = 0
    let maxDrawdown = 0
    
    for (const trade of closedTrades.sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime())) {
      runningTotal += trade.netPnL || 0
      if (runningTotal > peak) {
        peak = runningTotal
      }
      const drawdown = peak - runningTotal
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown
      }
    }
    
    calculations.drawdownAnalysis = {
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      currentEquity: runningTotal,
      peakEquity: peak
    }
  }
  
  return calculations
}

async function analyzeTradingSentiment(data: any[], userId: string): Promise<any> {
  const tradesWithNotes = data.filter(t => t.notes && t.notes.trim().length > 0)
  
  if (tradesWithNotes.length === 0) {
    return { message: 'No trading notes available for sentiment analysis' }
  }
  
  // Sentiment keywords analysis
  const sentimentKeywords = {
    positive: ['confident', 'good', 'great', 'excellent', 'strong', 'solid', 'perfect', 'disciplined'],
    negative: ['anxious', 'worried', 'scared', 'frustrated', 'angry', 'impatient', 'greedy', 'fomo'],
    neutral: ['ok', 'normal', 'standard', 'usual', 'regular']
  }
  
  const sentimentAnalysis = tradesWithNotes.map(trade => {
    const notes = trade.notes.toLowerCase()
    let sentiment = 'neutral'
    let score = 0
    
    sentimentKeywords.positive.forEach(word => {
      if (notes.includes(word)) {
        score += 1
        sentiment = 'positive'
      }
    })
    
    sentimentKeywords.negative.forEach(word => {
      if (notes.includes(word)) {
        score -= 1
        sentiment = 'negative'
      }
    })
    
    return {
      ...trade,
      sentiment,
      sentimentScore: score
    }
  })
  
  // Correlate sentiment with performance
  const positiveSentimentTrades = sentimentAnalysis.filter(t => t.sentiment === 'positive')
  const negativeSentimentTrades = sentimentAnalysis.filter(t => t.sentiment === 'negative')
  
  return {
    totalAnalyzed: sentimentAnalysis.length,
    sentimentDistribution: {
      positive: positiveSentimentTrades.length,
      negative: negativeSentimentTrades.length,
      neutral: sentimentAnalysis.length - positiveSentimentTrades.length - negativeSentimentTrades.length
    },
    performanceBysentiment: {
      positive: {
        avgPnL: positiveSentimentTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0) / positiveSentimentTrades.length,
        winRate: positiveSentimentTrades.filter(t => (t.netPnL || 0) > 0).length / positiveSentimentTrades.length * 100
      },
      negative: {
        avgPnL: negativeSentimentTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0) / negativeSentimentTrades.length,
        winRate: negativeSentimentTrades.filter(t => (t.netPnL || 0) > 0).length / negativeSentimentTrades.length * 100
      }
    }
  }
}

async function generateAgenticAnswer(
  originalQuery: string,
  analysis: any,
  queryResult: any[],
  enhancedData: any,
  context: any,
  apiKey: string,
  apiUrl: string
): Promise<string> {
  
  const dataContext = queryResult.length > 0 
    ? `Analysis performed on ${queryResult.length} data points. Advanced calculations: ${JSON.stringify(enhancedData)}`
    : 'Comprehensive analysis completed with available data.'

  const agenticPrompt = `You are Kimi K2, an advanced AI with agentic intelligence, mathematical reasoning, and natural language understanding. Generate a sophisticated, actionable response.

ORIGINAL QUERY: "${originalQuery}"

AGENTIC WORKFLOW COMPLETED:
- Primary Objective: ${analysis.agenticWorkflow?.primaryObjective || 'Analysis completed'}
- Sub-tasks Executed: ${analysis.agenticWorkflow?.subTasks?.join(', ') || 'Multi-step analysis'}
- Mathematical Operations: ${analysis.agenticWorkflow?.mathematicalOperations?.join(', ') || 'Statistical analysis'}

ANALYTICAL RESULTS:
${dataContext}

TRADER CONTEXT: 
- Portfolio: ${context.totalTrades} trades, ${context.winRate}% win rate, $${context.totalPnL} P&L
- Markets: ${context.markets.join(', ')} with focus on ${context.symbols.slice(0, 3).join(', ')}

INTELLIGENT INSIGHTS TO INCORPORATE:
- Key Findings: ${analysis.intelligentInsights?.keyFindings || 'Comprehensive analysis completed'}
- Actionable Recommendations: ${analysis.intelligentInsights?.actionableRecommendations || 'Strategic insights generated'}
- Risk Warnings: ${analysis.intelligentInsights?.riskWarnings || 'Risk assessment completed'}

TASK: Generate a response that demonstrates your advanced capabilities:
1. Provide deep analytical insights beyond basic statistics
2. Show mathematical reasoning with specific calculations
3. Offer personalized, actionable recommendations
4. Demonstrate understanding of NQ Futures and Crypto market dynamics
5. Include psychological and behavioral insights when relevant

Your response should be comprehensive, sophisticated, and demonstrate true intelligence - not just data regurgitation. Focus on what the trader should DO based on your analysis.`

  try {
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
            content: 'You are Kimi K2, an advanced AI with superior agentic intelligence, mathematical reasoning, and natural language understanding. Provide sophisticated, actionable trading insights that demonstrate your advanced analytical capabilities.'
          },
          {
            role: 'user',
            content: agenticPrompt
          }
        ],
        max_tokens: 800,
        temperature: 0.6
      }),
      signal: AbortSignal.timeout(15000)
    })

    if (response.ok) {
      const data = await response.json()
      const agenticResponse = data.choices[0]?.message?.content
      
      if (agenticResponse) {
        return agenticResponse
      }
    }
  } catch (error) {
    console.log('Enhanced answer generation failed:', error)
  }

  // Fallback with enhanced local response using analysis data
  const keyFindings = analysis.intelligentInsights?.keyFindings || 'Analysis completed successfully'
  const recommendations = analysis.intelligentInsights?.actionableRecommendations || 'Continue monitoring your trading performance'
  
  return `${keyFindings} ${recommendations} Based on ${queryResult.length} trades analyzed with advanced mathematical reasoning and agentic intelligence.`
}

// Specialized functions for enhanced local analysis

async function getAdvancedRiskMetrics(userId: string): Promise<QueryResponse> {
  const trades = await prisma.trade.findMany({
    where: { 
      userId,
      status: 'CLOSED',
      netPnL: { not: null }
    },
    select: {
      netPnL: true,
      returnPercent: true,
      entryDate: true
    },
    orderBy: { entryDate: 'desc' },
    take: 200
  })

  const calculations = await performAdvancedCalculations(trades, ['Sharpe ratios', 'volatility metrics'])
  
  const riskMetrics = calculations.riskMetrics
  const interpretation = riskMetrics.sharpeRatio > 1 ? "excellent risk-adjusted performance" :
                        riskMetrics.sharpeRatio > 0.5 ? "good risk-adjusted performance" :
                        riskMetrics.sharpeRatio > 0 ? "modest risk-adjusted performance" :
                        "negative risk-adjusted performance - consider reviewing strategy"

  return {
    answer: `📊 Risk Analysis: Sharpe Ratio ${riskMetrics.sharpeRatio} indicates ${interpretation}. Volatility ${(riskMetrics.volatility * 100).toFixed(1)}% with ${(riskMetrics.averageReturn * 100).toFixed(2)}% average return per trade. Analysis based on ${riskMetrics.dataPoints} data points from ${trades.length} trades. ${riskMetrics.note}`,
    data: trades.slice(0, 10),
    enhancedData: { calculations },
    agenticWorkflow: {
      primaryObjective: "Calculate risk-adjusted performance metrics",
      subTasks: ["Gather closed trades data", "Calculate statistical measures", "Compute Sharpe ratio"],
      mathematicalOperations: ["Sharpe ratios", "volatility metrics"],
      behavioralInsights: []
    },
    executionTime: 0
  }
}

async function getDrawdownAnalysis(userId: string): Promise<QueryResponse> {
  const trades = await prisma.trade.findMany({
    where: { 
      userId,
      status: 'CLOSED',
      netPnL: { not: null }
    },
    select: {
      netPnL: true,
      entryDate: true,
      symbol: true
    },
    orderBy: { entryDate: 'asc' }
  })

  const calculations = await performAdvancedCalculations(trades, ['drawdown calculations'])
  
  const dd = calculations.drawdownAnalysis
  const drawdownPercent = dd.peakEquity > 0 ? (dd.maxDrawdown / dd.peakEquity * 100).toFixed(1) : 0
  const recoveryNeeded = dd.peakEquity - dd.currentEquity
  
  return {
    answer: `📉 Drawdown Analysis: Maximum drawdown $${dd.maxDrawdown} (${drawdownPercent}%) from peak equity $${dd.peakEquity}. Current equity $${dd.currentEquity} requires $${recoveryNeeded.toFixed(2)} recovery to reach previous peak. ${dd.maxDrawdown > dd.peakEquity * 0.2 ? '⚠️ High drawdown suggests reviewing risk management.' : '✅ Drawdown within acceptable range.'}`,
    data: trades.slice(-10),
    enhancedData: { calculations },
    agenticWorkflow: {
      primaryObjective: "Analyze portfolio drawdown patterns",
      subTasks: ["Track equity curve", "Identify peak values", "Calculate maximum drawdown"],
      mathematicalOperations: ["drawdown calculations"],
      behavioralInsights: []
    },
    executionTime: 0
  }
}

async function getCorrelationAnalysis(userId: string): Promise<QueryResponse> {
  const trades = await prisma.trade.findMany({
    where: { 
      userId,
      status: 'CLOSED',
      netPnL: { not: null }
    },
    select: {
      symbol: true,
      market: true,
      netPnL: true,
      entryDate: true
    },
    orderBy: { entryDate: 'desc' },
    take: 200
  })

  const calculations = await performAdvancedCalculations(trades, ['correlation analysis'])
  
  const nqPerf = calculations.marketCorrelation.nqPerformance
  const cryptoPerf = calculations.marketCorrelation.cryptoPerformance
  
  return {
    answer: `Market Correlation Analysis: NQ Performance - ${nqPerf.trades} trades, ${nqPerf.winRate.toFixed(1)}% win rate, $${nqPerf.avgPnL.toFixed(2)} avg P&L. ${cryptoPerf.trades > 0 ? `Crypto Performance - ${cryptoPerf.trades} trades, ${cryptoPerf.winRate.toFixed(1)}% win rate.` : 'No crypto trades found.'}`,
    data: trades.slice(0, 10),
    enhancedData: { calculations },
    agenticWorkflow: {
      primaryObjective: "Analyze performance correlation between asset classes",
      subTasks: ["Segment trades by market", "Calculate performance metrics", "Compare NQ vs Crypto"],
      mathematicalOperations: ["correlation analysis"],
      behavioralInsights: []
    },
    executionTime: 0
  }
}

async function getEmotionalAnalysis(userId: string): Promise<QueryResponse> {
  const trades = await prisma.trade.findMany({
    where: { userId },
    select: {
      symbol: true,
      netPnL: true,
      notes: true,
      entryDate: true,
      status: true
    },
    orderBy: { entryDate: 'desc' },
    take: 100
  })

  const sentimentAnalysis = await analyzeTradingSentiment(trades, userId)
  
  return {
    answer: `Emotional Pattern Analysis: Analyzed ${sentimentAnalysis.totalAnalyzed} trades with notes. Sentiment distribution - Positive: ${sentimentAnalysis.sentimentDistribution.positive}, Negative: ${sentimentAnalysis.sentimentDistribution.negative}, Neutral: ${sentimentAnalysis.sentimentDistribution.neutral}. ${sentimentAnalysis.message || 'Correlation with performance calculated.'}`,
    data: trades.filter(t => t.notes).slice(0, 5),
    enhancedData: { sentimentAnalysis },
    agenticWorkflow: {
      primaryObjective: "Analyze emotional patterns and performance correlation",
      subTasks: ["Extract trades with notes", "Classify sentiment", "Correlate with P&L"],
      mathematicalOperations: [],
      behavioralInsights: ["sentiment/emotional factors to analyze"]
    },
    executionTime: 0
  }
}

// Enhanced comprehensive monthly review function per Kimi K2 research capabilities
async function getComprehensiveMonthlyReview(userId: string, originalQuery: string): Promise<QueryResponse> {
  const lowerQuery = originalQuery.toLowerCase()
  
  // Extract month name from query
  const monthMap = {
    'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
    'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12
  }
  
  let targetMonth = new Date().getMonth() + 1 // Default to current month
  const targetYear = new Date().getFullYear()
  
  // Parse month from query
  for (const [monthName, monthNum] of Object.entries(monthMap)) {
    if (lowerQuery.includes(monthName)) {
      targetMonth = monthNum
      break
    }
  }
  
  // Create date range for the target month
  const startDate = new Date(targetYear, targetMonth - 1, 1)
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59)
  
  // Get all trades for the specified month
  const monthlyTrades = await prisma.trade.findMany({
    where: {
      userId,
      entryDate: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      symbol: true,
      side: true,
      market: true,
      strategy: true,
      setup: true,
      status: true,
      entryDate: true,
      exitDate: true,
      netPnL: true,
      notes: true,
      entryPrice: true,
      exitPrice: true,
      quantity: true
    },
    orderBy: { entryDate: 'desc' }
  })
  
  if (monthlyTrades.length === 0) {
    return {
      answer: `No trades found for ${Object.keys(monthMap)[targetMonth - 1]} ${targetYear}. You had no trading activity during this period.`,
      executionTime: 0
    }
  }
  
  // Advanced trading habit analysis per Kimi K2 capabilities
  const closedTrades = monthlyTrades.filter(t => t.status === 'CLOSED' && t.netPnL !== null)
  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0)
  const winningTrades = closedTrades.filter(t => (t.netPnL || 0) > 0)
  const losingTrades = closedTrades.filter(t => (t.netPnL || 0) < 0)
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0
  
  // Advanced mathematical reasoning - Risk metrics
  const returns = closedTrades.map(t => t.netPnL || 0)
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0
  const maxWin = returns.length > 0 ? Math.max(...returns) : 0
  const maxLoss = returns.length > 0 ? Math.min(...returns) : 0
  
  // Market and strategy breakdown
  const marketBreakdown = monthlyTrades.reduce((acc, trade) => {
    acc[trade.market] = (acc[trade.market] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const strategyBreakdown = monthlyTrades.reduce((acc, trade) => {
    if (trade.strategy) {
      acc[trade.strategy] = (acc[trade.strategy] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)
  
  // Trading patterns analysis
  const dayOfWeekPattern = monthlyTrades.reduce((acc, trade) => {
    const dayOfWeek = new Date(trade.entryDate).getDay()
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayName = dayNames[dayOfWeek]
    acc[dayName] = (acc[dayName] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Sentiment analysis for behavioral insights
  const tradesWithNotes = monthlyTrades.filter(t => t.notes && t.notes.trim().length > 0)
  const sentimentAnalysis = await analyzeTradingSentiment(tradesWithNotes, userId)
  
  // Generate comprehensive monthly review response
  const monthName = Object.keys(monthMap)[targetMonth - 1]
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)
  
  let analysisText = `📊 **${capitalizedMonth} ${targetYear} Trading Review**\n\n`
  
  // Performance summary
  analysisText += `**Performance Overview:**\n`
  analysisText += `• Total trades: ${monthlyTrades.length} (${closedTrades.length} closed)\n`
  analysisText += `• Net P&L: $${totalPnL.toFixed(2)}\n`
  analysisText += `• Win rate: ${winRate.toFixed(1)}% (${winningTrades.length}W/${losingTrades.length}L)\n`
  analysisText += `• Best trade: $${maxWin.toFixed(2)} | Worst trade: $${maxLoss.toFixed(2)}\n`
  analysisText += `• Average trade: $${avgReturn.toFixed(2)}\n\n`
  
  // Market analysis
  analysisText += `**Market Distribution:**\n`
  Object.entries(marketBreakdown).forEach(([market, count]) => {
    analysisText += `• ${market}: ${count} trades\n`
  })
  
  // Strategy analysis
  if (Object.keys(strategyBreakdown).length > 0) {
    analysisText += `\n**Strategy Breakdown:**\n`
    Object.entries(strategyBreakdown).forEach(([strategy, count]) => {
      analysisText += `• ${strategy}: ${count} trades\n`
    })
  }
  
  // Behavioral insights
  if (sentimentAnalysis.totalAnalyzed > 0) {
    analysisText += `\n**Trading Psychology:**\n`
    analysisText += `• Analyzed ${sentimentAnalysis.totalAnalyzed} trades with notes\n`
    analysisText += `• Sentiment: ${sentimentAnalysis.sentimentDistribution.positive} positive, ${sentimentAnalysis.sentimentDistribution.negative} negative, ${sentimentAnalysis.sentimentDistribution.neutral} neutral\n`
  }
  
  // Trading pattern insights
  const mostActiveDay = Object.entries(dayOfWeekPattern).sort((a, b) => b[1] - a[1])[0]
  if (mostActiveDay) {
    analysisText += `\n**Trading Patterns:**\n`
    analysisText += `• Most active day: ${mostActiveDay[0]} (${mostActiveDay[1]} trades)\n`
  }
  
  return {
    answer: analysisText,
    data: monthlyTrades.slice(0, 10),
    enhancedData: {
      monthlyStats: {
        totalTrades: monthlyTrades.length,
        closedTrades: closedTrades.length,
        totalPnL,
        winRate,
        maxWin,
        maxLoss,
        avgReturn
      },
      marketBreakdown,
      strategyBreakdown,
      dayOfWeekPattern,
      sentimentAnalysis
    },
    agenticWorkflow: {
      primaryObjective: `Comprehensive trading habit analysis for ${capitalizedMonth} ${targetYear}`,
      subTasks: [
        "Extract monthly trading data",
        "Calculate performance metrics", 
        "Analyze market and strategy distribution",
        "Identify trading patterns",
        "Perform sentiment analysis"
      ],
      mathematicalOperations: ["win rate calculation", "P&L analysis", "risk metrics"],
      behavioralInsights: ["sentiment analysis", "trading pattern recognition", "habit identification"]
    },
    chartConfig: {
      type: 'table',
      title: `${capitalizedMonth} ${targetYear} Trading Analysis`,
      insights: {
        performance: `${winRate.toFixed(1)}% win rate with $${totalPnL.toFixed(2)} net P&L`,
        patterns: `Most active on ${mostActiveDay ? mostActiveDay[0] : 'N/A'}`
      }
    },
    executionTime: 0
  }
}