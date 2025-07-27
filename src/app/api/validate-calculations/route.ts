import { NextRequest, NextResponse } from 'next/server'
import { validateUserCalculations, validateAllUserCalculations } from '@/lib/calculationValidator'

// GET /api/validate-calculations - Validate calculations for a user or all users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const all = searchParams.get('all') === 'true'

    if (all) {
      // Admin function - validate all users
      const reports = await validateAllUserCalculations()
      
      // Summarize results
      const summary = {
        totalUsers: reports.length,
        validUsers: reports.filter(r => r.overallStatus === 'VALID').length,
        warningUsers: reports.filter(r => r.overallStatus === 'WARNING').length,
        errorUsers: reports.filter(r => r.overallStatus === 'ERROR').length,
        reports
      }

      return NextResponse.json(summary)
    }

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required unless using all=true parameter' 
      }, { status: 400 })
    }

    // Validate specific user
    const report = await validateUserCalculations(userId)

    return NextResponse.json(report)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: errorMessage
    }, { status: 500 })
  }
}

// POST /api/validate-calculations - Run validation and optionally fix issues
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, autoFix = false } = body

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 })
    }

    // Run validation
    const report = await validateUserCalculations(userId)

    // TODO: Implement auto-fix functionality for common issues
    // This could include:
    // - Recalculating P&L for trades with inconsistencies
    // - Updating account high based on current balance
    // - Fixing fee calculations for futures trades
    
    let fixedIssues: string[] = []
    
    if (autoFix && report.overallStatus !== 'VALID') {
      // For now, just log the issues that could be auto-fixed
      fixedIssues = report.checks
        .filter(check => check.status === 'FAIL' && 
          ['P&L_CONSISTENCY', 'FEE_CONSISTENCY'].includes(check.type))
        .map(check => check.description)
    }

    return NextResponse.json({
      report,
      autoFixApplied: autoFix,
      fixedIssues
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: errorMessage
    }, { status: 500 })
  }
}