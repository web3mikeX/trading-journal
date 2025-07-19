const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function generateAISummaries() {
  try {
    // Get all trades without AI summaries
    const trades = await prisma.trade.findMany({
      where: {
        aiSummary: null
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
        grossPnL: true
      }
    })

    console.log(`Found ${trades.length} trades without AI summaries`)

    let processed = 0
    let failed = 0

    for (const trade of trades) {
      try {
        // Create prompt for AI
        const prompt = `Trade: ${trade.symbol} ${trade.side} ${trade.quantity} contracts at $${trade.entryPrice} → $${trade.exitPrice}, P&L: $${trade.netPnL}, Duration: ${trade.entryDate} to ${trade.exitDate}`

        // Call AI API
        const response = await fetch(process.env.KIMI_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.KIMI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'k2-latest',
            messages: [
              {
                role: 'system',
                content: 'You are a professional trading assistant. Create concise, informative trade summaries in exactly 10 words or less.'
              },
              {
                role: 'user',
                content: prompt
              }
            ]
          })
        })

        if (response.ok) {
          const data = await response.json()
          const summary = data.choices[0]?.message?.content || `${trade.symbol} ${trade.side} trade: ${trade.netPnL >= 0 ? 'profitable' : 'loss'}`

          // Update trade with AI summary
          await prisma.trade.update({
            where: { id: trade.id },
            data: { aiSummary: summary }
          })

          processed++
          console.log(`✅ ${trade.symbol}: ${summary}`)
        } else {
          // Fallback summary if AI fails
          const fallbackSummary = `${trade.symbol} ${trade.side}: ${trade.netPnL >= 0 ? 'profitable' : 'loss'} $${trade.netPnL}`
          
          await prisma.trade.update({
            where: { id: trade.id },
            data: { aiSummary: fallbackSummary }
          })

          failed++
          console.log(`⚠️  ${trade.symbol}: Used fallback summary`)
        }

        // Rate limiting - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`❌ Failed to process ${trade.symbol}:`, error.message)
        failed++
      }
    }

    console.log(`\n✅ Successfully processed: ${processed}`)
    console.log(`❌ Failed/Fallback: ${failed}`)
    console.log(`📊 Total: ${processed + failed}`)

  } catch (error) {
    console.error('Generation failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateAISummaries()