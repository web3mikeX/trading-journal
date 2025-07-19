const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

const prisma = new PrismaClient()

// Simple duplicate detection functions in CommonJS
function generateTradeHash(trade) {
  const entryDate = new Date(trade.entryDate).toISOString().split('T')[0] // YYYY-MM-DD
  const hashInput = [
    trade.userId,
    trade.symbol.toUpperCase(),
    trade.side,
    entryDate,
    trade.entryPrice.toFixed(2),
    trade.quantity.toString()
  ].join('|')
  
  return crypto.createHash('sha256').update(hashInput).digest('hex')
}

async function testDuplicateDetection() {
  console.log('🧪 Testing Simple Duplicate Detection...\n')
  
  const testUserId = 'test-user-123'
  const testTrade1 = {
    userId: testUserId,
    symbol: 'MNQZ24',
    side: 'LONG',
    entryDate: '2024-01-15T09:30:00Z',
    entryPrice: 18500.25,
    quantity: 2
  }
  
  try {
    // Clean up any existing test data
    await prisma.trade.deleteMany({ where: { userId: testUserId } })
    await prisma.user.deleteMany({ where: { id: testUserId } })
    
    // Create test user first
    await prisma.user.create({
      data: {
        id: testUserId,
        email: 'test@example.com',
        name: 'Test User'
      }
    })
    console.log('👤 Test user created')
    
    // Test hash generation
    console.log('1️⃣ Testing hash generation...')
    const hash1 = generateTradeHash(testTrade1)
    console.log('Generated hash:', hash1.substring(0, 16) + '...')
    
    // Create first trade
    console.log('\n2️⃣ Creating first trade...')
    const trade1 = await prisma.trade.create({
      data: {
        ...testTrade1,
        entryDate: new Date(testTrade1.entryDate),
        tradeHash: hash1,
        isDuplicate: false,
        market: 'FUTURES',
        dataSource: 'csv',
        status: 'OPEN'
      }
    })
    console.log('✅ First trade created with ID:', trade1.id)
    
    // Test duplicate detection
    console.log('\n3️⃣ Testing duplicate detection...')
    const hash2 = generateTradeHash(testTrade1) // Same trade, same hash
    console.log('Second hash matches first:', hash1 === hash2)
    
    // Check for existing trade with same hash
    const existingTrade = await prisma.trade.findFirst({
      where: {
        userId: testUserId,
        tradeHash: hash2
      }
    })
    
    if (existingTrade) {
      console.log('✅ Duplicate detected! Found existing trade:', existingTrade.id)
    } else {
      console.log('❌ No duplicate found (unexpected)')
    }
    
    // Test unique constraint
    console.log('\n4️⃣ Testing unique constraint...')
    try {
      await prisma.trade.create({
        data: {
          ...testTrade1,
          entryDate: new Date(testTrade1.entryDate),
          tradeHash: hash1, // Same hash should fail
          isDuplicate: false,
          market: 'FUTURES',
          dataSource: 'csv',
          status: 'OPEN'
        }
      })
      console.log('❌ Unique constraint failed to prevent duplicate')
    } catch (error) {
      if (error.code === 'P2002') {
        console.log('✅ Unique constraint working - prevented duplicate hash')
      } else {
        console.log('❓ Unexpected error:', error.message)
      }
    }
    
    console.log('\n✅ All basic tests completed!')
    
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

testDuplicateDetection()