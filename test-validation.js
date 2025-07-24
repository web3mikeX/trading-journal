const { validateAccountBalance } = require('./src/lib/validation.ts')

async function testValidation() {
  try {
    console.log('🔍 Testing Account Balance Validation...\n')
    
    const userId = 'cmcwu8b5m0001m17ilm0triy8'
    const expectedTopStepBalance = 51284.14
    
    const result = await validateAccountBalance(userId, expectedTopStepBalance)
    
    console.log('📊 Validation Results:')
    console.log(`  Is Valid: ${result.isValid ? '✅' : '❌'}`)
    console.log(`  Calculated Balance: $${result.calculatedBalance.toFixed(2)}`)
    console.log(`  Expected Balance: $${result.expectedBalance?.toFixed(2)}`)
    console.log(`  Difference: $${result.difference?.toFixed(2)}`)
    
    if (result.warnings.length > 0) {
      console.log('\n⚠️ Warnings:')
      result.warnings.forEach(warning => console.log(`  - ${warning}`))
    }
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors:')
      result.errors.forEach(error => console.log(`  - ${error}`))
    }
    
    if (result.isValid) {
      console.log('\n✅ Account balance validation PASSED!')
    } else {
      console.log('\n❌ Account balance validation FAILED!')
    }
    
  } catch (error) {
    console.error('Error running validation test:', error)
  }
}

testValidation()