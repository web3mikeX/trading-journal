const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testForceCreate() {
  console.log('🧪 Testing Force Create...\n')
  
  const testUserId = 'test-force'
  
  try {
    // Clean up and create test user
    await prisma.trade.deleteMany({ where: { userId: testUserId } })
    await prisma.user.deleteMany({ where: { id: testUserId } })
    
    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'test-force@example.com',
        name: 'Test Force User'
      }
    })
    console.log('👤 Test user created')
    
    const tradeData = {
      userId: testUserId,
      symbol: 'TESTX24',
      side: 'LONG',
      entryDate: '2024-01-15T09:30:00.000Z',
      entryPrice: 100.00,
      quantity: 1,
      market: 'FUTURES',
      dataSource: 'csv'
    }
    
    // Create first trade
    console.log('\n1️⃣ Creating first trade...')
    const response1 = await fetch('http://localhost:3000/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tradeData)
    })
    
    if (response1.ok) {
      console.log('✅ First trade created')
    } else {
      console.log('❌ First trade failed:', await response1.text())
      return
    }
    
    // Try duplicate (should fail)
    console.log('\n2️⃣ Trying duplicate (should fail)...')
    const response2 = await fetch('http://localhost:3000/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tradeData)
    })
    
    console.log('Duplicate response status:', response2.status)
    
    // Force create (should succeed)
    console.log('\n3️⃣ Force creating duplicate...')
    const response3 = await fetch('http://localhost:3000/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...tradeData,
        forceCreate: true
      })
    })
    
    console.log('Force create status:', response3.status)
    
    if (response3.ok) {
      console.log('✅ Force create successful!')
    } else {
      const errorText = await response3.text()
      console.log('❌ Force create failed:')
      console.log(errorText)
    }
    
    // Clean up
    await prisma.trade.deleteMany({ where: { userId: testUserId } })
    await prisma.user.deleteMany({ where: { id: testUserId } })
    console.log('\n🧹 Test data cleaned up')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testForceCreate()