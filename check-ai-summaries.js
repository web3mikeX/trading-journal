const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAiSummaries() {
  try {
    console.log('🤖 Checking AI summaries for all trades...\n')
    
    // Get all trades with their AI summary status
    const allTrades = await prisma.trade.findMany({
      select: {
        id: true,
        symbol: true,
        entryDate: true,
        dataSource: true,
        aiSummary: true,
        status: true,
        grossPnL: true,
        side: true,
        strategy: true,
        setup: true,
        notes: true
      },
      orderBy: { entryDate: 'desc' }
    })
    
    console.log(`📊 Total trades found: ${allTrades.length}\n`)
    
    // Analyze AI summary coverage
    const withAiSummary = allTrades.filter(trade => trade.aiSummary && trade.aiSummary.trim() !== '')
    const withoutAiSummary = allTrades.filter(trade => !trade.aiSummary || trade.aiSummary.trim() === '')
    
    console.log('🔍 AI Summary Coverage:')
    console.log(`  ✅ Trades with AI summaries: ${withAiSummary.length}`)
    console.log(`  ❌ Trades without AI summaries: ${withoutAiSummary.length}`)
    console.log(`  📈 Coverage percentage: ${((withAiSummary.length / allTrades.length) * 100).toFixed(1)}%\n`)
    
    // Group by data source
    const byDataSource = {}
    allTrades.forEach(trade => {
      if (!byDataSource[trade.dataSource]) {
        byDataSource[trade.dataSource] = { total: 0, withAi: 0, withoutAi: 0 }
      }
      byDataSource[trade.dataSource].total++
      if (trade.aiSummary && trade.aiSummary.trim() !== '') {
        byDataSource[trade.dataSource].withAi++
      } else {
        byDataSource[trade.dataSource].withoutAi++
      }
    })
    
    console.log('📂 Coverage by Data Source:')
    Object.entries(byDataSource).forEach(([source, stats]) => {
      const percentage = ((stats.withAi / stats.total) * 100).toFixed(1)
      console.log(`  ${source}: ${stats.withAi}/${stats.total} (${percentage}%) have AI summaries`)
    })
    console.log('')
    
    // Show sample of trades without AI summaries
    console.log('🔍 Sample of trades without AI summaries:')
    const sampleWithoutAi = withoutAiSummary.slice(0, 5)
    sampleWithoutAi.forEach((trade, index) => {
      console.log(`  ${index + 1}. ${trade.symbol} (${trade.side}) - ${trade.entryDate.toISOString().split('T')[0]}`)
      console.log(`     Status: ${trade.status} | P&L: $${trade.grossPnL || 'N/A'} | Source: ${trade.dataSource}`)
      if (trade.strategy) console.log(`     Strategy: ${trade.strategy}`)
      if (trade.setup) console.log(`     Setup: ${trade.setup}`)
      if (trade.notes) console.log(`     Notes: ${trade.notes.substring(0, 50)}...`)
      console.log('')
    })
    
    // Show sample of trades with AI summaries
    if (withAiSummary.length > 0) {
      console.log('✅ Sample of trades with AI summaries:')
      const sampleWithAi = withAiSummary.slice(0, 5)
      sampleWithAi.forEach((trade, index) => {
        console.log(`  ${index + 1}. ${trade.symbol} (${trade.side}) - ${trade.entryDate.toISOString().split('T')[0]}`)
        console.log(`     AI Summary: "${trade.aiSummary}"`)
        console.log(`     Status: ${trade.status} | P&L: $${trade.grossPnL || 'N/A'} | Source: ${trade.dataSource}`)
        console.log('')
      })
    }
    
    // Show recent trades (last 10)
    console.log('📅 Recent trades (last 10):')
    const recentTrades = allTrades.slice(0, 10)
    recentTrades.forEach((trade, index) => {
      const aiStatus = trade.aiSummary && trade.aiSummary.trim() !== '' ? '✅' : '❌'
      console.log(`  ${index + 1}. ${aiStatus} ${trade.symbol} - ${trade.entryDate.toISOString().split('T')[0]} - ${trade.dataSource}`)
      if (trade.aiSummary) {
        console.log(`     "${trade.aiSummary}"`)
      }
    })
    
    console.log('\n📋 Summary:')
    console.log(`• Total trades: ${allTrades.length}`)
    console.log(`• With AI summaries: ${withAiSummary.length}`)
    console.log(`• Without AI summaries: ${withoutAiSummary.length}`)
    console.log(`• Coverage: ${((withAiSummary.length / allTrades.length) * 100).toFixed(1)}%`)
    
    if (withoutAiSummary.length > 0) {
      console.log(`\n🔧 Action needed: Generate AI summaries for ${withoutAiSummary.length} trades`)
    }
    
  } catch (error) {
    console.error('Error checking AI summaries:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAiSummaries()