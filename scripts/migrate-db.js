// Database migration script to ensure duplicate detection fields are added
const { PrismaClient } = require('@prisma/client')

async function migrate() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 Starting database migration for duplicate detection...')
    
    // Check if the new fields exist by trying to query them
    try {
      await prisma.$queryRaw`SELECT tradeHash FROM "Trade" LIMIT 1`
      console.log('✅ Duplicate detection fields already exist')
    } catch (error) {
      console.log('🔧 Adding duplicate detection fields...')
      
      // Add the new fields manually if they don't exist
      await prisma.$executeRaw`
        ALTER TABLE "Trade" 
        ADD COLUMN IF NOT EXISTS "tradeHash" TEXT,
        ADD COLUMN IF NOT EXISTS "isDuplicate" BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS "originalTradeId" TEXT,
        ADD COLUMN IF NOT EXISTS "duplicateChecksum" TEXT
      `
      
      // Add indexes
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "Trade_tradeHash_idx" ON "Trade"("tradeHash")
      `
      
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "Trade_userId_symbol_entryDate_idx" ON "Trade"("userId", "symbol", "entryDate")
      `
      
      console.log('✅ Duplicate detection fields added successfully')
    }
    
    // Test the duplicate detection
    console.log('🧪 Testing duplicate detection...')
    
    const testTrade = {
      userId: "cmcwu8b5m0001m17ilm0triy8",
      symbol: "TEST",
      side: "LONG",
      entryDate: new Date(),
      entryPrice: 100.0,
      quantity: 1.0,
      market: "FUTURES",
      tradeHash: "test-hash-" + Date.now(),
      isDuplicate: false,
      duplicateChecksum: "test-checksum"
    }
    
    const created = await prisma.trade.create({
      data: testTrade
    })
    
    console.log('✅ Test trade created:', created.id)
    
    // Clean up test trade
    await prisma.trade.delete({
      where: { id: created.id }
    })
    
    console.log('✅ Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  migrate().catch(console.error)
}

module.exports = migrate