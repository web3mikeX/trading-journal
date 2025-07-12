const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testNotifications() {
  console.log('🧪 Testing Notification System with Duplicate Detection...\n')
  
  const testUserId = 'test-notifications'
  
  const csvTrades = [
    {
      symbol: 'AAPL',
      side: 'LONG',
      entryDate: '2024-01-15T09:30:00.000Z',
      entryPrice: 150.25,
      quantity: 100,
      market: 'STOCK',
      dataSource: 'csv'
    },
    {
      symbol: 'TSLA',
      side: 'LONG',
      entryDate: '2024-01-15T10:00:00.000Z',
      entryPrice: 250.50,
      quantity: 50,
      market: 'STOCK',
      dataSource: 'csv'
    },
    {
      // Exact duplicate of AAPL
      symbol: 'AAPL',
      side: 'LONG',
      entryDate: '2024-01-15T09:30:00.000Z',
      entryPrice: 150.25,
      quantity: 100,
      market: 'STOCK',
      dataSource: 'csv'
    }
  ]
  
  try {
    // Clean up and create test user
    await prisma.trade.deleteMany({ where: { userId: testUserId } })
    await prisma.user.deleteMany({ where: { id: testUserId } })
    
    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'test-notifications@example.com',
        name: 'Test Notifications User'
      }
    })
    console.log('👤 Test user created')
    
    console.log(`\n📊 Testing import workflow with notifications...`)
    console.log('Expected notifications:')
    console.log('   1. ⚠️  Warning: "Duplicate Trades Detected" (for AAPL duplicate)')
    console.log('   2. ℹ️  Info: "Duplicate Review Required" (transition to duplicates step)')
    console.log('   3. ✅ Success: "Duplicate Handling Complete!" (after resolution)')
    
    let successfulImports = 0
    let duplicatesDetected = 0
    
    // Test the import process
    for (let i = 0; i < csvTrades.length; i++) {
      const trade = csvTrades[i]
      console.log(`\n${i + 1}️⃣ Testing: ${trade.symbol} ${trade.side} ${trade.quantity}@$${trade.entryPrice}`)
      
      const tradeData = {
        userId: testUserId,
        ...trade,
        status: 'OPEN'
      }
      
      const response = await fetch('http://localhost:3000/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeData)
      })
      
      if (response.status === 409) {
        // Duplicate detected - this should trigger notification
        const duplicateInfo = await response.json()
        console.log(`   ⚠️ DUPLICATE: ${duplicateInfo.duplicateInfo.level} match`)
        console.log(`   📱 Should show: "Duplicate Trades Detected" notification`)
        duplicatesDetected++
      } else if (response.ok) {
        const result = await response.json()
        console.log(`   ✅ SUCCESS: Created trade ${result.id}`)
        console.log(`   📱 Should show: Progress/success notification`)
        successfulImports++
      } else {
        console.log(`   ❌ ERROR: ${response.status}`)
        console.log(`   📱 Should show: Error notification`)
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    console.log('\n📋 NOTIFICATION TEST RESULTS:')
    console.log(`   ✅ Successful imports: ${successfulImports}`)
    console.log(`   ⚠️  Duplicates detected: ${duplicatesDetected}`)
    console.log(`   📱 Expected notifications: ${2 + (duplicatesDetected > 0 ? 1 : 0)}`)
    
    console.log('\n🎯 NOTIFICATION TYPES TO VERIFY IN UI:')
    console.log('   🟡 Warning Toast: "Duplicate Trades Detected"')
    console.log('   🔵 Info Toast: "Duplicate Review Required"') 
    console.log('   🟢 Success Toast: "Import Complete!" or "Duplicate Handling Complete!"')
    console.log('   🔴 Error Toast: "Import Failed" (if any errors occur)')
    
    console.log('\n📍 TO TEST IN BROWSER:')
    console.log('   1. Go to http://localhost:3000/trades')
    console.log('   2. Sign in with: degenbitkid@gmail.com / demo123')
    console.log('   3. Click Import button')
    console.log('   4. Upload a CSV with duplicate trades')
    console.log('   5. Watch for toast notifications appearing in top-right corner')
    
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

// Wait for server to be ready
async function waitForServer() {
  let attempts = 0
  while (attempts < 10) {
    try {
      const response = await fetch('http://localhost:3000')
      if (response.ok) {
        console.log('🟢 Server is ready!\n')
        break
      }
    } catch (error) {
      console.log(`⏳ Waiting for server... (attempt ${attempts + 1}/10)`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    attempts++
  }
  
  if (attempts === 10) {
    console.log('🔴 Server not responding. Please start with: npm run dev')
    return false
  }
  return true
}

async function main() {
  const serverReady = await waitForServer()
  if (serverReady) {
    await testNotifications()
  }
}

main()