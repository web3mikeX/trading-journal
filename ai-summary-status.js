const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

async function checkAiSummaryStatus() {
  try {
    console.log('🔍 AI Summary System Status Check\n')
    
    // Check database schema
    console.log('📊 Database Schema Check:')
    const schema = await prisma.$queryRaw`PRAGMA table_info(Trade)`
    const aiSummaryField = schema.find(field => field.name === 'aiSummary')
    console.log(`   aiSummary field: ${aiSummaryField ? '✅ EXISTS' : '❌ MISSING'}`)
    
    // Check trades
    const totalTrades = await prisma.trade.count()
    const tradesWithAi = await prisma.trade.count({
      where: {
        aiSummary: { not: null, not: '' }
      }
    })
    const tradesWithoutAi = totalTrades - tradesWithAi
    
    console.log(`   Total trades: ${totalTrades}`)
    console.log(`   With AI summaries: ${tradesWithAi}`)
    console.log(`   Without AI summaries: ${tradesWithoutAi}`)
    console.log(`   Coverage: ${((tradesWithAi / totalTrades) * 100).toFixed(1)}%`)
    
    // Check environment variables
    console.log('\n🔧 Environment Configuration:')
    const kimiApiKey = process.env.KIMI_API_KEY
    const kimiApiUrl = process.env.KIMI_API_URL
    
    console.log(`   KIMI_API_KEY: ${kimiApiKey ? '✅ CONFIGURED' : '❌ MISSING'}`)
    console.log(`   KIMI_API_URL: ${kimiApiUrl ? '✅ CONFIGURED' : '❌ MISSING'}`)
    
    if (kimiApiKey) {
      console.log(`   API Key prefix: ${kimiApiKey.substring(0, 8)}...`)
    }
    
    // Check recent trades sample
    console.log('\n📋 Recent Trades Sample:')
    const recentTrades = await prisma.trade.findMany({
      take: 5,
      orderBy: { entryDate: 'desc' },
      select: {
        symbol: true,
        side: true,
        entryDate: true,
        grossPnL: true,
        dataSource: true,
        aiSummary: true
      }
    })
    
    recentTrades.forEach((trade, index) => {
      const aiStatus = trade.aiSummary ? '✅' : '❌'
      console.log(`   ${index + 1}. ${aiStatus} ${trade.symbol} ${trade.side} - ${trade.entryDate.toISOString().split('T')[0]} ($${trade.grossPnL}) - ${trade.dataSource}`)
      if (trade.aiSummary) {
        console.log(`      Summary: "${trade.aiSummary}"`)
      }
    })
    
    // Check data sources
    console.log('\n📂 Data Sources Analysis:')
    const dataSourceStats = await prisma.trade.groupBy({
      by: ['dataSource'],
      _count: true,
      _sum: { grossPnL: true }
    })
    
    for (const stat of dataSourceStats) {
      const withAi = await prisma.trade.count({
        where: {
          dataSource: stat.dataSource,
          aiSummary: { not: null, not: '' }
        }
      })
      const coverage = ((withAi / stat._count) * 100).toFixed(1)
      console.log(`   ${stat.dataSource}: ${withAi}/${stat._count} (${coverage}%) - Total P&L: $${stat._sum.grossPnL?.toFixed(2) || '0.00'}`)
    }
    
    // Network connectivity test
    console.log('\n🌐 Network Connectivity Test:')
    try {
      const response = await fetch('https://api.kimi.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${kimiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'k2-latest',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        })
      })
      console.log(`   API Response Status: ${response.status}`)
      console.log(`   Kimi AI API: ${response.ok ? '✅ REACHABLE' : '⚠️ REACHABLE BUT ERROR'}`)
    } catch (error) {
      console.log(`   Kimi AI API: ❌ UNREACHABLE (${error.message})`)
      console.log(`   Suggestion: Check network connectivity or try alternative AI provider`)
    }
    
    // Recommendations
    console.log('\n💡 Recommendations:')
    
    if (tradesWithoutAi > 0) {
      console.log(`   📝 Generate AI summaries for ${tradesWithoutAi} trades:`)
      console.log(`      node generate-ai-summaries.js`)
    }
    
    if (!kimiApiKey) {
      console.log(`   🔑 Configure KIMI_API_KEY in .env.local`)
    }
    
    console.log(`   🧪 Test single trade: node test-ai-summary.js`)
    console.log(`   📊 Check status: node check-ai-summaries.js`)
    console.log(`   📋 Read full analysis: ai-summary-analysis-report.md`)
    
    console.log('\n✅ Status check complete!')
    
  } catch (error) {
    console.error('❌ Error checking AI summary status:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAiSummaryStatus()