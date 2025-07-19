const { PrismaClient } = require('@prisma/client')
require('dotenv').config({ path: '.env.local' })

const prisma = new PrismaClient()

async function testAiSummary() {
  try {
    // Get one trade to test AI summary
    const trade = await prisma.trade.findFirst({
      where: {
        OR: [
          { aiSummary: null },
          { aiSummary: '' }
        ]
      },
      orderBy: { entryDate: 'desc' }
    })

    if (!trade) {
      console.log('No trades found without AI summaries')
      return
    }

    console.log('🧪 Testing AI Summary Generation')
    console.log(`Selected trade: ${trade.symbol} ${trade.side} - ${trade.entryDate.toISOString().split('T')[0]}`)
    console.log(`P&L: $${trade.grossPnL || 'N/A'} | Status: ${trade.status}`)
    console.log('')

    // Test the AI summary API
    const KIMI_API_KEY = process.env.KIMI_API_KEY
    const KIMI_API_URL = process.env.KIMI_API_URL || 'https://api.kimi.ai/v1/chat/completions'

    if (!KIMI_API_KEY) {
      console.error('❌ KIMI_API_KEY not found in environment variables')
      console.log('Available environment variables:')
      Object.keys(process.env).forEach(key => {
        if (key.includes('KIMI')) {
          console.log(`  ${key}: ${process.env[key] ? '[SET]' : '[NOT SET]'}`)
        }
      })
      return
    }

    console.log('✅ KIMI_API_KEY found')
    console.log(`API URL: ${KIMI_API_URL}`)

    // Build the prompt
    const prompt = `Summarize this ${trade.side.toLowerCase()} trade of ${trade.quantity} ${trade.symbol} at $${trade.entryPrice} → $${trade.exitPrice} ($${trade.grossPnL?.toFixed(2) || 'N/A'}). Create a 10-word summary focusing on the key outcome and insight.`

    console.log(`Prompt: ${prompt}`)
    console.log('')

    // Make the API call
    console.log('🔄 Making API call...')
    const response = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIMI_API_KEY}`,
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

    console.log(`Response status: ${response.status}`)
    
    if (!response.ok) {
      console.error(`❌ API request failed: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      return
    }

    const data = await response.json()
    console.log('✅ API call successful')
    console.log('Response data:', JSON.stringify(data, null, 2))

    const summary = data.choices?.[0]?.message?.content?.trim()
    
    if (!summary) {
      console.error('❌ No summary generated')
      return
    }

    console.log(`\n✅ Generated AI Summary: "${summary}"`)
    console.log(`Tokens used: ${data.usage?.total_tokens || 'N/A'}`)

    // Test updating the trade
    console.log('\n🔄 Testing database update...')
    const updatedTrade = await prisma.trade.update({
      where: { id: trade.id },
      data: { aiSummary: summary }
    })

    console.log('✅ Database update successful')
    console.log(`Updated trade ${updatedTrade.id} with AI summary: "${updatedTrade.aiSummary}"`)

  } catch (error) {
    console.error('❌ Error testing AI summary:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAiSummary()