/**
 * Date utility functions for trading analysis
 */

/**
 * Get the start and end dates for today (00:00:00 to 23:59:59)
 */
export function getTodayRange(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  
  return { start, end }
}

/**
 * Get the start and end dates for yesterday (00:00:00 to 23:59:59)
 */
export function getYesterdayRange(): { start: Date; end: Date } {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  const start = new Date(yesterday)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(yesterday)
  end.setHours(23, 59, 59, 999)
  
  return { start, end }
}


/**
 * Create a custom date range from start and end dates
 * @param startDate - Start date
 * @param endDate - End date
 */
export function getCustomRange(startDate: Date, endDate: Date): { start: Date; end: Date } {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)
  
  return { start, end }
}

/**
 * Parse a date option string and return the corresponding date range
 * @param option - Date option string (e.g., 'today', 'yesterday', or numeric days)
 */
export function parseDateOption(option: string): { start: Date; end: Date } | null {
  switch (option) {
    case 'today':
      return getTodayRange()
    case 'yesterday':
      return getYesterdayRange()
    default:
      // Handle numeric options (backward compatibility)
      const days = parseInt(option)
      if (!isNaN(days) && days > 0) {
        const end = new Date()
        end.setHours(23, 59, 59, 999)
        
        const start = new Date()
        start.setDate(start.getDate() - days)
        start.setHours(0, 0, 0, 0)
        
        return { start, end }
      }
      return null
  }
}

/**
 * Format a date range for display in the UI
 * @param start - Start date
 * @param end - End date
 */
export function formatDateRangeDisplay(start: Date, end: Date): string {
  const startStr = start.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: start.getFullYear() !== end.getFullYear() ? 'numeric' : undefined
  })
  
  const endStr = end.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
  
  // Same day
  if (start.toDateString() === end.toDateString()) {
    return endStr
  }
  
  return `${startStr} - ${endStr}`
}

/**
 * Validate that a custom date range is reasonable for analysis
 * @param startDate - Start date string (YYYY-MM-DD)
 * @param endDate - End date string (YYYY-MM-DD)
 */
export function validateCustomDateRange(startDate: string, endDate: string): { isValid: boolean; error?: string } {
  if (!startDate || !endDate) {
    return { isValid: false, error: 'Both start and end dates are required' }
  }
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, error: 'Invalid date format' }
  }
  
  if (start > end) {
    return { isValid: false, error: 'Start date must be before or equal to end date' }
  }
  
  const now = new Date()
  if (start > now) {
    return { isValid: false, error: 'Start date cannot be in the future' }
  }
  
  // Check if range is too large (more than 2 years)
  const daysDifference = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  if (daysDifference > 730) {
    return { isValid: false, error: 'Date range cannot exceed 2 years' }
  }
  
  return { isValid: true }
}