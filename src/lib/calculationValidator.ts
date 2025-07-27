import { prisma } from '@/lib/prisma'
import { roundCurrency, validateBalanceConsistency } from '@/lib/utils'
import { getAccountMetrics } from '@/lib/trailingDrawdown'
import { calculateTradeFees, detectBroker } from '@/lib/contractSpecs'

export interface ValidationReport {
  userId: string
  timestamp: Date
  overallStatus: 'VALID' | 'WARNING' | 'ERROR'
  checks: ValidationCheck[]
  summary: {
    totalChecks: number
    passedChecks: number
    warningChecks: number
    failedChecks: number
  }
}

export interface ValidationCheck {
  type: 'P&L_CONSISTENCY' | 'BALANCE_CONSISTENCY' | 'FEE_CONSISTENCY' | 'DRAWDOWN_CONSISTENCY' | 'DATA_INTEGRITY'
  status: 'PASS' | 'WARNING' | 'FAIL'
  description: string
  details?: string
  expectedValue?: number
  actualValue?: number
  tolerance?: number
}

/**
 * Comprehensive validation system for all calculations
 */
export class CalculationValidator {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Run all validation checks for a user
   */
  async runFullValidation(): Promise<ValidationReport> {
    const checks: ValidationCheck[] = []
    const timestamp = new Date()

    try {
      // 1. P&L Consistency Check
      const pnlChecks = await this.validatePnLConsistency()
      checks.push(...pnlChecks)

      // 2. Balance Consistency Check
      const balanceChecks = await this.validateBalanceConsistency()
      checks.push(...balanceChecks)

      // 3. Fee Consistency Check
      const feeChecks = await this.validateFeeConsistency()
      checks.push(...feeChecks)

      // 4. Trailing Drawdown Consistency Check
      const drawdownChecks = await this.validateDrawdownConsistency()
      checks.push(...drawdownChecks)

      // 5. Data Integrity Check
      const integrityChecks = await this.validateDataIntegrity()
      checks.push(...integrityChecks)

    } catch (error) {
      checks.push({
        type: 'DATA_INTEGRITY',
        status: 'FAIL',
        description: 'Failed to run validation checks',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Calculate summary
    const summary = {
      totalChecks: checks.length,
      passedChecks: checks.filter(c => c.status === 'PASS').length,
      warningChecks: checks.filter(c => c.status === 'WARNING').length,
      failedChecks: checks.filter(c => c.status === 'FAIL').length
    }

    // Determine overall status
    let overallStatus: 'VALID' | 'WARNING' | 'ERROR' = 'VALID'
    if (summary.failedChecks > 0) {
      overallStatus = 'ERROR'
    } else if (summary.warningChecks > 0) {
      overallStatus = 'WARNING'
    }

    return {
      userId: this.userId,
      timestamp,
      overallStatus,
      checks,
      summary
    }
  }

  /**
   * Validate P&L calculations for all trades
   */
  private async validatePnLConsistency(): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = []

    try {
      const trades = await prisma.trade.findMany({
        where: { 
          userId: this.userId,
          status: 'CLOSED',
          grossPnL: { not: null },
          netPnL: { not: null }
        },
        select: {
          id: true,
          grossPnL: true,
          netPnL: true,
          commission: true,
          entryFees: true,
          exitFees: true,
          swap: true
        }
      })

      let inconsistentTrades = 0
      const tolerance = 0.01

      for (const trade of trades) {
        const totalFees = (trade.commission || 0) + (trade.entryFees || 0) + (trade.exitFees || 0) + (trade.swap || 0)
        const expectedNetPnL = roundCurrency((trade.grossPnL || 0) - totalFees)
        const actualNetPnL = roundCurrency(trade.netPnL || 0)
        const difference = Math.abs(expectedNetPnL - actualNetPnL)

        if (difference > tolerance) {
          inconsistentTrades++
        }
      }

      if (inconsistentTrades === 0) {
        checks.push({
          type: 'P&L_CONSISTENCY',
          status: 'PASS',
          description: `All ${trades.length} closed trades have consistent P&L calculations`
        })
      } else {
        checks.push({
          type: 'P&L_CONSISTENCY',
          status: 'FAIL',
          description: `${inconsistentTrades} out of ${trades.length} trades have P&L calculation inconsistencies`,
          details: `Trades where NetPnL ≠ GrossPnL - Fees (tolerance: $${tolerance})`
        })
      }

    } catch (error) {
      checks.push({
        type: 'P&L_CONSISTENCY',
        status: 'FAIL',
        description: 'Failed to validate P&L consistency',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    return checks
  }

  /**
   * Validate balance calculations against account metrics
   */
  private async validateBalanceConsistency(): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = []

    try {
      const accountMetrics = await getAccountMetrics(this.userId)
      if (!accountMetrics) {
        checks.push({
          type: 'BALANCE_CONSISTENCY',
          status: 'WARNING',
          description: 'No account metrics available for balance validation'
        })
        return checks
      }

      const user = await prisma.user.findUnique({
        where: { id: this.userId },
        select: { startingBalance: true }
      })

      if (!user?.startingBalance) {
        checks.push({
          type: 'BALANCE_CONSISTENCY',
          status: 'WARNING',
          description: 'No starting balance configured for balance validation'
        })
        return checks
      }

      // Calculate balance from trades
      const trades = await prisma.trade.findMany({
        where: { userId: this.userId, status: 'CLOSED' },
        select: { netPnL: true }
      })

      const calculatedBalance = user.startingBalance + trades.reduce((sum, trade) => sum + (trade.netPnL || 0), 0)
      const roundedCalculatedBalance = roundCurrency(calculatedBalance)

      const validation = validateBalanceConsistency(roundedCalculatedBalance, accountMetrics.currentBalance, 0.01)

      if (validation.isValid) {
        checks.push({
          type: 'BALANCE_CONSISTENCY',
          status: 'PASS',
          description: 'Account balance is consistent with trade calculations',
          expectedValue: roundedCalculatedBalance,
          actualValue: accountMetrics.currentBalance,
          details: validation.details
        })
      } else {
        checks.push({
          type: 'BALANCE_CONSISTENCY',
          status: 'FAIL',
          description: 'Account balance inconsistent with trade calculations',
          expectedValue: roundedCalculatedBalance,
          actualValue: accountMetrics.currentBalance,
          details: validation.details,
          tolerance: 0.01
        })
      }

    } catch (error) {
      checks.push({
        type: 'BALANCE_CONSISTENCY',
        status: 'FAIL',
        description: 'Failed to validate balance consistency',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    return checks
  }

  /**
   * Validate fee calculations for futures trades
   */
  private async validateFeeConsistency(): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = []

    try {
      const futuresTrades = await prisma.trade.findMany({
        where: { 
          userId: this.userId,
          market: 'FUTURES',
          status: 'CLOSED'
        },
        select: {
          id: true,
          symbol: true,
          quantity: true,
          commission: true,
          dataSource: true
        }
      })

      const user = await prisma.user.findUnique({
        where: { id: this.userId },
        select: { accountType: true }
      })

      let inconsistentFees = 0
      const tolerance = 0.01

      for (const trade of futuresTrades) {
        const broker = detectBroker(user?.accountType, trade.dataSource)
        const expectedFees = calculateTradeFees(trade.symbol, trade.quantity, broker)
        const actualFees = trade.commission || 0
        const difference = Math.abs(expectedFees.totalFees - actualFees)

        if (difference > tolerance) {
          inconsistentFees++
        }
      }

      if (inconsistentFees === 0) {
        checks.push({
          type: 'FEE_CONSISTENCY',
          status: 'PASS',
          description: `All ${futuresTrades.length} futures trades have consistent fee calculations`
        })
      } else {
        checks.push({
          type: 'FEE_CONSISTENCY',
          status: 'WARNING',
          description: `${inconsistentFees} out of ${futuresTrades.length} futures trades have fee calculation discrepancies`,
          details: `Manual fee overrides or broker-specific rates may differ from standard calculation`
        })
      }

    } catch (error) {
      checks.push({
        type: 'FEE_CONSISTENCY',
        status: 'FAIL',
        description: 'Failed to validate fee consistency',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    return checks
  }

  /**
   * Validate trailing drawdown calculations
   */
  private async validateDrawdownConsistency(): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = []

    try {
      const accountMetrics = await getAccountMetrics(this.userId)
      if (!accountMetrics) {
        checks.push({
          type: 'DRAWDOWN_CONSISTENCY',
          status: 'WARNING',
          description: 'No account metrics available for drawdown validation'
        })
        return checks
      }

      // Check if account high >= current balance (unless there's unrealized P&L)
      if (accountMetrics.accountHigh < accountMetrics.currentBalance) {
        checks.push({
          type: 'DRAWDOWN_CONSISTENCY',
          status: 'WARNING',
          description: 'Account high is less than current balance',
          details: 'Account high may need to be updated to reflect current balance'
        })
      }

      // Check trailing drawdown limit calculation
      const expectedTrailingLimit = accountMetrics.accountHigh - accountMetrics.trailingDrawdownAmount
      const actualTrailingLimit = accountMetrics.calculatedTrailingLimit || accountMetrics.displayTrailingLimit || 0
      const difference = Math.abs(expectedTrailingLimit - actualTrailingLimit)

      if (difference < 0.01) {
        checks.push({
          type: 'DRAWDOWN_CONSISTENCY',
          status: 'PASS',
          description: 'Trailing drawdown limit calculation is correct',
          expectedValue: expectedTrailingLimit,
          actualValue: actualTrailingLimit
        })
      } else {
        checks.push({
          type: 'DRAWDOWN_CONSISTENCY',
          status: 'FAIL',
          description: 'Trailing drawdown limit calculation is incorrect',
          expectedValue: expectedTrailingLimit,
          actualValue: actualTrailingLimit,
          details: `Expected: Account High ($${accountMetrics.accountHigh}) - Drawdown Amount ($${accountMetrics.trailingDrawdownAmount}) = $${expectedTrailingLimit}`,
          tolerance: 0.01
        })
      }

    } catch (error) {
      checks.push({
        type: 'DRAWDOWN_CONSISTENCY',
        status: 'FAIL',
        description: 'Failed to validate drawdown consistency',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    return checks
  }

  /**
   * Validate data integrity (no null/invalid values where not expected)
   */
  private async validateDataIntegrity(): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = []

    try {
      // Check for trades with invalid prices
      const invalidPriceTrades = await prisma.trade.count({
        where: {
          userId: this.userId,
          OR: [
            { entryPrice: { lte: 0 } },
            { AND: [{ exitPrice: { not: null } }, { exitPrice: { lte: 0 } }] },
            { quantity: { lte: 0 } }
          ]
        }
      })

      if (invalidPriceTrades === 0) {
        checks.push({
          type: 'DATA_INTEGRITY',
          status: 'PASS',
          description: 'All trades have valid price and quantity data'
        })
      } else {
        checks.push({
          type: 'DATA_INTEGRITY',
          status: 'FAIL',
          description: `${invalidPriceTrades} trades have invalid price or quantity data`,
          details: 'Entry price, exit price, and quantity must be positive values'
        })
      }

      // Check for closed trades missing exit data
      const incompleteClosedTrades = await prisma.trade.count({
        where: {
          userId: this.userId,
          status: 'CLOSED',
          OR: [
            { exitPrice: null },
            { exitDate: null }
          ]
        }
      })

      if (incompleteClosedTrades === 0) {
        checks.push({
          type: 'DATA_INTEGRITY',
          status: 'PASS',
          description: 'All closed trades have complete exit data'
        })
      } else {
        checks.push({
          type: 'DATA_INTEGRITY',
          status: 'WARNING',
          description: `${incompleteClosedTrades} closed trades are missing exit price or date`,
          details: 'Closed trades should have both exit price and exit date'
        })
      }

    } catch (error) {
      checks.push({
        type: 'DATA_INTEGRITY',
        status: 'FAIL',
        description: 'Failed to validate data integrity',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    return checks
  }
}

/**
 * Run validation for a specific user
 */
export async function validateUserCalculations(userId: string): Promise<ValidationReport> {
  const validator = new CalculationValidator(userId)
  return await validator.runFullValidation()
}

/**
 * Run validation for all users (admin function)
 */
export async function validateAllUserCalculations(): Promise<ValidationReport[]> {
  const users = await prisma.user.findMany({
    select: { id: true },
    where: {
      trades: {
        some: {}
      }
    }
  })

  const reports: ValidationReport[] = []
  
  for (const user of users) {
    try {
      const report = await validateUserCalculations(user.id)
      reports.push(report)
    } catch (error) {
      reports.push({
        userId: user.id,
        timestamp: new Date(),
        overallStatus: 'ERROR',
        checks: [{
          type: 'DATA_INTEGRITY',
          status: 'FAIL',
          description: 'Failed to run validation',
          details: error instanceof Error ? error.message : 'Unknown error'
        }],
        summary: {
          totalChecks: 1,
          passedChecks: 0,
          warningChecks: 0,
          failedChecks: 1
        }
      })
    }
  }

  return reports
}