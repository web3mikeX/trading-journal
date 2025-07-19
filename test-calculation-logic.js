// Test helper to verify calculation logic matches API routes

function getContractMultiplier(symbol, market = "STOCK") {
  if (market === "FUTURES" || market === "MICRO_FUTURES") {
    if (symbol === "MNQU5" || symbol === "MNQ") {
      return 2.0
    }
    if (symbol === "MES") {
      return 5.0
    }
    if (symbol === "MYM") {
      return 0.5
    }
  }
  return 1.0
}

function getContractType(symbol, market = "STOCK") {
  if (market === "FUTURES" || market === "MICRO_FUTURES") {
    if (symbol === "MNQU5" || symbol === "MNQ") {
      return "MICRO_FUTURES"
    }
    if (symbol === "MES") {
      return "MICRO_FUTURES"
    }
    if (symbol === "MYM") {
      return "MICRO_FUTURES"
    }
    return "STANDARD_FUTURES"
  }
  return "STANDARD"
}

function calculatePnL(trade) {
  if (!trade.exitPrice || !trade.entryPrice) {
    return { 
      grossPnL: null, 
      netPnL: null, 
      returnPercent: null,
      contractMultiplier: getContractMultiplier(trade.symbol, trade.market),
      contractType: getContractType(trade.symbol, trade.market)
    }
  }

  // Get contract specifications
  const contractMultiplier = getContractMultiplier(trade.symbol, trade.market)
  const contractType = getContractType(trade.symbol, trade.market)

  // Calculate points difference
  const pointsDifference = trade.side === 'LONG' 
    ? (trade.exitPrice - trade.entryPrice)
    : (trade.entryPrice - trade.exitPrice)

  // Apply contract multiplier to calculate gross PnL
  const grossPnL = pointsDifference * trade.quantity * contractMultiplier

  const totalFees = (trade.entryFees || 0) + (trade.exitFees || 0) + (trade.commission || 0) + (trade.swap || 0)
  const netPnL = grossPnL - totalFees

  const totalInvested = trade.entryPrice * trade.quantity * contractMultiplier
  const returnPercent = totalInvested > 0 ? (netPnL / totalInvested) * 100 : 0

  return { 
    grossPnL, 
    netPnL, 
    returnPercent,
    contractMultiplier,
    contractType
  }
}

module.exports = {
  calculatePnL,
  getContractMultiplier,
  getContractType
}