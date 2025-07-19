const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debugTradesForDate() {
  try {
    // Use the same date as shown in the screenshot
    const date = '2025-07-18' // From your screenshot
    const targetDate = new Date(date)
    
    console.log('=== Debug Trades Count Issue ===')
    console.log('Target date:', targetDate.toISOString())
    
    // Create date ranges
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)
    
    console.log('Start of day:', startOfDay.toISOString())
    console.log('End of day:', endOfDay.toISOString())
    
    // Get all trades for the day using same query as AI summary API
    const tradesAIQuery = await prisma.trade.findMany({
      where: {
        entryDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: {
        id: true,
        symbol: true,
        side: true,
        entryDate: true,
        exitDate: true,
        entryPrice: true,
        exitPrice: true,
        quantity: true,
        netPnL: true,
        userId: true
      }
    })
    
    console.log('\n=== AI Summary API Query Results ===')
    console.log('Trades found:', tradesAIQuery.length)
    tradesAIQuery.forEach((trade, index) => {
      console.log(`${index + 1}. ${trade.symbol} ${trade.side} - Entry: ${trade.entryDate.toISOString()} - P&L: $${trade.netPnL}`)
    })
    
    // Get all trades for the day using same query as calendar API
    const dayStart = new Date(`${date}T00:00:00.000Z`)
    const dayEnd = new Date(`${date}T23:59:59.999Z`)
    
    const tradesCalendarQuery = await prisma.trade.findMany({
      where: {
        entryDate: {
          gte: dayStart,
          lte: dayEnd
        }
      },
      select: {
        id: true,
        symbol: true,
        side: true,
        entryDate: true,
        exitDate: true,
        entryPrice: true,
        exitPrice: true,
        quantity: true,
        netPnL: true,
        userId: true
      }
    })
    
    console.log('\n=== Calendar API Query Results ===')
    console.log('Trades found:', tradesCalendarQuery.length)
    tradesCalendarQuery.forEach((trade, index) => {
      console.log(`${index + 1}. ${trade.symbol} ${trade.side} - Entry: ${trade.entryDate.toISOString()} - P&L: $${trade.netPnL}`)
    })
    
    // Check all trades in database for today
    const allTodayTrades = await prisma.trade.findMany({
      where: {
        entryDate: {
          gte: new Date('2025-07-18'),
          lt: new Date('2025-07-19')
        }
      },
      select: {
        id: true,
        symbol: true,
        side: true,
        entryDate: true,
        netPnL: true,
        userId: true
      }
    })
    
    console.log('\n=== All July 18 Trades ===')
    console.log('Total trades found:', allTodayTrades.length)
    allTodayTrades.forEach((trade, index) => {
      console.log(`${index + 1}. ${trade.symbol} ${trade.side} - ${trade.entryDate.toISOString()} - P&L: $${trade.netPnL} - User: ${trade.userId}`)
    })
    
  } catch (error) {
    console.error('Debug failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugTradesForDate()