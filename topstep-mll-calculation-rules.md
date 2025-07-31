# TopStep Maximum Loss Limit (MLL) Calculation Rules

## Official Documentation Reference
Source: https://intercom.help/topstep-llc/en/articles/8284204-what-is-the-maximum-loss-limit

## Account Types and Initial MLL Values

### Initial Maximum Loss Limits by Account Size:
- **$50K Account**: $2,000 MLL
- **$100K Account**: $3,000 MLL  
- **$150K Account**: $4,500 MLL

## MLL Calculation Methodology

### Core Calculation Rule:
**MLL = Starting Balance - Account High + Initial MLL Amount**

### Example Calculation:
- Starting Balance: $50,000
- Initial MLL: $2,000
- If trader makes $500 profit on first day (new account high: $50,500)
- **New MLL = $50,000 - $50,500 + $2,000 = $48,500**

### Key Calculation Points:

1. **End-of-Day Calculation**: MLL is calculated and set at the end of each trading day
2. **Account High Tracking**: Based on the highest account balance reached at end of trading day
3. **Trailing Mechanism**: As account high increases, MLL decreases proportionally
4. **Floor Protection**: Once MLL reaches the starting balance, it stops changing (cannot go below starting balance)

## MLL Lifecycle States

### Phase 1: Active Trailing (Pre-Payout)
- MLL adjusts daily based on account high
- Formula: `Starting Balance - Account High + Initial MLL`
- Continues until first payout received

### Phase 2: Post-First-Payout
- **MLL permanently set to $0** after first payout
- No further adjustments regardless of performance
- Entire remaining account balance becomes maximum loss potential

## Violation and Enforcement Rules

### Violation Trigger:
- Account closed immediately if Net P&L hits or exceeds MLL during trading day
- Applies to **all account types**: Trading Combines, Express Funded, Live Funded

### Consequences:
1. **Immediate Liquidation**: All positions automatically closed
2. **Order Rejection**: New orders rejected after MLL hit
3. **Account Ineligibility**: Account ineligible for funding until reset

## Implementation Requirements for Trading Journal

### Data Tracking Needed:
1. **Starting Balance**: Initial account balance (never changes)
2. **Current Account High**: Highest end-of-day balance achieved
3. **Initial MLL Amount**: Based on account size ($2K, $3K, or $4.5K)
4. **First Payout Status**: Boolean flag for payout received
5. **Account Type**: 50K, 100K, or 150K designation

### Calculation Logic:
```javascript
function calculateTopStepMLL(accountData) {
  const { startingBalance, accountHigh, initialMLL, firstPayoutReceived } = accountData;
  
  // Post-payout: MLL is always $0
  if (firstPayoutReceived) {
    return 0;
  }
  
  // Pre-payout: Trailing calculation
  const calculatedMLL = startingBalance - accountHigh + initialMLL;
  
  // Floor protection: MLL cannot go below starting balance
  return Math.max(calculatedMLL, startingBalance);
}
```

### Daily Update Process:
1. **End of Trading Day**: Update account high if current balance > previous high
2. **Recalculate MLL**: Apply formula if no payout received yet
3. **Store Snapshot**: Save daily account snapshot for tracking

## Validation Examples

### Example 1: $50K Account, Day 1 Profit
- Starting Balance: $50,000
- Account High: $50,500 (made $500)
- Initial MLL: $2,000
- **Calculated MLL**: $50,000 - $50,500 + $2,000 = **$48,500** ✓

### Example 2: $100K Account, $5K Profit  
- Starting Balance: $100,000
- Account High: $105,000 (made $5,000)
- Initial MLL: $3,000
- **Calculated MLL**: $100,000 - $105,000 + $3,000 = **$98,000** ✓

### Example 3: Post-Payout (Any Account)
- Any starting balance and profit
- First payout received: true
- **Calculated MLL**: **$0** (regardless of other factors) ✓

## Error Prevention Checklist

### Common Calculation Errors to Avoid:
1. ❌ Using current balance instead of account high
2. ❌ Calculating MLL during trading day instead of end-of-day
3. ❌ Continuing to adjust MLL after first payout
4. ❌ Allowing MLL to go below starting balance
5. ❌ Using wrong initial MLL amounts for account sizes

### Validation Points:
- MLL should decrease as profits increase (pre-payout)
- MLL should never be less than starting balance (pre-payout)
- MLL should always be $0 (post-payout)
- Account high should only update at end-of-day with higher balances

## Integration Notes for Other Prop Firms

This calculation method is **specific to TopStep**. Other prop firms may have different rules:
- Different initial MLL amounts
- Different trailing mechanisms
- Different post-payout behavior
- Different violation consequences

Always reference firm-specific documentation when implementing trailing drawdown calculations for other brokers.