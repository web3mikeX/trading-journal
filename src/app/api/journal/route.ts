import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createJournalEntrySchema = z.object({
  title: z.string().max(200, 'Title must be less than 200 characters').optional(),
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
    
    // Set demo user ID if not provided
    if (!body.userId) {
      body.userId = "cmcwu8b5m0001m17ilm0triy8" // Demo user ID
    }
    
    // Generate title for post-import entries
    if (body.type === 'post_import' && !body.title) {
      const importCount = body.metadata?.importCount || 0
      body.title = `Post-Import Reflection - ${importCount} trade${importCount !== 1 ? 's' : ''} imported`
      body.entryType = 'POST_TRADE'
    }
    
    const validatedData = createJournalEntrySchema.parse(body)

    // Verify trade exists if tradeId is provided
    if (validatedData.tradeId) {
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

    // Prepare data for database - convert metadata to JSON string if it exists
    const dataToCreate: any = {
      ...validatedData,
      metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null
    }

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

    return NextResponse.json(journalEntry, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: errorMessage 
    }, { status: 500 })
  }
}