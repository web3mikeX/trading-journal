const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function testCSVImport() {
  console.log('🧪 Testing CSV Import with Duplicate Detection...\n')
  
  const testUserId = 'test-csv-import'
  
  // Simulate parsed trades from CSV (like ImportTradesModal would do)
  const csvTrades = [
    {
      symbol: 'MNQZ24',
      side: 'LONG',
      entryDate: '2024-01-15T09:30:00.000Z',
      entryPrice: 18500.25,
      quantity: 2,
      exitDate: '2024-01-15T09:31:00.000Z',
      exitPrice: 18505.75,
      netPnL: 11.00,
      market: 'FUTURES',
      dataSource: 'csv'
    },
    {
      symbol: 'ESZ24',
      side: 'LONG',
      entryDate: '2024-01-15T10:00:00.000Z',
      entryPrice: 4500.50,
      quantity: 1,
      exitDate: '2024-01-15T10:02:00.000Z',
      exitPrice: 4502.25,
      netPnL: 1.75,
      market: 'FUTURES',
      dataSource: 'csv'
    },
    {
      // Exact duplicate of first trade
      symbol: 'MNQZ24',
      side: 'LONG',
      entryDate: '2024-01-15T09:30:00.000Z',
      entryPrice: 18500.25,
      quantity: 2,
      exitDate: '2024-01-15T09:31:00.000Z',
      exitPrice: 18505.75,
      netPnL: 11.00,
      market: 'FUTURES',
      dataSource: 'csv'
    },
    {
      symbol: 'NQKZ24',
      side: 'LONG',
      entryDate: '2024-01-16T14:15:00.000Z',
      entryPrice: 16200.00,
      quantity: 1,
      exitDate: '2024-01-16T14:20:00.000Z',
      exitPrice: 16195.50,
      netPnL: -4.50,
      market: 'FUTURES',
      dataSource: 'csv'
    },
    {
      // Exact duplicate of second trade
      symbol: 'ESZ24',
      side: 'LONG',
      entryDate: '2024-01-15T10:00:00.000Z',
      entryPrice: 4500.50,
      quantity: 1,
      exitDate: '2024-01-15T10:02:00.000Z',
      exitPrice: 4502.25,
      netPnL: 1.75,
      market: 'FUTURES',
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
        email: 'test-csv@example.com',
        name: 'Test CSV User'
      }
    })
    console.log('👤 Test user created')
    
    console.log(`\n📊 Simulating import of ${csvTrades.length} trades from CSV...`)
    
    let successfulImports = 0
    let duplicatesDetected = 0
    let duplicatesList = []
    
    // Simulate the ImportTradesModal import process
    for (let i = 0; i < csvTrades.length; i++) {
      const trade = csvTrades[i]
      console.log(`\n${i + 1}️⃣ Importing: ${trade.symbol} ${trade.side} ${trade.quantity}@$${trade.entryPrice}`)
      
      const tradeData = {
        userId: testUserId,
        ...trade,
        status: trade.exitDate ? 'CLOSED' : 'OPEN'
      }
      
      const response = await fetch('http://localhost:3000/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeData)
      })
      
      if (response.status === 409) {
        // Duplicate detected
        const duplicateInfo = await response.json()
        console.log(`   ⚠️ DUPLICATE DETECTED: ${duplicateInfo.duplicateInfo.level} match`)
        console.log(`   📝 Reason: ${duplicateInfo.duplicateInfo.reason}`)
        duplicatesDetected++
        duplicatesList.push({
          trade,
          duplicate: duplicateInfo.duplicateInfo
        })
      } else if (response.ok) {
        const result = await response.json()
        console.log(`   ✅ SUCCESS: Created trade ${result.id}`)
        successfulImports++
      } else {
        const errorText = await response.text()
        console.log(`   ❌ ERROR: ${response.status} - ${errorText.substring(0, 100)}...`)
      }
    }
    
    console.log('\n📋 IMPORT SUMMARY:')
    console.log(`   Total trades in CSV: ${csvTrades.length}`)
    console.log(`   Successfully imported: ${successfulImports}`)
    console.log(`   Duplicates detected: ${duplicatesDetected}`)
    console.log(`   Expected unique trades: 3 (MNQZ24, ESZ24, NQKZ24)`)
    console.log(`   Expected duplicates: 2 (MNQZ24 #2, ESZ24 #2)`)
    
    if (successfulImports === 3 && duplicatesDetected === 2) {
      console.log('\n🎉 DUPLICATE DETECTION WORKING PERFECTLY!')
    } else {
      console.log('\n⚠️ Unexpected results - check implementation')
    }
    
    // Show what duplicates were detected
    if (duplicatesList.length > 0) {
      console.log('\n🔍 DETECTED DUPLICATES:')
      duplicatesList.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.trade.symbol} - ${item.duplicate.level} (${item.duplicate.confidence})`)
        console.log(`      Reason: ${item.duplicate.reason}`)
      })
    }
    
    // Show final database state
    const finalTradeCount = await prisma.trade.count({ where: { userId: testUserId } })
    console.log(`\n💾 Final trades in database: ${finalTradeCount}`)
    
    // Test force creation (simulating "Import Anyway" button)
    if (duplicatesList.length > 0) {
      console.log('\n🔧 Testing force creation (Import Anyway)...')
      const duplicateTrade = duplicatesList[0].trade
      
      const forceResponse = await fetch('http://localhost:3000/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId,
          ...duplicateTrade,
          forceCreate: true,
          status: duplicateTrade.exitDate ? 'CLOSED' : 'OPEN'
        })
      })
      
      if (forceResponse.ok) {
        const forceResult = await forceResponse.json()
        console.log(`   ✅ Force creation successful: ${forceResult.id}`)
        
        const finalCount = await prisma.trade.count({ where: { userId: testUserId } })
        console.log(`   💾 New total trades: ${finalCount}`)
      } else {
        console.log(`   ❌ Force creation failed: ${forceResponse.status}`)
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

testCSVImport()