// TopStep Trade Report data from screenshot (reading carefully)
// Reading Net P&L column (4th column) from the visible dates

const topstepDailyData = [
  // Date, Net P&L (from screenshot)
  { date: 'Jul 24', netPnL: -106.22 },
  { date: 'Jul 22', netPnL: 595.98 },  
  { date: 'Jul 21', netPnL: 319.84 },
  { date: 'Jul 18', netPnL: 197.32 },
  { date: 'Jul 17', netPnL: 3.82 },
  { date: 'Jul 15', netPnL: -226.02 },
  { date: 'Jul 14', netPnL: 80.02 },
  { date: 'Jul 11', netPnL: 17.32 },
  { date: 'Jul 10', netPnL: 88.38 },
  { date: 'Jul 8', netPnL: 116.14 },
  { date: 'Jul 7', netPnL: -83.18 }
]

console.log('🔍 TOPSTEP ANALYSIS FROM SCREENSHOT')
console.log('===================================\n')

console.log('TOPSTEP DAILY P&L:')
console.log('==================')

let topstepTotal = 0
topstepDailyData.forEach(day => {
  console.log(`${day.date}: $${day.netPnL.toFixed(2)}`)
  topstepTotal += day.netPnL
})

console.log(`\nTopStep Total: $${topstepTotal.toFixed(2)}`)
console.log(`Expected Total: $1177.92`)
console.log(`Difference: $${(topstepTotal - 1177.92).toFixed(2)}`)

// Now check if there are dates missing or additional data needed
const fs = require('fs')
const julyCsvFile = 'c:/Users/nftmi/OneDrive/Desktop/TRADING/PerformanceJULY2025/JULY_AS_OF_25th_Performance.csv'

function parsePnL(pnlString) {
  if (!pnlString || pnlString === '') return 0
  const cleanString = pnlString.replace(/[$()]/g, '')
  const value = parseFloat(cleanString)
  const isNegative = pnlString.includes('$(')
  return isNegative ? -Math.abs(value) : value
}

function parseTimestamp(timestampString) {
  const [datePart, timePart] = timestampString.split(' ')
  const [month, day, year] = datePart.split('/')
  return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)))
}

console.log('\n📊 CSV DAILY BREAKDOWN:')
console.log('======================')

const csvContent = fs.readFileSync(julyCsvFile, 'utf8')
const lines = csvContent.split(/\r?\n/).filter(line => line.trim())

// Group CSV trades by date
const csvByDate = {}
let csvTotal = 0

for (let i = 1; i < lines.length; i++) {
  const values = lines[i].split(',')
  if (values.length < 10) continue

  const tradeDate = parseTimestamp(values[10])
  const dateKey = `Jul ${tradeDate.getDate()}`
  const csvPnL = parsePnL(values[9])
  
  if (!csvByDate[dateKey]) {
    csvByDate[dateKey] = { total: 0, trades: 0 }
  }
  
  csvByDate[dateKey].total += csvPnL
  csvByDate[dateKey].trades++
  csvTotal += csvPnL
}

// Display CSV daily totals
Object.keys(csvByDate).sort((a, b) => {
  const aDay = parseInt(a.split(' ')[1])
  const bDay = parseInt(b.split(' ')[1])
  return aDay - bDay
}).forEach(date => {
  const data = csvByDate[date]
  console.log(`${date}: $${data.total.toFixed(2)} (${data.trades} trades)`)
})

console.log(`\nCSV Total: $${csvTotal.toFixed(2)}`)

console.log('\n🎯 DATE-BY-DATE COMPARISON:')
console.log('============================')

// Compare each date
topstepDailyData.forEach(topstepDay => {
  const csvDay = csvByDate[topstepDay.date]
  if (csvDay) {
    const diff = csvDay.total - topstepDay.netPnL
    console.log(`${topstepDay.date}: TopStep $${topstepDay.netPnL.toFixed(2)} vs CSV $${csvDay.total.toFixed(2)} = Diff: $${diff.toFixed(2)}`)
  } else {
    console.log(`${topstepDay.date}: TopStep $${topstepDay.netPnL.toFixed(2)} vs CSV: NO DATA`)
  }
})

// Check for CSV dates not in TopStep
Object.keys(csvByDate).forEach(csvDate => {
  const foundInTopStep = topstepDailyData.find(ts => ts.date === csvDate)
  if (!foundInTopStep) {
    console.log(`${csvDate}: CSV $${csvByDate[csvDate].total.toFixed(2)} vs TopStep: NO DATA`)
  }
})