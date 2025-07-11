/**
 * Date utility functions for week-based trading analysis
 * Week is defined as Sunday (0) to Saturday (6)
 */

/**
 * Get the start and end dates for the current trading week (Sunday-Saturday)
 */
export function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date()
  return getWeekRange(now)
}

/**
 * Get the start and end dates for the week containing the given date
 * @param date - The date to get the week range for
 */
export function getWeekRange(date: Date): { start: Date; end: Date } {
  const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
  
  // Calculate start of week (Sunday)
  const start = new Date(date)
  start.setDate(date.getDate() - dayOfWeek)
  start.setHours(0, 0, 0, 0)
  
  // Calculate end of week (Saturday)
  const end = new Date(date)
  end.setDate(date.getDate() + (6 - dayOfWeek))
  end.setHours(23, 59, 59, 999)
  
  return { start, end }
}

/**
 * Format a week range for display
 * @param start - Start date of the week
 * @param end - End date of the week
 */
export function formatWeekRange(start: Date, end: Date): string {
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
  
  if (startMonth === endMonth) {
    // Same month: "July 6-12"
    return `${startMonth} ${start.getDate()}-${end.getDate()}`
  } else {
    // Different months: "June 30 - July 6"
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`
  }
}

/**
 * Check if a date falls within the current trading week
 * @param date - The date to check
 */
export function isInCurrentWeek(date: Date): boolean {
  const { start, end } = getCurrentWeekRange()
  return date >= start && date <= end
}

/**
 * Get the previous trading week range
 */
export function getPreviousWeekRange(): { start: Date; end: Date } {
  const lastWeek = new Date()
  lastWeek.setDate(lastWeek.getDate() - 7)
  return getWeekRange(lastWeek)
}

/**
 * Get the next trading week range
 */
export function getNextWeekRange(): { start: Date; end: Date } {
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  return getWeekRange(nextWeek)
}

/**
 * Get week range for a specific week offset from current week
 * @param weekOffset - Number of weeks to offset (negative for past, positive for future)
 */
export function getWeekRangeOffset(weekOffset: number): { start: Date; end: Date } {
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + (weekOffset * 7))
  return getWeekRange(targetDate)
}

/**
 * Filter trades by week range
 * @param trades - Array of trades with entryDate property
 * @param weekStart - Start of the week
 * @param weekEnd - End of the week
 */
export function filterTradesByWeek<T extends { entryDate: Date }>(
  trades: T[], 
  weekStart: Date, 
  weekEnd: Date
): T[] {
  return trades.filter(trade => {
    const tradeDate = new Date(trade.entryDate)
    return tradeDate >= weekStart && tradeDate <= weekEnd
  })
}

/**
 * Get a formatted string for "This Week", "Last Week", etc.
 * @param weekOffset - Number of weeks from current (0 = this week, -1 = last week, etc.)
 */
export function getWeekLabel(weekOffset: number): string {
  if (weekOffset === 0) return "This Week"
  if (weekOffset === -1) return "Last Week"
  if (weekOffset === 1) return "Next Week"
  if (weekOffset < 0) return `${Math.abs(weekOffset)} Weeks Ago`
  return `${weekOffset} Weeks Ahead`
}