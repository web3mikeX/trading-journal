/**
 * Broker-specific MLL calculation rules
 * Each broker may have different formulas and requirements
 */

export interface BrokerMllRule {
  brokerName: string
  calculationMethod: 'topstep' | 'generic_trailing' | 'static' | 'custom'
  formula: string
  description: string
  postPayoutBehavior: 'reset_to_zero' | 'continue_trailing' | 'static'
  hasEndOfDayCalculation: boolean
  hasFloorProtection: boolean
  floorProtectionLevel: 'starting_balance' | 'minimum_balance' | 'none'
}

export const BROKER_MLL_RULES: Record<string, BrokerMllRule> = {
  TOPSTEP: {
    brokerName: 'TopStep',
    calculationMethod: 'topstep',
    formula: 'MLL = max(StartingBalance - AccountHigh + InitialMLL, StartingBalance)',
    description: 'TopStep uses a trailing drawdown that decreases as account high increases, with floor protection at starting balance',
    postPayoutBehavior: 'reset_to_zero',
    hasEndOfDayCalculation: true,
    hasFloorProtection: true,
    floorProtectionLevel: 'starting_balance'
  },
  
  FTMO: {
    brokerName: 'FTMO',
    calculationMethod: 'generic_trailing',
    formula: 'MLL = AccountHigh - FixedDrawdownAmount',
    description: 'FTMO uses a simple trailing drawdown without floor protection',
    postPayoutBehavior: 'continue_trailing',
    hasEndOfDayCalculation: false,
    hasFloorProtection: false,
    floorProtectionLevel: 'none'
  },
  
  MY_FOREX_FUNDS: {
    brokerName: 'MyForexFunds',
    calculationMethod: 'generic_trailing',
    formula: 'MLL = AccountHigh - FixedDrawdownAmount',
    description: 'MyForexFunds uses standard trailing drawdown',
    postPayoutBehavior: 'continue_trailing',
    hasEndOfDayCalculation: false,
    hasFloorProtection: true,
    floorProtectionLevel: 'starting_balance'
  },
  
  APEX_TRADER_FUNDING: {
    brokerName: 'Apex Trader Funding',
    calculationMethod: 'generic_trailing',
    formula: 'MLL = AccountHigh - FixedDrawdownAmount',
    description: 'Apex uses standard trailing drawdown with some variations',
    postPayoutBehavior: 'continue_trailing',
    hasEndOfDayCalculation: false,
    hasFloorProtection: true,
    floorProtectionLevel: 'starting_balance'
  },
  
  GENERIC: {
    brokerName: 'Generic',
    calculationMethod: 'generic_trailing',
    formula: 'MLL = AccountHigh - FixedDrawdownAmount',
    description: 'Standard trailing drawdown calculation for most brokers',
    postPayoutBehavior: 'continue_trailing',
    hasEndOfDayCalculation: false,
    hasFloorProtection: true,
    floorProtectionLevel: 'starting_balance'
  }
}

/**
 * Calculate MLL based on broker-specific rules
 */
export function calculateBrokerSpecificMLL(
  brokerType: string,
  accountHigh: number,
  trailingDrawdownAmount: number,
  startingBalance: number,
  isLiveFunded: boolean,
  firstPayoutReceived: boolean
): number {
  const rule = BROKER_MLL_RULES[brokerType] || BROKER_MLL_RULES.GENERIC
  
  // Handle post-payout behavior
  if (isLiveFunded && firstPayoutReceived && rule.postPayoutBehavior === 'reset_to_zero') {
    return 0
  }
  
  let calculatedMLL: number
  
  switch (rule.calculationMethod) {
    case 'topstep':
      // TopStep formula: MLL = Starting Balance - Account High + Initial MLL
      calculatedMLL = startingBalance - accountHigh + trailingDrawdownAmount
      break
      
    case 'generic_trailing':
    default:
      // Standard trailing: MLL = Account High - Fixed Drawdown Amount
      calculatedMLL = accountHigh - trailingDrawdownAmount
      break
  }
  
  // Apply floor protection if enabled
  if (rule.hasFloorProtection) {
    switch (rule.floorProtectionLevel) {
      case 'starting_balance':
        return Math.max(calculatedMLL, startingBalance)
      case 'minimum_balance':
        // Could be customized per broker
        return Math.max(calculatedMLL, startingBalance * 0.5)
      case 'none':
      default:
        return calculatedMLL
    }
  }
  
  return calculatedMLL
}

/**
 * Get broker rule information
 */
export function getBrokerRule(brokerType: string): BrokerMllRule {
  return BROKER_MLL_RULES[brokerType] || BROKER_MLL_RULES.GENERIC
}

/**
 * Validate broker MLL calculation
 */
export function validateBrokerMLL(
  brokerType: string,
  startingBalance: number,
  accountHigh: number,
  trailingDrawdownAmount: number,
  isLiveFunded: boolean,
  firstPayoutReceived: boolean
): { 
  calculatedMLL: number
  rule: BrokerMllRule
  isValid: boolean
  warnings: string[]
} {
  const rule = getBrokerRule(brokerType)
  const calculatedMLL = calculateBrokerSpecificMLL(
    brokerType,
    accountHigh,
    trailingDrawdownAmount,
    startingBalance,
    isLiveFunded,
    firstPayoutReceived
  )
  
  const warnings: string[] = []
  
  // Validate TopStep specific examples
  if (brokerType === 'TOPSTEP') {
    if (startingBalance === 50000 && accountHigh === 50500 && trailingDrawdownAmount === 2000) {
      if (calculatedMLL !== 48500) {
        warnings.push(`TopStep $50K example should calculate to $48,500 but got $${calculatedMLL.toLocaleString()}`)
      }
    }
  }
  
  // General validations
  if (accountHigh < startingBalance) {
    warnings.push('Account high is below starting balance - this may indicate data issues')
  }
  
  if (calculatedMLL > startingBalance && rule.hasFloorProtection) {
    warnings.push('Calculated MLL is above starting balance despite floor protection')
  }
  
  return {
    calculatedMLL,
    rule,
    isValid: warnings.length === 0,
    warnings
  }
}

/**
 * Get available broker types
 */
export function getAvailableBrokers(): string[] {
  return Object.keys(BROKER_MLL_RULES)
}