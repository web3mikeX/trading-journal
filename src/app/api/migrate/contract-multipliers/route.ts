import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getContractMultiplier, getContractType } from '@/lib/contractSpecs'

// POST /api/migrate/contract-multipliers - Migrate existing trades to include contract multipliers
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const dryRun = searchParams.get('dryRun') === 'true'

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get all trades that need migration (missing contractMultiplier or have default values)
    const tradesToMigrate = await prisma.trade.findMany({
      where: {
        userId,
        OR: [
          { contractMultiplier: 1.0, symbol: { contains: 'MNQ' } }, // MNQU5 should have 2.0
          { contractType: 'STANDARD', symbol: { contains: 'MNQ' } } // MNQU5 should be MICRO_FUTURES
        ]
      },
      select: {
        id: true,
        symbol: true,
        market: true,
        side: true,
        entryPrice: true,
        exitPrice: true,
        quantity: true,
        entryFees: true,
        exitFees: true,
        commission: true,
        swap: true,
        grossPnL: true,
        netPnL: true,
        returnPercent: true,
        contractMultiplier: true,
        contractType: true,
        status: true
      }
    })

    const migrationResults = []
    let updatedCount = 0

    for (const trade of tradesToMigrate) {
      // Get correct contract specifications
      const correctMultiplier = getContractMultiplier(trade.symbol, trade.market)
      const correctType = getContractType(trade.symbol, trade.market)

      // Calculate correct PnL values if trade is closed
      let correctGrossPnL = trade.grossPnL
      let correctNetPnL = trade.netPnL
      let correctReturnPercent = trade.returnPercent

      if (trade.exitPrice && trade.entryPrice && trade.status === 'CLOSED') {
        // Recalculate with correct multiplier
        const pointsDifference = trade.side === 'LONG' 
          ? (trade.exitPrice - trade.entryPrice)
          : (trade.entryPrice - trade.exitPrice)

        correctGrossPnL = pointsDifference * trade.quantity * correctMultiplier
        
        const totalFees = (trade.entryFees || 0) + (trade.exitFees || 0) + (trade.commission || 0) + (trade.swap || 0)
        correctNetPnL = correctGrossPnL - totalFees

        const totalInvested = trade.entryPrice * trade.quantity * correctMultiplier
        correctReturnPercent = totalInvested > 0 ? (correctNetPnL / totalInvested) * 100 : 0
      }

      const migrationData = {
        tradeId: trade.id,
        symbol: trade.symbol,
        oldMultiplier: trade.contractMultiplier,
        newMultiplier: correctMultiplier,
        oldType: trade.contractType,
        newType: correctType,
        oldGrossPnL: trade.grossPnL,
        newGrossPnL: correctGrossPnL,
        oldNetPnL: trade.netPnL,
        newNetPnL: correctNetPnL,
        oldReturnPercent: trade.returnPercent,
        newReturnPercent: correctReturnPercent,
        needsUpdate: (
          trade.contractMultiplier !== correctMultiplier ||
          trade.contractType !== correctType ||
          Math.abs((trade.netPnL || 0) - (correctNetPnL || 0)) > 0.01
        )
      }

      migrationResults.push(migrationData)

      // Update the trade if not a dry run and needs update
      if (!dryRun && migrationData.needsUpdate) {
        await prisma.trade.update({
          where: { id: trade.id },
          data: {
            contractMultiplier: correctMultiplier,
            contractType: correctType,
            grossPnL: correctGrossPnL,
            netPnL: correctNetPnL,
            returnPercent: correctReturnPercent
          }
        })
        updatedCount++
      }
    }

    const summary = {
      totalTradesAnalyzed: tradesToMigrate.length,
      tradesNeedingUpdate: migrationResults.filter(r => r.needsUpdate).length,
      tradesUpdated: dryRun ? 0 : updatedCount,
      dryRun,
      migrationResults: migrationResults.filter(r => r.needsUpdate) // Only show trades that need updates
    }

    return NextResponse.json(summary)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: errorMessage 
    }, { status: 500 })
  }
}

// GET /api/migrate/contract-multipliers - Check what trades need migration
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get summary of trades by symbol
    const tradesBySymbol = await prisma.trade.groupBy({
      by: ['symbol', 'market'],
      where: { userId },
      _count: { id: true },
      _avg: { contractMultiplier: true }
    })

    const analysis = tradesBySymbol.map(group => {
      const expectedMultiplier = getContractMultiplier(group.symbol, group.market)
      const expectedType = getContractType(group.symbol, group.market)
      
      return {
        symbol: group.symbol,
        market: group.market,
        count: group._count.id,
        currentAvgMultiplier: group._avg.contractMultiplier || 1.0,
        expectedMultiplier,
        expectedType,
        needsMigration: Math.abs((group._avg.contractMultiplier || 1.0) - expectedMultiplier) > 0.01
      }
    })

    return NextResponse.json({
      symbols: analysis,
      totalNeedingMigration: analysis.filter(a => a.needsMigration).length
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Analysis failed', 
      details: errorMessage 
    }, { status: 500 })
  }
}