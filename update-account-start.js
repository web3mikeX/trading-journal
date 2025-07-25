const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateAccountStartDate() {
  try {
    // Update account start date to match earliest trade (March 12, 2025)
    const result = await prisma.user.update({
      where: { id: 'cmcwu8b5m0001m17ilm0triy8' },
      data: {
        accountStartDate: new Date('2025-03-12T00:00:00.000Z')
      }
    })
    
    console.log('✅ Updated account start date to March 12, 2025')
    
    // Test the new calculation
    const accountMetricsResponse = await fetch('http://localhost:3001/api/account-metrics?userId=cmcwu8b5m0001m17ilm0triy8')
    if (accountMetricsResponse.ok) {
      const metrics = await accountMetricsResponse.json()
      console.log('📊 New Account Metrics:')
      console.log('  Current Balance:', metrics.currentBalance)
      console.log('  Net P&L to Date:', metrics.netPnLToDate)
      console.log('  Account High:', metrics.accountHigh)
    }
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('Error:', error)
    await prisma.$disconnect()
  }
}

updateAccountStartDate()