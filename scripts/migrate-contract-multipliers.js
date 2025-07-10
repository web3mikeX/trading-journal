const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Contract specifications lookup
const CONTRACT_SPECIFICATIONS = {
  "MNQU5": {
    symbol: "MNQU5",
    contractType: "MICRO_FUTURES",
    multiplier: 2.0, // $2 per point
  },
  "MNQ": {
    symbol: "MNQ", 
    contractType: "MICRO_FUTURES",
    multiplier: 2.0, // $2 per point
  }
}

function getContractMultiplier(symbol, market = "STOCK") {
  if (market === "FUTURES" || market === "MICRO_FUTURES") {
    const spec = CONTRACT_SPECIFICATIONS[symbol]
    if (spec) {
      return spec.multiplier
    }
    // Try base symbol
    const baseSymbol = symbol.replace(/[FGHJKMNQUVXZ]\d+$/, '')
    if (CONTRACT_SPECIFICATIONS[baseSymbol]) {
      return CONTRACT_SPECIFICATIONS[baseSymbol].multiplier
    }
  }
  return 1.0
}

function getContractType(symbol, market = "STOCK") {
  if (market === "FUTURES" || market === "MICRO_FUTURES") {
    const spec = CONTRACT_SPECIFICATIONS[symbol]
    if (spec) {
      return spec.contractType
    }
    // Try base symbol  
    const baseSymbol = symbol.replace(/[FGHJKMNQUVXZ]\d+$/, '')
    if (CONTRACT_SPECIFICATIONS[baseSymbol]) {
      return CONTRACT_SPECIFICATIONS[baseSymbol].contractType
    }
    return "STANDARD_FUTURES"
  }
  return "STANDARD"
}

async function migrateTrades() {
  try {
    console.log('Starting contract multiplier migration...')
    
    // Get all trades that contain MNQU5 or need migration
    const trades = await prisma.trade.findMany({
      where: {
        symbol: { contains: 'MNQ' }
      }
    })
    
    console.log(`Found ${trades.length} trades to migrate`)
    
    let updated = 0
    
    for (const trade of trades) {
      const correctMultiplier = getContractMultiplier(trade.symbol, trade.market)
      const correctType = getContractType(trade.symbol, trade.market)
      
      // Calculate correct PnL if trade is closed
      let correctGrossPnL = trade.grossPnL
      let correctNetPnL = trade.netPnL
      let correctReturnPercent = trade.returnPercent
      
      if (trade.exitPrice && trade.entryPrice && trade.status === 'CLOSED') {
        const pointsDifference = trade.side === 'LONG' 
          ? (trade.exitPrice - trade.entryPrice)
          : (trade.entryPrice - trade.exitPrice)
          
        correctGrossPnL = pointsDifference * trade.quantity * correctMultiplier
        
        const totalFees = (trade.entryFees || 0) + (trade.exitFees || 0) + (trade.commission || 0) + (trade.swap || 0)
        correctNetPnL = correctGrossPnL - totalFees
        
        const totalInvested = trade.entryPrice * trade.quantity * correctMultiplier
        correctReturnPercent = totalInvested > 0 ? (correctNetPnL / totalInvested) * 100 : 0
      }
      
      const needsUpdate = (
        trade.contractMultiplier !== correctMultiplier ||
        trade.contractType !== correctType ||
        Math.abs((trade.netPnL || 0) - (correctNetPnL || 0)) > 0.01
      )
      
      if (needsUpdate) {
        console.log(`Updating trade ${trade.id} (${trade.symbol}):`)
        console.log(`  Multiplier: ${trade.contractMultiplier} -> ${correctMultiplier}`)
        console.log(`  Type: ${trade.contractType} -> ${correctType}`)
        console.log(`  NetPnL: ${trade.netPnL} -> ${correctNetPnL}`)
        
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
        
        updated++
      }
    }
    
    console.log(`Migration completed. Updated ${updated} trades.`)
    
  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateTrades()