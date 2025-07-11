const { getCurrentWeekRange, formatWeekRange } = require('./src/lib/dateUtils.ts')

console.log('Testing week API functionality...')

try {
  const { start, end } = getCurrentWeekRange()
  const label = formatWeekRange(start, end)
  
  console.log('Current week range:')
  console.log('Start:', start.toISOString())
  console.log('End:', end.toISOString())
  console.log('Label:', label)
  
  console.log('\nTesting API response...')
  
  fetch('http://localhost:3000/api/stats?userId=cmcwu8b5m0001m17ilm0triy8')
    .then(response => response.json())
    .then(data => {
      console.log('API Response includes weekMetadata:', !!data.weekMetadata)
      if (data.weekMetadata) {
        console.log('Week metadata:', JSON.stringify(data.weekMetadata, null, 2))
      }
      console.log('Recent trades count:', data.recentTrades.length)
      console.log('Recent trades:', data.recentTrades.map(t => ({ 
        symbol: t.symbol, 
        date: t.entryDate,
        netPnL: t.netPnL 
      })))
    })
    .catch(error => console.error('Error:', error))
    
} catch (error) {
  console.error('Error testing date utils:', error)
}