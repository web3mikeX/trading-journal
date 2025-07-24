import { prisma } from '@/lib/prisma'
import { AccountType } from '@prisma/client'
import { detectBroker, getFeeSummary } from '@/lib/contractSpecs'

// Evaluation account MLL amounts based on account size
export const EVALUATION_MLL_AMOUNTS: Record<string, number> = {
  EVALUATION_50K: 2000,
  EVALUATION_100K: 3000,
  EVALUATION_150K: 4500,
  EVALUATION: 0, // Will be set manually
  CUSTOM: 0, // Will be set manually
  LIVE_FUNDED: 0, // MLL resets to $0 after first payout
  // Backwards compatibility for any remaining old values
  TOPSTEP_50K: 2000,
  TOPSTEP_100K: 3000,
  TOPSTEP_150K: 4500
}

// Evaluation account starting balances
export const EVALUATION_STARTING_BALANCES: Record<string, number> = {
  EVALUATION_50K: 50000,
  EVALUATION_100K: 100000,
  EVALUATION_150K: 150000,
  EVALUATION: 0, // Will be set manually
  CUSTOM: 0, // Will be set manually
  LIVE_FUNDED: 0, // Variable based on previous account
  // Backwards compatibility for any remaining old values
  TOPSTEP_50K: 50000,
  TOPSTEP_100K: 100000,
  TOPSTEP_150K: 150000
}

export interface AccountMetrics {
  currentBalance: number
  accountHigh: number
  calculatedTrailingLimit: number
  calculatedDailyLimit: number | null
  displayTrailingLimit: number // The actual calculated amount to show in UI
  trailingDrawdownAmount: number
  dailyLossLimit: number | null
  netPnLToDate: number
  dailyPnL: number
  accountType: AccountType
  isWithinTrailingLimit: boolean
  isWithinDailyLimit: boolean
  trailingBuffer: number
  dailyBuffer: number | null
  accountStartDate: Date | null
  isLiveFunded: boolean
  firstPayoutReceived: boolean
}

export interface AccountMetricsWithFees extends AccountMetrics {
  broker: string | null
  totalFeesToDate: number
  dailyFees: number
  grossPnLToDate: number
  grossDailyPnL: number
  feeImpactPercentage: number
  averageFeePerTrade: number
  balanceValidated: boolean
  lastValidationDate: Date | null
}

export interface TradeForCalculation {
  netPnL: number | null
  entryDate: Date
  status: 'OPEN' | 'CLOSED' | 'CANCELLED'
}

/**
 * Get the drawdown amount for a specific account type
 */
export function getDrawdownAmount(accountType: string): number {
  return EVALUATION_MLL_AMOUNTS[accountType] || 0
}

/**
 * Get the starting balance for a specific account type
 */
export function getStartingBalance(accountType: string): number {
  return EVALUATION_STARTING_BALANCES[accountType] || 0
}

/**
 * Calculate the current account balance from starting balance and trades
 */
export function calculateCurrentBalance(
  startingBalance: number,
  trades: TradeForCalculation[],
  startDate?: Date
): number {
  const relevantTrades = startDate 
    ? trades.filter(trade => new Date(trade.entryDate) >= startDate && trade.status === 'CLOSED')
    : trades.filter(trade => trade.status === 'CLOSED')

  const totalPnL = relevantTrades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
  return startingBalance + totalPnL
}

/**
 * Get the account high (highest balance reached) since account start
 */
export function getAccountHighSinceStart(
  startingBalance: number,
  trades: TradeForCalculation[],
  startDate?: Date
): number {
  if (!startDate) return startingBalance

  const relevantTrades = trades
    .filter(trade => new Date(trade.entryDate) >= startDate && trade.status === 'CLOSED')
    .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime())

  let runningBalance = startingBalance
  let highWaterMark = startingBalance

  for (const trade of relevantTrades) {
    runningBalance += trade.netPnL || 0
    if (runningBalance > highWaterMark) {
      highWaterMark = runningBalance
    }
  }

  return highWaterMark
}

/**
 * Calculate today's P&L
 */
export function getTodayPnL(trades: TradeForCalculation[]): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayTrades = trades.filter(trade => {
    const tradeDate = new Date(trade.entryDate)
    return tradeDate >= today && tradeDate < tomorrow && trade.status === 'CLOSED'
  })

  return todayTrades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
}

/**
 * Calculate the trailing drawdown limit based on account high
 */
export function calculateTrailingDrawdownLimit(
  accountHigh: number,
  trailingDrawdownAmount: number,
  startingBalance: number,
  isLiveFunded: boolean,
  firstPayoutReceived: boolean
): number {
  // Live funded accounts: Trailing limit resets to $0 after first payout
  if (isLiveFunded && firstPayoutReceived) {
    return 0
  }

  // Calculate the actual trailing limit from account high
  const calculatedLimit = accountHigh - trailingDrawdownAmount
  
  // For evaluation accounts, trailing limit cannot go below starting balance
  // Only apply the floor if the calculated limit would be below starting balance
  return Math.max(calculatedLimit, startingBalance)
}

/**
 * Calculate the daily loss limit based on account high
 */
export function calculateDailyLossLimit(
  accountHigh: number,
  dailyLossLimit: number | null
): number | null {
  if (!dailyLossLimit || dailyLossLimit <= 0) {
    return null
  }

  // Daily loss limit is always AccountHigh - dailyLossLimit (no minimum floor)
  return accountHigh - dailyLossLimit
}

/**
 * Check if current balance is within the trailing drawdown limit
 */
export function isWithinTrailingLimit(currentBalance: number, trailingLimit: number): boolean {
  return currentBalance >= trailingLimit
}

/**
 * Check if current balance is within the daily loss limit
 */
export function isWithinDailyLimit(currentBalance: number, dailyLimit: number | null): boolean {
  if (dailyLimit === null) return true
  return currentBalance >= dailyLimit
}

/**
 * Legacy function for backwards compatibility - use calculateTrailingDrawdownLimit instead
 */
export function calculateCurrentMLL(
  accountType: AccountType,
  accountHigh: number,
  trailingDrawdownAmount: number,
  startingBalance: number,
  isLiveFunded: boolean,
  firstPayoutReceived: boolean
): number {
  return calculateTrailingDrawdownLimit(accountHigh, trailingDrawdownAmount, startingBalance, isLiveFunded, firstPayoutReceived)
}

/**
 * Legacy function for backwards compatibility - use isWithinTrailingLimit instead
 */
export function isWithinMLL(currentBalance: number, mll: number): boolean {
  return isWithinTrailingLimit(currentBalance, mll)
}

/**
 * Get comprehensive account metrics for a user
 */
export async function getAccountMetrics(userId: string): Promise<AccountMetrics | null> {
  try {
    // Get user account settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        accountType: true,
        startingBalance: true,
        currentAccountHigh: true,
        trailingDrawdownAmount: true,
        dailyLossLimit: true,
        accountStartDate: true,
        isLiveFunded: true,
        firstPayoutReceived: true,
        trades: {
          select: {
            netPnL: true,
            entryDate: true,
            status: true
          }
        }
      }
    })

    if (!user || !user.startingBalance || !user.accountStartDate) {
      return null
    }

    // Calculate current metrics
    const tradesToProcess = user.trades.map(trade => ({
      netPnL: trade.netPnL,
      entryDate: trade.entryDate,
      status: trade.status as 'OPEN' | 'CLOSED' | 'CANCELLED'
    }))

    const currentBalance = calculateCurrentBalance(
      user.startingBalance,
      tradesToProcess,
      user.accountStartDate
    )

    const accountHigh = Math.max(
      user.currentAccountHigh || user.startingBalance,
      getAccountHighSinceStart(user.startingBalance, tradesToProcess, user.accountStartDate)
    )

    const trailingDrawdownAmount = user.trailingDrawdownAmount || getDrawdownAmount(user.accountType)
    const dailyLossLimit = user.dailyLossLimit

    // Calculate trailing drawdown limit
    const calculatedTrailingLimit = calculateTrailingDrawdownLimit(
      accountHigh,
      trailingDrawdownAmount,
      user.startingBalance,
      user.isLiveFunded,
      user.firstPayoutReceived
    )

    // Calculate daily loss limit (if configured)
    const calculatedDailyLimit = calculateDailyLossLimit(accountHigh, dailyLossLimit)

    const netPnLToDate = currentBalance - user.startingBalance
    const dailyPnL = getTodayPnL(tradesToProcess)

    // Check compliance for both limits
    const isWithinTrailing = isWithinTrailingLimit(currentBalance, calculatedTrailingLimit)
    const isWithinDaily = isWithinDailyLimit(currentBalance, calculatedDailyLimit)

    // Calculate buffers (distance from limits)
    const trailingBuffer = currentBalance - calculatedTrailingLimit
    const dailyBuffer = calculatedDailyLimit ? currentBalance - calculatedDailyLimit : null

    // Calculate display values - show actual calculated amounts for user feedback
    const displayTrailingLimit = user.isLiveFunded && user.firstPayoutReceived 
      ? 0 
      : accountHigh - trailingDrawdownAmount

    // Detect and format broker for display
    const broker = detectBroker(user.accountType, undefined)
    const displayBroker = broker === 'TOPSTEP' ? 'Prop Firm' : broker

    return {
      currentBalance,
      accountHigh,
      calculatedTrailingLimit,
      calculatedDailyLimit,
      displayTrailingLimit, // This is what should be shown in the UI
      trailingDrawdownAmount,
      dailyLossLimit,
      netPnLToDate,
      dailyPnL,
      accountType: user.accountType,
      isWithinTrailingLimit: isWithinTrailing,
      isWithinDailyLimit: isWithinDaily,
      trailingBuffer,
      dailyBuffer,
      accountStartDate: user.accountStartDate,
      isLiveFunded: user.isLiveFunded,
      firstPayoutReceived: user.firstPayoutReceived,
      broker: displayBroker
    }
  } catch (error) {
    console.error('Error calculating account metrics:', error)
    return null
  }
}

/**
 * Perform end-of-day calculation and update account high if needed
 */
export async function performEodCalculation(userId: string): Promise<void> {
  try {
    const metrics = await getAccountMetrics(userId)
    if (!metrics) return

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentAccountHigh: true, startingBalance: true }
    })

    if (!user) return

    // Update account high if current balance is higher
    if (metrics.currentBalance > (user.currentAccountHigh || user.startingBalance || 0)) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          currentAccountHigh: metrics.currentBalance,
          lastEodCalculation: new Date()
        }
      })
    }

    // Create or update daily snapshot
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.dailyAccountSnapshot.upsert({
      where: {
        userId_date: {
          userId,
          date: today
        }
      },
      update: {
        endOfDayBalance: metrics.currentBalance,
        accountHigh: metrics.accountHigh,
        calculatedMLL: metrics.calculatedTrailingLimit,
        netPnLToDate: metrics.netPnLToDate,
        dailyPnL: metrics.dailyPnL,
        tradesCount: metrics.dailyPnL !== 0 ? 1 : 0 // Simplified count
      },
      create: {
        userId,
        date: today,
        endOfDayBalance: metrics.currentBalance,
        accountHigh: metrics.accountHigh,
        calculatedMLL: metrics.calculatedTrailingLimit,
        netPnLToDate: metrics.netPnLToDate,
        dailyPnL: metrics.dailyPnL,
        tradesCount: metrics.dailyPnL !== 0 ? 1 : 0
      }
    })
  } catch (error) {
    console.error('Error performing EOD calculation:', error)
  }
}

/**
 * Get historical account snapshots for a user
 */
export async function getAccountHistory(
  userId: string,
  days: number = 30
): Promise<any[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  return await prisma.dailyAccountSnapshot.findMany({
    where: {
      userId,
      date: {
        gte: startDate
      }
    },
    orderBy: {
      date: 'asc'
    }
  })
}

/**
 * Get comprehensive account metrics with fee transparency for a user
 */
