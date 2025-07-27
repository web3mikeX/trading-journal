import { prisma } from '@/lib/prisma'

/**
 * Validates that calendar entries don't contain orphaned trading statistics
 * Returns validation results and any issues found
 */
export async function validateCalendarIntegrity(userId: string, date?: Date) {
  const issues: Array<{
    date: string
    type: 'orphaned_stats' | 'inconsistent_data'
    message: string
    calendarData: any
    actualData: any
  }> = []

  try {
    // Define date range for validation
    let dateFilter: any = { userId }
    
    if (date) {
      const dayStart = new Date(date.toISOString().split('T')[0] + 'T00:00:00.000Z')
      const dayEnd = new Date(date.toISOString().split('T')[0] + 'T23:59:59.999Z')
      dateFilter.date = { gte: dayStart, lte: dayEnd }
    }

    // Get all calendar entries with trading statistics
    const calendarEntries = await prisma.calendarEntry.findMany({
      where: {
        ...dateFilter,
        OR: [
          { dailyPnL: { not: null } },
          { tradesCount: { gt: 0 } },
          { winningTrades: { gt: 0 } },
          { losingTrades: { gt: 0 } },
          { winRate: { not: null } }
        ]
      },
      select: {
        id: true,
        date: true,
        dailyPnL: true,
        tradesCount: true,
        winningTrades: true,
        losingTrades: true,
        winRate: true,
        notes: true,
        mood: true,
        images: true
      }
    })

    for (const entry of calendarEntries) {
      const entryDateStr = entry.date.toISOString().split('T')[0]
      const dayStart = new Date(entryDateStr + 'T00:00:00.000Z')
      const dayEnd = new Date(entryDateStr + 'T23:59:59.999Z')

      // Get actual trades for this date
      const actualTrades = await prisma.trade.findMany({
        where: {
          userId,
          entryDate: { gte: dayStart, lte: dayEnd }
        },
        select: {
          id: true,
          netPnL: true,
          status: true
        }
      })

      const actualTradeCount = actualTrades.length
      const actualPnL = actualTrades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
      const actualClosedTrades = actualTrades.filter(t => t.status === 'CLOSED')
      const actualWinningTrades = actualClosedTrades.filter(t => (t.netPnL || 0) > 0)

      // Check for orphaned statistics (calendar has trading stats but no actual trades)
      if (actualTradeCount === 0 && (entry.tradesCount > 0 || entry.dailyPnL !== 0)) {
        issues.push({
          date: entryDateStr,
          type: 'orphaned_stats',
          message: `Calendar entry has trading statistics but no actual trades found`,
          calendarData: {
            tradesCount: entry.tradesCount,
            dailyPnL: entry.dailyPnL,
            winningTrades: entry.winningTrades,
            losingTrades: entry.losingTrades,
            winRate: entry.winRate
          },
          actualData: {
            tradesCount: actualTradeCount,
            dailyPnL: actualPnL
          }
        })
      }

      // Check for inconsistent data (calendar stats don't match actual trades)
      else if (actualTradeCount > 0) {
        const hasInconsistency = 
          Math.abs((entry.dailyPnL || 0) - actualPnL) > 0.01 ||
          (entry.tradesCount || 0) !== actualTradeCount

        if (hasInconsistency) {
          issues.push({
            date: entryDateStr,
            type: 'inconsistent_data',
            message: `Calendar statistics don't match actual trade data`,
            calendarData: {
              tradesCount: entry.tradesCount,
              dailyPnL: entry.dailyPnL,
              winningTrades: entry.winningTrades,
              losingTrades: entry.losingTrades,
              winRate: entry.winRate
            },
            actualData: {
              tradesCount: actualTradeCount,
              dailyPnL: actualPnL,
              winningTrades: actualWinningTrades.length,
              losingTrades: actualClosedTrades.length - actualWinningTrades.length
            }
          })
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      totalEntriesChecked: calendarEntries.length
    }

  } catch (error) {
    throw new Error(`Calendar validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Automatically fixes orphaned calendar entries by removing invalid trading statistics
 */
export async function fixOrphanedCalendarEntries(userId: string, dryRun = true) {
  const validation = await validateCalendarIntegrity(userId)
  
  if (validation.isValid) {
    return { fixed: 0, message: 'No issues found' }
  }

  const fixResults = {
    deleted: 0,
    updated: 0,
    errors: [] as string[]
  }

  if (!dryRun) {
    for (const issue of validation.issues) {
      try {
        const entryDate = new Date(issue.date)
        
        if (issue.type === 'orphaned_stats') {
          // Check if entry has diary content
          const entry = await prisma.calendarEntry.findUnique({
            where: {
              userId_date: { userId, date: entryDate }
            },
            select: { notes: true, mood: true, images: true }
          })

          const hasDiaryContent = entry?.notes || entry?.mood || entry?.images

          if (hasDiaryContent) {
            // Keep entry but clear trading stats
            await prisma.calendarEntry.update({
              where: { userId_date: { userId, date: entryDate } },
              data: {
                dailyPnL: null,
                tradesCount: 0,
                winningTrades: 0,
                losingTrades: 0,
                winRate: null
              }
            })
            fixResults.updated++
          } else {
            // Delete completely orphaned entry
            await prisma.calendarEntry.delete({
              where: { userId_date: { userId, date: entryDate } }
            })
            fixResults.deleted++
          }
        }
        
        else if (issue.type === 'inconsistent_data') {
          // Update with correct values from actual trades
          await prisma.calendarEntry.update({
            where: { userId_date: { userId, date: entryDate } },
            data: {
              dailyPnL: issue.actualData.dailyPnL,
              tradesCount: issue.actualData.tradesCount,
              winningTrades: issue.actualData.winningTrades || 0,
              losingTrades: issue.actualData.losingTrades || 0,
              winRate: issue.actualData.tradesCount > 0 ? 
                ((issue.actualData.winningTrades || 0) / (issue.actualData.winningTrades + issue.actualData.losingTrades)) * 100 : 
                null
            }
          })
          fixResults.updated++
        }
      } catch (error) {
        fixResults.errors.push(`Failed to fix ${issue.date}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  return {
    dryRun,
    issuesFound: validation.issues.length,
    ...fixResults,
    message: dryRun ? 
      `Found ${validation.issues.length} issues that can be fixed` : 
      `Fixed ${fixResults.updated + fixResults.deleted} issues`
  }
}