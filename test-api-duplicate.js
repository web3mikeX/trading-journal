const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testApiDuplicateDetection() {
  console.log('🧪 Testing API Duplicate Detection...\n')
  
  const testUserId = 'test-user-api'
  const baseUrl = 'http://localhost:3000'
  
  const testTrade = {
    userId: testUserId,
    symbol: 'MNQZ24',
    side: 'LONG',
    entryDate: '2024-01-15T09:30:00.000Z',
    entryPrice: 18500.25,
    quantity: 2,
    market: 'FUTURES',
    dataSource: 'csv'
  }
  
  try {
    // Clean up and create test user
    await prisma.trade.deleteMany({ where: { userId: testUserId } })
    await prisma.user.deleteMany({ where: { id: testUserId } })
    
    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'test-api@example.com',
        name: 'Test API User'
      }
    })
    console.log('👤 Test user created')
    
    // Test 1: Create first trade (should succeed)
    console.log('\n1️⃣ Creating first trade...')
    const response1 = await fetch(`${baseUrl}/api/trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testTrade)
    })
    
    if (response1.ok) {
      const result1 = await response1.json()
      console.log('✅ First trade created:', result1.id)
      console.log('   Hash:', result1.tradeHash?.substring(0, 16) + '...')
    } else {
      console.log('❌ First trade failed:', response1.status, await response1.text())
      return
    }
    
    // Test 2: Try to create exact duplicate (should be rejected)
    console.log('\n2️⃣ Attempting to create exact duplicate...')
    const response2 = await fetch(`${baseUrl}/api/trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testTrade)
    })
    
    if (response2.status === 409) {
      const duplicateResult = await response2.json()
      console.log('✅ Duplicate correctly detected!')
      console.log('   Level:', duplicateResult.duplicateInfo?.level)
      console.log('   Reason:', duplicateResult.duplicateInfo?.reason)
    } else {
      console.log('❌ Duplicate not detected. Status:', response2.status)
      console.log('   Response:', await response2.text())
    }
    
    // Test 3: Force create duplicate
    console.log('\n3️⃣ Force creating duplicate...')
    const response3 = await fetch(`${baseUrl}/api/trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...testTrade,
        forceCreate: true
      })
    })
    
    if (response3.ok) {
      const result3 = await response3.json()
      console.log('✅ Forced duplicate creation successful:', result3.id)
    } else {
      console.log('❌ Forced creation failed:', response3.status, await response3.text())
    }
    
    // Test 4: Create similar trade (slightly different price/time)
    console.log('\n4️⃣ Creating similar trade...')
    const similarTrade = {
      ...testTrade,
      entryPrice: 18500.30, // Slightly different price
      entryDate: '2024-01-15T09:30:30.000Z' // 30 seconds later
    }
    
    const response4 = await fetch(`${baseUrl}/api/trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(similarTrade)
    })
    
    if (response4.status === 409) {
      const duplicateResult4 = await response4.json()
      console.log('✅ Similar trade detected as duplicate!')
      console.log('   Level:', duplicateResult4.duplicateInfo?.level)
    } else if (response4.ok) {
      console.log('ℹ️ Similar trade allowed (not flagged as duplicate)')
    } else {
      console.log('❌ Similar trade failed:', response4.status, await response4.text())
    }
    
    console.log('\n✅ API duplicate detection tests completed!')
    
    // Show final trade count
    const tradeCount = await prisma.trade.count({ where: { userId: testUserId } })
    console.log(`📊 Total trades created: ${tradeCount}`)
    
    // Clean up
    await prisma.trade.deleteMany({ where: { userId: testUserId } })
    await prisma.user.deleteMany({ where: { id: testUserId } })
    console.log('🧹 Test data cleaned up')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/health')
    if (response.ok) {
      console.log('🟢 Server is running, starting tests...\n')
      return true
    }
  } catch (error) {
    console.log('🔴 Server not running. Please start with: npm run dev')
    console.log('   Waiting for server...\n')
    return false
  }
}

async function waitForServer() {
  while (!(await checkServer())) {
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  testApiDuplicateDetection()
}

waitForServer()