const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const userId = 'cmcwu8b5m0001m17ilm0triy8'

async function updateAccountHigh() {
  try {
    console.log('🎯 UPDATING ACCOUNT HIGH TO MATCH TOPSTEP')
    console.log('=========================================\n')

    // Update account high to the correct value from TopStep
    const accountHigh = 51284.14
    const currentBalance = 51177.92
    const trailingDrawdown = 2000.00
    const dailyLossAmount = 1000.00

    console.log(`Setting Account High: $${accountHigh.toFixed(2)}`)
    console.log(`Current Balance: $${currentBalance.toFixed(2)}`)
    console.log(`Trailing Drawdown Amount: $${trailingDrawdown.toFixed(2)}`)
    console.log(`Daily Loss Amount: $${dailyLossAmount.toFixed(2)}`)

    // Calculate the correct limits
    const trailingLimit = accountHigh - trailingDrawdown  // $49,284.14
    const dailyLossLimit = currentBalance - dailyLossAmount  // $50,177.92

    console.log(`\n📊 CALCULATED LIMITS:`)
    console.log(`Trail Stop: $${trailingLimit.toFixed(2)} (high - $${trailingDrawdown})`)
    console.log(`Daily Loss Limit: $${dailyLossLimit.toFixed(2)} (balance - $${dailyLossAmount})`)

    // Update user account with correct account high
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentAccountHigh: accountHigh,
        accountBalance: currentBalance,
        trailingDrawdownAmount: trailingDrawdown,
        dailyLossLimit: dailyLossAmount,
        lastEodCalculation: new Date()
      }
    })

    console.log('\n✅ ACCOUNT UPDATED SUCCESSFULLY')
    console.log('===============================')

    // Verify the update
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentAccountHigh: true,
        accountBalance: true,
        trailingDrawdownAmount: true,
        dailyLossLimit: true,
        lastEodCalculation: true
      }
    })

    if (updatedUser) {
      console.log('\n📋 VERIFICATION:')
      console.log('================')
      console.log(`Account High: $${updatedUser.currentAccountHigh?.toFixed(2) || '0.00'}`)
      console.log(`Account Balance: $${updatedUser.accountBalance?.toFixed(2) || '0.00'}`)
      console.log(`Trailing Drawdown: $${updatedUser.trailingDrawdownAmount?.toFixed(2) || '0.00'}`)
      console.log(`Daily Loss Limit Setting: $${updatedUser.dailyLossLimit?.toFixed(2) || '0.00'}`)
      console.log(`Last Update: ${updatedUser.lastEodCalculation?.toISOString() || 'Never'}`)

      // Calculate final display values
      const finalTrailingLimit = updatedUser.currentAccountHigh - updatedUser.trailingDrawdownAmount
      const finalDailyLimit = updatedUser.accountBalance - updatedUser.dailyLossLimit
      
      console.log('\n🎯 TOPSTEP METRICS:')
      console.log('==================')
      console.log(`Account High: $${updatedUser.currentAccountHigh?.toFixed(2)} ✅`)
      console.log(`Trail Stop: $${finalTrailingLimit?.toFixed(2)} ✅`)
      console.log(`Daily Loss Limit: $${finalDailyLimit?.toFixed(2)} ✅`)
      console.log(`Current Balance: $${updatedUser.accountBalance?.toFixed(2)} ✅`)
      
      // Calculate buffers
      const trailingBuffer = updatedUser.accountBalance - finalTrailingLimit
      const dailyBuffer = updatedUser.accountBalance - finalDailyLimit
      
      console.log('\n💰 SAFETY BUFFERS:')
      console.log('==================')
      console.log(`Trailing Buffer: $${trailingBuffer?.toFixed(2)}`)
      console.log(`Daily Buffer: $${dailyBuffer?.toFixed(2)}`)
      
      console.log('\n✅ Account now matches TopStep configuration!')
    }

  } catch (error) {
    console.error('❌ Error updating account high:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateAccountHigh()