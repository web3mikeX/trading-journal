import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// User validation schemas
export const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Trade validation schemas
export const tradeSchema = z.object({
  symbol: z.string()
    .min(1, 'Symbol is required')
    .max(20, 'Symbol must be less than 20 characters')
    .regex(/^[A-Z0-9.-]+$/, 'Symbol can only contain uppercase letters, numbers, dots, and hyphens'),
  side: z.enum(['LONG', 'SHORT'], { required_error: 'Side is required' }),
  entryPrice: z.number()
    .positive('Entry price must be positive')
    .max(1000000, 'Entry price must be less than $1,000,000'),
  quantity: z.number()
    .positive('Quantity must be positive')
    .max(1000000, 'Quantity must be less than 1,000,000'),
  exitPrice: z.number()
    .positive('Exit price must be positive')
    .max(1000000, 'Exit price must be less than $1,000,000')
    .optional(),
  stopLoss: z.number()
    .positive('Stop loss must be positive')
    .max(1000000, 'Stop loss must be less than $1,000,000')
    .optional(),
  takeProfit: z.number()
    .positive('Take profit must be positive')
    .max(1000000, 'Take profit must be less than $1,000,000')
    .optional(),
  notes: z.string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional(),
  strategy: z.string()
    .max(100, 'Strategy must be less than 100 characters')
    .optional(),
})

// Journal validation schemas
export const journalEntrySchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  content: z.string()
    .min(1, 'Content is required')
    .max(10000, 'Content must be less than 10,000 characters'),
  entryType: z.enum(['PRE_TRADE', 'DURING_TRADE', 'POST_TRADE', 'GENERAL', 'LESSON']).optional(),
  mood: z.number().min(1).max(5).optional(),
  confidence: z.number().min(1).max(5).optional(),
})

// Calendar validation schemas
export const calendarEntrySchema = z.object({
  notes: z.string()
    .max(5000, 'Notes must be less than 5000 characters')
    .optional(),
  mood: z.number().min(1).max(5).optional(),
  images: z.array(z.string()).max(10, 'Maximum 10 images allowed').optional(),
})

// Sanitization functions
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  })
}

export const sanitizeText = (text: string): string => {
  return text.trim().replace(/\s+/g, ' ')
}

export const sanitizeNumber = (value: any): number | null => {
  const num = parseFloat(value)
  return isNaN(num) ? null : num
}

// Rate limiting helpers
export const rateLimitMap = new Map()

export const checkRateLimit = (identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now()
  const requests = rateLimitMap.get(identifier) || []
  
  // Remove requests outside the window
  const validRequests = requests.filter((time: number) => now - time < windowMs)
  
  if (validRequests.length >= maxRequests) {
    return false
  }
  
  validRequests.push(now)
  rateLimitMap.set(identifier, validRequests)
  return true
}

// Security headers
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}

// Input sanitization middleware
export const sanitizeUserInput = (data: any): any => {
  if (typeof data === 'string') {
    return sanitizeText(data)
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeText(value)
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? sanitizeText(item) : item
        )
      } else {
        sanitized[key] = value
      }
    }
    return sanitized
  }
  
  return data
}

// Account balance validation
export interface BalanceValidation {
  isValid: boolean
  calculatedBalance: number
  expectedBalance?: number
  difference?: number
  warnings: string[]
  errors: string[]
}

/**
 * Validate account balance calculation against expected values
 */
export async function validateAccountBalance(
  userId: string, 
  expectedBalance?: number
): Promise<BalanceValidation> {
  const warnings: string[] = []
  const errors: string[] = []
  
  try {
    // Get user and trades
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        startingBalance: true,
        currentAccountHigh: true,
        trades: {
          where: { status: 'CLOSED' },
          select: {
            netPnL: true,
            entryPrice: true,
            exitPrice: true,
            quantity: true,
            side: true,
            symbol: true
          }
        }
      }
    })

    if (!user) {
      errors.push('User not found')
      return { isValid: false, calculatedBalance: 0, warnings, errors }
    }

    if (!user.startingBalance) {
      errors.push('Starting balance not set')
      return { isValid: false, calculatedBalance: 0, warnings, errors }
    }

    // Calculate total P&L
    const totalPnL = user.trades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
    const calculatedBalance = user.startingBalance + totalPnL

    // Check against expected balance if provided
    let difference = 0
    if (expectedBalance) {
      difference = Math.abs(calculatedBalance - expectedBalance)
      
      if (difference > 50) {
        errors.push(`Large discrepancy: $${difference.toFixed(2)} difference from expected balance`)
      } else if (difference > 10) {
        warnings.push(`Moderate discrepancy: $${difference.toFixed(2)} difference from expected balance`)
      } else if (difference > 1) {
        warnings.push(`Small discrepancy: $${difference.toFixed(2)} difference from expected balance`)
      }
    }

    const isValid = errors.length === 0 && (expectedBalance ? difference < 50 : true)

    return {
      isValid,
      calculatedBalance,
      expectedBalance,
      difference: expectedBalance ? difference : undefined,
      warnings,
      errors
    }

  } catch (error) {
    errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { isValid: false, calculatedBalance: 0, warnings, errors }
  }
}