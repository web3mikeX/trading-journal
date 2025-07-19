const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testSimpleAPI() {
  console.log('🧪 Testing Simple API...\n')
  
  const testUserId = 'test-simple-api'
  
  try {
    // Clean up and create test user
    await prisma.trade.deleteMany({ where: { userId: testUserId } })
    await prisma.user.deleteMany({ where: { id: testUserId } })
    
    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'test-simple@example.com',
        name: 'Test Simple User'
      }
    })
    console.log('👤 Test user created')
    
    // Test 1: Simple trade creation without forceCreate
    console.log('\n1️⃣ Creating simple trade...')
    const tradeData = {
      userId: testUserId,
      symbol: 'MNQZ24',
      side: 'LONG',
      entryDate: '2024-01-15T09:30:00.000Z',
      entryPrice: 18500.25,
      quantity: 2,
      market: 'FUTURES',
      dataSource: 'csv'
    }
    
    const response1 = await fetch('http://localhost:3000/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tradeData)
    })
    
    console.log('Response status:', response1.status)
    
    if (response1.ok) {
      const result1 = await response1.json()
      console.log('✅ Trade created successfully!')
      console.log('   ID:', result1.id)
      console.log('   Hash:', result1.tradeHash?.substring(0, 16) + '...')
    } else {
      const errorText = await response1.text()
      console.log('❌ Trade creation failed')
      console.log('   Error:', errorText.substring(0, 200) + '...')
    }
    
    // Test 2: Try to create exact duplicate
    if (response1.ok) {
      console.log('\n2️⃣ Attempting duplicate...')
      const response2 = await fetch('http://localhost:3000/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeData) // Same data
      })
      
      console.log('Duplicate response status:', response2.status)
      
      if (response2.status === 409) {
        const duplicateData = await response2.json()
        console.log('✅ Duplicate correctly detected!')
        console.log('   Level:', duplicateData.duplicateInfo?.level)
        console.log('   Message:', duplicateData.message)
      } else {
        const responseText = await response2.text()
        console.log('❌ Expected 409 but got:', response2.status)
        console.log('   Response:', responseText.substring(0, 200) + '...')
      }
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

testSimpleAPI()