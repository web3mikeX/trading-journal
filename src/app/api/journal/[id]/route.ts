import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateJournalEntrySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters').optional(),
  content: z.string().min(1, 'Content is required').max(5000, 'Content must be less than 5000 characters').optional(),
  entryType: z.enum(['PRE_TRADE', 'DURING_TRADE', 'POST_TRADE', 'GENERAL', 'LESSON']).optional(),
  mood: z.number().min(1).max(5).optional(),
  confidence: z.number().min(1).max(5).optional(),
  tradeId: z.string().optional(),
  userId: z.string()
})

// GET /api/journal/[id] - Get a specific journal entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const { id } = await params

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const journalEntry = await prisma.journalEntry.findFirst({
      where: {
        id: id,
        userId: userId
      },
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

    if (!journalEntry) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    }

    return NextResponse.json(journalEntry)
  } catch (error) {
    console.error('Error fetching journal entry:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PUT /api/journal/[id] - Update a journal entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const validatedData = updateJournalEntrySchema.parse(body)
    const { id } = await params

    // Verify the journal entry exists and belongs to the user
    const existingEntry = await prisma.journalEntry.findFirst({
      where: {
        id: id,
        userId: validatedData.userId
      }
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    }

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

    const updatedEntry = await prisma.journalEntry.update({
      where: { id: id },
      data: {
        title: validatedData.title,
        content: validatedData.content,
        entryType: validatedData.entryType,
        mood: validatedData.mood,
        confidence: validatedData.confidence,
        tradeId: validatedData.tradeId,
        updatedAt: new Date()
      },
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

    return NextResponse.json(updatedEntry)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating journal entry:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/journal/[id] - Delete a journal entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const { id } = await params

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Verify the journal entry exists and belongs to the user
    const existingEntry = await prisma.journalEntry.findFirst({
      where: {
        id: id,
        userId: userId
      }
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
    }

    await prisma.journalEntry.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Journal entry deleted successfully' })
  } catch (error) {
    console.error('Error deleting journal entry:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}