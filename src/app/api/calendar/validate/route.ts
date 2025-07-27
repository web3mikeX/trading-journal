import { NextRequest, NextResponse } from 'next/server'
import { validateCalendarIntegrity, fixOrphanedCalendarEntries } from '@/lib/calendarValidation'

// GET /api/calendar/validate - Validate calendar data integrity
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const dateParam = searchParams.get('date')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const date = dateParam ? new Date(dateParam) : undefined
    if (dateParam && isNaN(date?.getTime() || 0)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    const validation = await validateCalendarIntegrity(userId, date)

    return NextResponse.json({
      validation,
      recommendations: validation.isValid ? 
        ['Calendar data is consistent'] : 
        [
          'Run POST /api/calendar/validate with fix=true to automatically fix issues',
          'Or use the cleanup script: node fix-calendar-orphaned-entries.js'
        ]
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Validation failed', 
      details: errorMessage 
    }, { status: 500 })
  }
}

// POST /api/calendar/validate - Fix calendar data integrity issues
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const fix = searchParams.get('fix') === 'true'
    const dryRun = !fix

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const result = await fixOrphanedCalendarEntries(userId, dryRun)

    return NextResponse.json({
      result,
      message: dryRun ? 
        'Dry run completed - add ?fix=true to actually perform fixes' :
        'Calendar data has been fixed'
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Fix operation failed', 
      details: errorMessage 
    }, { status: 500 })
  }
}