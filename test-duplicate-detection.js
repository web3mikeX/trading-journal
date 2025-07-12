const { PrismaClient } = require('@prisma/client')
const { generateTradeHash, detectDuplicateTrade } = require('./src/lib/duplicateDetection.ts')

const prisma = new PrismaClient()

async function testDuplicateDetection() {
  console.log('🧪 Testing Duplicate Detection System...\n')
  
  // Test data
  const testUserId = 'test-user-123'
  const testTrade1 = {
    userId: testUserId,
    symbol: 'MNQZ24',
    side: 'LONG',
    entryDate: '2024-01-15T09:30:00Z',
    entryPrice: 18500.25,
    quantity: 2,
    exitDate: '2024-01-15T09:31:00Z',
    exitPrice: 18505.75
  }
  
  const testTrade2 = {
    ...testTrade1,
    // Exact duplicate
  }
  
  const testTrade3 = {
    ...testTrade1,
    entryPrice: 18500.30, // Slightly different price
    entryDate: '2024-01-15T09:30:30Z' // 30 seconds later
  }
  
  try {
    // Clean up any existing test data
    await prisma.trade.deleteMany({ where: { userId: testUserId } })
    
    // Test 1: Create first trade
    console.log('1️⃣ Creating first trade...')
    const hash1 = generateTradeHash(testTrade1)
    console.log('Generated hash:', hash1)
    
    const trade1 = await prisma.trade.create({
      data: {
        ...testTrade1,
        entryDate: new Date(testTrade1.entryDate),
        exitDate: new Date(testTrade1.exitDate),
        tradeHash: hash1,
        isDuplicate: false,
        market: 'FUTURES',
        dataSource: 'csv',
        status: 'CLOSED'
      }
    })
    console.log('✅ First trade created:', trade1.id)
    
    // Test 2: Check for exact duplicate
    console.log('\n2️⃣ Testing exact duplicate detection...')
    const duplicateCheck1 = await detectDuplicateTrade(testTrade2)
    console.log('Duplicate result:', {
      level: duplicateCheck1.level,
      confidence: duplicateCheck1.confidence,
      reason: duplicateCheck1.reason,
      existingTradeId: duplicateCheck1.existingTrade?.id
    })
    
    // Test 3: Check for similar trade (should be HIGH or MEDIUM confidence)
    console.log('\n3️⃣ Testing similar trade detection...')
    const duplicateCheck2 = await detectDuplicateTrade(testTrade3)
    console.log('Similar trade result:', {
      level: duplicateCheck2.level,
      confidence: duplicateCheck2.confidence,
      reason: duplicateCheck2.reason,
      existingTradeId: duplicateCheck2.existingTrade?.id
    })
    
    // Test 4: Test completely different trade
    console.log('\n4️⃣ Testing different trade (should be NONE)...')
    const differentTrade = {
      userId: testUserId,
      symbol: 'ESZ24',
      side: 'SHORT',
      entryDate: '2024-01-16T14:00:00Z',
      entryPrice: 4500.00,
      quantity: 1
    }
    
    const duplicateCheck3 = await detectDuplicateTrade(differentTrade)
    console.log('Different trade result:', {
      level: duplicateCheck3.level,
      confidence: duplicateCheck3.confidence,
      reason: duplicateCheck3.reason
    })
    
    console.log('\n✅ All duplicate detection tests completed successfully!')
    
    // Clean up
    await prisma.trade.deleteMany({ where: { userId: testUserId } })
    console.log('🧹 Test data cleaned up')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testDuplicateDetection()
}

module.exports = { testDuplicateDetection }