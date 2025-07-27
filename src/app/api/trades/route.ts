import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { 
  getContractMultiplier, 
  getContractType, 
  calculateTradeFees, 
  detectBroker,
  getBrokerFees
} from '@/lib/contractSpecs'
import { roundCurrency, addCurrency, subtractCurrency, multiplyCurrency } from '@/lib/utils'
import { generateTradeHash, detectDuplicateTrade } from '@/lib/duplicateDetection'
import { validateTradeData } from '@/lib/tradeValidation'

const TradeSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  symbol: z.string().min(1, 'Symbol is required'),
  side: z.enum(['LONG', 'SHORT']),
  entryDate: z.string().datetime(),
  entryPrice: z.number().positive('Entry price must be positive'),
  quantity: z.number().positive('Quantity must be positive'),
  strategy: z.string().optional(),
  setup: z.string().optional(),
  market: z.string().default('STOCK'),
  entryFees: z.number().default(0),
  exitDate: z.string().datetime().optional(),
  exitPrice: z.number().positive().optional(),
  exitFees: z.number().default(0),
  stopLoss: z.number().positive().optional(),
  takeProfit: z.number().positive().optional(),
  riskAmount: z.number().optional(),
  commission: z.number().default(0),
  swap: z.number().default(0),
  notes: z.string().optional(),
  aiSummary: z.string().optional(),
  dataSource: z.string().default('manual'),
})

// Calculate P&L for a trade with broker-specific fees and precise decimal handling
function calculatePnL(trade: any, accountType?: string, applyAutoFees: boolean = true) {
  if (!trade.exitPrice || !trade.entryPrice) {
    return { 
      grossPnL: null, 
      netPnL: null, 
      returnPercent: null,
      contractMultiplier: getContractMultiplier(trade.symbol, trade.market),
      contractType: getContractType(trade.symbol, trade.market),
      feeCalculation: null
    }
  }

  // Input validation
  if (trade.entryPrice <= 0 || trade.exitPrice <= 0 || trade.quantity <= 0) {
    throw new Error('Entry price, exit price, and quantity must be positive')
  }

  // Get contract specifications
  const contractMultiplier = getContractMultiplier(trade.symbol, trade.market)
  const contractType = getContractType(trade.symbol, trade.market)

  // Calculate points difference with proper decimal handling
  const pointsDifference = trade.side === 'LONG' 
    ? roundCurrency(trade.exitPrice - trade.entryPrice) // Use currency rounding for consistency
    : roundCurrency(trade.entryPrice - trade.exitPrice)

  // Apply contract multiplier to calculate gross PnL
  const grossPnL = multiplyCurrency(pointsDifference * trade.quantity, contractMultiplier)

  // Calculate fees with proper null handling using currency utilities
  const entryFees = Number(trade.entryFees) || 0
  const exitFees = Number(trade.exitFees) || 0
  const commission = Number(trade.commission) || 0
  const swap = Number(trade.swap) || 0
  
  let totalFees = addCurrency(entryFees, exitFees, commission, swap)
  let feeCalculation = null
  
  // If no fees are set and auto-calculation is enabled, calculate broker-specific fees
  if (totalFees === 0 && applyAutoFees && (trade.market === 'FUTURES' || trade.symbol.match(/^(MNQ|MES|MYM|NQ|ES|YM)/))) {
    const broker = detectBroker(accountType, trade.dataSource)
    feeCalculation = calculateTradeFees(trade.symbol, trade.quantity, broker)
    totalFees = roundCurrency(feeCalculation.totalFees)
  }

  const netPnL = subtractCurrency(grossPnL, totalFees)

  // Calculate return percentage with proper precision
  const totalInvested = multiplyCurrency(trade.entryPrice * trade.quantity, contractMultiplier)
  const returnPercent = totalInvested > 0 ? roundCurrency((netPnL / totalInvested) * 100) : 0

  return { 
    grossPnL, 
    netPnL, 
    returnPercent,
    contractMultiplier,
    contractType,
    feeCalculation,
    appliedFees: totalFees
  }
}

// GET /api/trades - Get all trades for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Fetch trades from database
    const trades = await prisma.trade.findMany({
      where: { userId },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: { entryDate: 'desc' }
    })

    return NextResponse.json(trades)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: errorMessage 
    }, { status: 500 })
  }
}

