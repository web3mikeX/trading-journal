import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createJournalEntrySchema = z.object({
  title: z.string().max(200, 'Title must be less than 200 characters').default('Untitled Entry'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content must be less than 5000 characters'),
  entryType: z.enum(['PRE_TRADE', 'DURING_TRADE', 'POST_TRADE', 'GENERAL', 'LESSON']).default('GENERAL'),
  type: z.enum(['post_import']).optional(), // For special entry types
  mood: z.number().min(1).max(5).optional(),
  confidence: z.number().min(1).max(5).optional(),
  fear: z.number().min(1).max(5).optional(),
  excitement: z.number().min(1).max(5).optional(),
  tradeId: z.string().optional(),
  userId: z.string().optional(), // Make optional, will be set from auth
  metadata: z.object({
    importCount: z.number().optional(),
    importSummary: z.string().optional(),
    mood: z.string().optional(),
    timestamp: z.string().optional()
  }).optional()
})

// GET /api/journal - Get all journal entries for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const search = searchParams.get('search')
    const entryType = searchParams.get('entryType')
    const tradeId = searchParams.get('tradeId')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Build where clause
    const whereClause: any = { userId }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (entryType) {
      whereClause.entryType = entryType
    }

    if (tradeId) {
      whereClause.tradeId = tradeId
    }

    const journalEntries = await prisma.journalEntry.findMany({
      where: whereClause,
      include: {
        trade: {
          select: {
            id: true,
            symbol: true,
            side: true,
            entryDate: true,
            exitDate: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const totalCount = await prisma.journalEntry.count({
      where: whereClause
    })

    return NextResponse.json({
      entries: journalEntries,
      totalCount,
      hasMore: totalCount > offset + limit
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: errorMessage 
    }, { status: 500 })
  }
}

// POST /api/journal - Create a new journal entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 Journal API received request body:', body)
    
    // Set demo user ID if not provided
    if (!body.userId) {
      body.userId = "cmcwu8b5m0001m17ilm0triy8" // Demo user ID
      console.log('📝 Set default demo user ID')
    }
    
    // Generate title for post-import entries
    if (body.type === 'post_import' && !body.title) {
      const importCount = body.metadata?.importCount || 0
      body.title = `Post-Import Reflection - ${importCount} trade${importCount !== 1 ? 's' : ''} imported`
      body.entryType = 'POST_TRADE'
    }
    
    console.log('📝 Validating data with schema...')
    const validatedData = createJournalEntrySchema.parse(body)
    console.log('📝 Validation successful:', validatedData)

    // Verify trade exists if tradeId is provided
    if (validatedData.tradeId) {
      console.log('📝 Verifying trade exists:', validatedData.tradeId)
      const trade = await prisma.trade.findFirst({
        where: {
          id: validatedData.tradeId,
          userId: validatedData.userId
        }
      })

      if (!trade) {
        return NextResponse.json({ error: 'Trade not found' }, { status: 400 })
      }
    }

    // Prepare data for database - exclude metadata as it doesn't exist in schema
    const dataToCreate: any = {
      ...validatedData
    }
    
    // Remove metadata field as it's not in the database schema
    delete dataToCreate.metadata
    delete dataToCreate.type // Also remove type field as it's only used for processing
    
    console.log('📝 Creating journal entry with data:', dataToCreate)

    const journalEntry = await prisma.journalEntry.create({
      data: dataToCreate,
      include: {
        trade: {
          select: {
            id: true,
            symbol: true,
            side: true,
            entryDate: true,
            exitDate: true,
            status: true
          }
        }
      }
    })

    console.log('✅ Journal entry created successfully:', journalEntry.id)
    return NextResponse.json(journalEntry, { status: 201 })
  } catch (error) {
    console.error('❌ Journal API error:', error)
    console.error('❌ Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('❌ Error message:', error instanceof Error ? error.message : error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    if (error instanceof z.ZodError) {
      console.error('❌ Zod validation errors:', error.errors)
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: errorMessage 
    }, { status: 500 })
  }
}