export async function getAccountMetricsWithFees(userId: string): Promise<AccountMetricsWithFees | null> {
  try {
    // Get base metrics first
    const baseMetrics = await getAccountMetrics(userId)
    if (!baseMetrics) return null

    // Get user account settings for broker detection
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        accountType: true,
        trades: {
          select: {
            netPnL: true,
            grossPnL: true,
            commission: true,
            entryFees: true,
            exitFees: true,
            entryDate: true,
            status: true,
            symbol: true
          }
        }
      }
    })

    if (!user) return null

    // Detect broker from account type
    const broker = detectBroker(user.accountType, undefined)

    // Calculate fee-related metrics
    const allTrades = user.trades.filter(trade => trade.status === 'CLOSED')
    const totalFeesToDate = allTrades.reduce((sum, trade) => {
      const commission = trade.commission || 0
      const entryFees = trade.entryFees || 0
      const exitFees = trade.exitFees || 0
      return sum + commission + entryFees + exitFees
    }, 0)

    // Calculate today's fees
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayTrades = allTrades.filter(trade => {
      const tradeDate = new Date(trade.entryDate)
      return tradeDate >= today && tradeDate < tomorrow
    })

    const dailyFees = todayTrades.reduce((sum, trade) => {
      const commission = trade.commission || 0
      const entryFees = trade.entryFees || 0
      const exitFees = trade.exitFees || 0
      return sum + commission + entryFees + exitFees
    }, 0)

    // Calculate gross P&L (before fees)
    const grossPnLToDate = allTrades.reduce((sum, trade) => sum + (trade.grossPnL || trade.netPnL || 0), 0)
    const grossDailyPnL = todayTrades.reduce((sum, trade) => sum + (trade.grossPnL || trade.netPnL || 0), 0)

    // Calculate fee impact percentage
    const feeImpactPercentage = grossPnLToDate > 0 ? (totalFeesToDate / grossPnLToDate) * 100 : 0

    // Calculate average fee per trade
    const averageFeePerTrade = allTrades.length > 0 ? totalFeesToDate / allTrades.length : 0

    // Simple balance validation - consider balance validated if we have recent trades with proper calculations
    const balanceValidated = allTrades.length > 0 && baseMetrics.currentBalance > 0
    const lastValidationDate = allTrades.length > 0 ? new Date() : null

    return {
      ...baseMetrics,
      broker: broker === 'TOPSTEP' ? 'Prop Firm' : broker,
      totalFeesToDate,
      dailyFees,
      grossPnLToDate,
      grossDailyPnL,
      feeImpactPercentage,
      averageFeePerTrade,
      balanceValidated,
      lastValidationDate
    }
  } catch (error) {
    console.error('Error calculating account metrics with fees:', error)
    return null
  }
}

/**
 * Validate account configuration
 */
export function validateAccountConfig(
  accountType: AccountType,
  startingBalance: number,
  trailingDrawdownAmount: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validate evaluation account configurations
  if (accountType === 'EVALUATION_50K' || accountType === 'EVALUATION_100K' || accountType === 'EVALUATION_150K') {
    const expectedBalance = getStartingBalance(accountType)
    const expectedDrawdown = getDrawdownAmount(accountType)

    if (startingBalance !== expectedBalance) {
      errors.push(`${accountType} accounts must have a starting balance of $${expectedBalance.toLocaleString()}`)
    }

    if (trailingDrawdownAmount !== expectedDrawdown) {
      errors.push(`${accountType} accounts must have a trailing drawdown of $${expectedDrawdown.toLocaleString()}`)
    }
  }

  // Validate that starting balance is positive
  if (startingBalance <= 0) {
    errors.push('Starting balance must be greater than 0')
  }

  // Validate that trailing drawdown is reasonable
  if (trailingDrawdownAmount < 0) {
    errors.push('Trailing drawdown amount cannot be negative')
  }

  if (trailingDrawdownAmount >= startingBalance) {
    errors.push('Trailing drawdown amount cannot be greater than or equal to starting balance')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}