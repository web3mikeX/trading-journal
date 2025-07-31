const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const userId = 'cmcwu8b5m0001m17ilm0triy8'

async function verifyTopStepMetrics() {
  try {
    console.log('🎯 VERIFYING TOPSTEP METRICS')
    console.log('============================\n')

    // Fetch account metrics from API (same as dashboard would)
    const response = await fetch(`http://localhost:3004/api/account-metrics?userId=${userId}`)
    const metrics = await response.json()

    console.log('📊 CURRENT METRICS:')
    console.log('===================')
    console.log(`Account High: $${metrics.accountHigh?.toFixed(2)}`)
    console.log(`Current Balance: $${metrics.currentBalance?.toFixed(2)}`)
    console.log(`Trailing Drawdown Limit: $${metrics.calculatedTrailingLimit?.toFixed(2)}`)
    console.log(`Daily Loss Limit: $${metrics.calculatedDailyLimit?.toFixed(2)}`)
    console.log(`Trailing Buffer: $${metrics.trailingBuffer?.toFixed(2)}`)
    console.log(`Daily Buffer: $${metrics.dailyBuffer?.toFixed(2)}`)

    console.log('\n🎯 TOPSTEP REQUIREMENTS:')
    console.log('========================')
    
    // Expected values
    const expectedAccountHigh = 51284.14
    const expectedTrailingLimit = 49284.14  // high - $2,000
    const expectedDailyLimit = 50177.92     // balance - $1,000
    
    console.log(`✅ Account High should be: $${expectedAccountHigh.toFixed(2)}`)
    console.log(`✅ Trail Stop should be: $${expectedTrailingLimit.toFixed(2)}`)
    console.log(`✅ Daily Loss Limit should be: $${expectedDailyLimit.toFixed(2)}`)
    
    console.log('\n🔍 VERIFICATION:')
    console.log('================')
    
    const accountHighMatch = Math.abs(metrics.accountHigh - expectedAccountHigh) < 0.01
    const trailingLimitMatch = Math.abs(metrics.calculatedTrailingLimit - expectedTrailingLimit) < 0.01
    const dailyLimitMatch = Math.abs(metrics.calculatedDailyLimit - expectedDailyLimit) < 0.01
    
    console.log(`Account High: ${accountHighMatch ? '✅' : '❌'} ${accountHighMatch ? 'CORRECT' : 'INCORRECT'}`)
    console.log(`Trailing Limit: ${trailingLimitMatch ? '✅' : '❌'} ${trailingLimitMatch ? 'CORRECT' : 'INCORRECT'}`)
    console.log(`Daily Limit: ${dailyLimitMatch ? '✅' : '❌'} ${dailyLimitMatch ? 'CORRECT' : 'INCORRECT'}`)
    
    const allCorrect = accountHighMatch && trailingLimitMatch && dailyLimitMatch
    
    console.log('\n🏆 FINAL RESULT:')
    console.log('================')
    if (allCorrect) {
      console.log('✅ ALL METRICS MATCH TOPSTEP REQUIREMENTS!')
      console.log('🎉 Your Account Report now displays the correct values!')
      console.log('')
      console.log('Dashboard Summary:')
      console.log(`• Account High: $${metrics.accountHigh.toFixed(2)} (highest balance reached)`)
      console.log(`• Trail Stop: $${metrics.calculatedTrailingLimit.toFixed(2)} (trailing $2,000 from high)`)
      console.log(`• Daily Loss Limit: $${metrics.calculatedDailyLimit.toFixed(2)} (current balance - $1,000)`)
      console.log(`• Current Balance: $${metrics.currentBalance.toFixed(2)}`)
      console.log(`• Safety Buffers: $${metrics.trailingBuffer.toFixed(2)} trailing, $${metrics.dailyBuffer.toFixed(2)} daily`)
    } else {
      console.log('❌ Some metrics still need adjustment.')
      console.log('Please check the calculation logic.')
    }

  } catch (error) {
    console.error('❌ Error verifying metrics:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

verifyTopStepMetrics()