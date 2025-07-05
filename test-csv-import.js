// Test script to validate CSV import logic
const testCsvData = [
  ['Symbol', 'Qty', 'Buy Price', 'Buy Time', 'Duration', 'Sell Time', 'Sell Price', 'P&L'],
  ['MNQZ24', '2', '18500.25', '2024-01-15 09:30:00', '60000', '2024-01-15 09:31:00', '18505.75', '11.00'],
  ['ESZ24', '1', '4500.50', '2024-01-15 10:00:00', '120000', '2024-01-15 10:02:00', '4502.25', '1.75']
];

function findColumnValue(row, headers, possibleNames) {
  for (const name of possibleNames) {
    // Try exact match first
    let index = headers.findIndex(h => h.toLowerCase() === name.toLowerCase());
    if (index === -1) {
      // Try partial match (case insensitive)
      index = headers.findIndex(h => 
        h.toLowerCase().includes(name.toLowerCase()) || 
        name.toLowerCase().includes(h.toLowerCase())
      );
    }
    if (index !== -1 && row[index] !== undefined && row[index] !== null && row[index] !== '') {
      const value = row[index].toString().trim();
      console.log(`Found value "${value}" for column "${name}" at index ${index}`);
      return value;
    }
  }
  console.log(`No value found for any of: ${possibleNames.join(', ')}`);
  return '';
}

function parseTradeData(data) {
  const headers = data[0].map(h => h.toLowerCase().trim());
  const rows = data.slice(1);
  
  console.log('Headers:', headers);
  
  return rows.map((row, index) => {
    console.log(`\nProcessing row ${index + 1}:`, row);
    
    const trade = {
      symbol: '',
      side: 'LONG',
      entryDate: '',
      entryPrice: 0,
      quantity: 0,
      exitDate: '',
      exitPrice: 0,
      market: 'FUTURES',
      isValid: true,
      errors: []
    };

    // Parse using your exact column names
    trade.symbol = findColumnValue(row, headers, ['symbol']);
    
    const buyPrice = parseFloat(findColumnValue(row, headers, ['buy price']) || '0');
    const sellPrice = parseFloat(findColumnValue(row, headers, ['sell price']) || '0');
    const quantity = Math.abs(parseFloat(findColumnValue(row, headers, ['qty']) || '0'));
    const buyTime = findColumnValue(row, headers, ['buy time']);
    const sellTime = findColumnValue(row, headers, ['sell time']);
    
    console.log('Parsed values:', { buyPrice, sellPrice, quantity, buyTime, sellTime });
    
    // Determine trade direction and set entry/exit
    if (buyTime && sellTime) {
      const buyDate = new Date(buyTime);
      const sellDate = new Date(sellTime);
      
      if (buyDate < sellDate) {
        // Long trade: bought first, then sold
        trade.side = 'LONG';
        trade.entryDate = buyDate.toISOString();
        trade.entryPrice = buyPrice;
        trade.exitDate = sellDate.toISOString();
        trade.exitPrice = sellPrice;
      } else {
        // Short trade: sold first, then bought
        trade.side = 'SHORT';
        trade.entryDate = sellDate.toISOString();
        trade.entryPrice = sellPrice;
        trade.exitDate = buyDate.toISOString();
        trade.exitPrice = buyPrice;
      }
    }
    
    trade.quantity = quantity;
    
    // Validation
    if (!trade.symbol) trade.errors.push('Missing symbol');
    if (!trade.entryDate) trade.errors.push('Missing entry date');
    if (!trade.entryPrice || trade.entryPrice <= 0) trade.errors.push('Invalid entry price');
    if (!trade.quantity || trade.quantity <= 0) trade.errors.push('Invalid quantity');
    if (!trade.exitDate) trade.errors.push('Missing exit date');
    if (!trade.exitPrice || trade.exitPrice <= 0) trade.errors.push('Invalid exit price');
    
    trade.isValid = trade.errors.length === 0;
    
    console.log('Final trade:', trade);
    return trade;
  });
}

// Test the parsing
console.log('Testing CSV import logic...\n');
const parsedTrades = parseTradeData(testCsvData);

console.log('\n=== FINAL RESULTS ===');
parsedTrades.forEach((trade, i) => {
  console.log(`\nTrade ${i + 1}:`);
  console.log(`  Symbol: ${trade.symbol}`);
  console.log(`  Side: ${trade.side}`);
  console.log(`  Entry: ${trade.entryDate} @ $${trade.entryPrice}`);
  console.log(`  Exit: ${trade.exitDate} @ $${trade.exitPrice}`);
  console.log(`  Quantity: ${trade.quantity}`);
  console.log(`  Valid: ${trade.isValid}`);
  if (trade.errors.length > 0) {
    console.log(`  Errors: ${trade.errors.join(', ')}`);
  }
});