// POST /api/trades - Create a new trade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract forceCreate before validation
    const { forceCreate = false, ...dataToValidate } = body
    
    const validatedData = TradeSchema.parse(dataToValidate)

    // Check for duplicates unless forceCreate is true
    if (!forceCreate) {
      const duplicateCheck = await detectDuplicateTrade({
        userId: validatedData.userId,
        symbol: validatedData.symbol,
        side: validatedData.side,
        entryDate: validatedData.entryDate,
        entryPrice: validatedData.entryPrice,
        quantity: validatedData.quantity,
        exitDate: validatedData.exitDate,
        exitPrice: validatedData.exitPrice
      })

      // Return duplicate information for EXACT and HIGH confidence duplicates
      if (duplicateCheck.level === 'EXACT' || duplicateCheck.level === 'HIGH') {
        return NextResponse.json({
          isDuplicate: true,
          duplicateInfo: duplicateCheck,
          message: `Duplicate trade detected: ${duplicateCheck.reason}`
        }, { status: 409 }) // 409 Conflict
      }

      // For MEDIUM duplicates, still create but include warning
      if (duplicateCheck.level === 'MEDIUM') {
        // Continue with creation but include warning in response
      }
    }

    // Validate trade financial data for consistency and constraints
    const tradeValidation = validateTradeData({
      entryPrice: validatedData.entryPrice,
      exitPrice: validatedData.exitPrice,
      quantity: validatedData.quantity,
      entryFees: validatedData.entryFees,
      exitFees: validatedData.exitFees,
      commission: validatedData.commission,
      swap: validatedData.swap,
      stopLoss: validatedData.stopLoss,
      takeProfit: validatedData.takeProfit,
      riskAmount: validatedData.riskAmount
    })

    if (!tradeValidation.isValid) {
      return NextResponse.json({
        error: 'Trade validation failed',
        details: tradeValidation.errors,
        warnings: tradeValidation.warnings
      }, { status: 400 })
    }

    // Use sanitized data for calculation
    const sanitizedTradeData = { ...validatedData, ...tradeValidation.sanitizedData }

    // Calculate P&L if exit data is provided
    const pnlData = calculatePnL(sanitizedTradeData)

    // Generate trade hash (add timestamp for forced duplicates to make unique)
    const baseTradeData = {
      userId: validatedData.userId,
      symbol: validatedData.symbol,
      side: validatedData.side,
      entryDate: validatedData.entryDate,
      entryPrice: validatedData.entryPrice,
      quantity: validatedData.quantity,
      exitDate: validatedData.exitDate,
      exitPrice: validatedData.exitPrice
    }
    
    let tradeHash = generateTradeHash(baseTradeData)
    
    // If forcing creation of a duplicate, append timestamp to make hash unique
    if (forceCreate) {
      tradeHash = tradeHash + '_' + Date.now()
    }

    const trade = await prisma.trade.create({
      data: {
        userId: validatedData.userId,
        symbol: validatedData.symbol,
        side: validatedData.side,
        entryDate: new Date(validatedData.entryDate),
        entryPrice: validatedData.entryPrice,
        quantity: validatedData.quantity,
        market: validatedData.market,
        strategy: validatedData.strategy,
        setup: validatedData.setup,
        entryFees: validatedData.entryFees,
        exitDate: validatedData.exitDate ? new Date(validatedData.exitDate) : null,
        exitPrice: validatedData.exitPrice,
        exitFees: validatedData.exitFees,
        stopLoss: validatedData.stopLoss,
        takeProfit: validatedData.takeProfit,
        riskAmount: validatedData.riskAmount,
        commission: validatedData.commission,
        swap: validatedData.swap,
        notes: validatedData.notes,
        aiSummary: validatedData.aiSummary,
        dataSource: validatedData.dataSource,
        grossPnL: pnlData.grossPnL,
        netPnL: pnlData.netPnL,
        returnPercent: pnlData.returnPercent,
        contractMultiplier: pnlData.contractMultiplier,
        contractType: pnlData.contractType,
        status: validatedData.exitDate ? 'CLOSED' : 'OPEN',
        tradeHash,
        isDuplicate: false
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    return NextResponse.json(trade, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: errorMessage 
    }, { status: 500 })
  }
}