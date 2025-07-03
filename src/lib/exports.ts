import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// CSV Export utilities
export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Handle values that might contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value || ''
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const exportTradesToCSV = (trades: any[]) => {
  const formattedTrades = trades.map(trade => ({
    'Date': new Date(trade.entryDate).toLocaleDateString(),
    'Symbol': trade.symbol,
    'Side': trade.side,
    'Entry Price': trade.entryPrice,
    'Quantity': trade.quantity,
    'Exit Date': trade.exitDate ? new Date(trade.exitDate).toLocaleDateString() : 'Open',
    'Exit Price': trade.exitPrice || 'N/A',
    'Net P&L': trade.netPnL || 0,
    'Return %': trade.returnPercent ? `${trade.returnPercent.toFixed(2)}%` : 'N/A',
    'Status': trade.status,
    'Market': trade.market,
    'Stop Loss': trade.stopLoss || 'N/A',
    'Take Profit': trade.takeProfit || 'N/A',
    'Strategy': trade.strategy || 'N/A',
    'Notes': trade.notes || ''
  }))

  exportToCSV(formattedTrades, `trades-${new Date().toISOString().split('T')[0]}.csv`)
}

export const exportJournalToCSV = (entries: any[]) => {
  const formattedEntries = entries.map(entry => ({
    'Date': new Date(entry.createdAt).toLocaleDateString(),
    'Title': entry.title,
    'Type': entry.entryType,
    'Content': entry.content,
    'Mood': entry.mood || 'N/A',
    'Confidence': entry.confidence || 'N/A',
    'Trade Symbol': entry.trade?.symbol || 'N/A',
    'Trade Side': entry.trade?.side || 'N/A'
  }))

  exportToCSV(formattedEntries, `journal-entries-${new Date().toISOString().split('T')[0]}.csv`)
}

// PDF Export utilities
export const exportTradesToPDF = async (trades: any[], stats: any) => {
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 20

  // Title
  pdf.setFontSize(20)
  pdf.text('Trading Report', margin, 30)

  // Date range
  pdf.setFontSize(12)
  pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, 45)

  // Summary stats
  let yPosition = 65
  pdf.setFontSize(14)
  pdf.text('Performance Summary', margin, yPosition)
  
  yPosition += 15
  pdf.setFontSize(10)
  const summaryData = [
    `Total Trades: ${stats.totalTrades}`,
    `Total P&L: $${stats.totalPnL.toFixed(2)}`,
    `Win Rate: ${stats.winRate.toFixed(1)}%`,
    `Profit Factor: ${stats.profitFactor.toFixed(2)}`,
    `Average Win: $${stats.averageWin.toFixed(2)}`,
    `Average Loss: $${Math.abs(stats.averageLoss).toFixed(2)}`
  ]

  summaryData.forEach((item, index) => {
    if (index % 2 === 0) {
      pdf.text(item, margin, yPosition)
    } else {
      pdf.text(item, pageWidth / 2, yPosition)
      yPosition += 10
    }
  })

  // Trades table
  yPosition += 20
  pdf.setFontSize(14)
  pdf.text('Trade History', margin, yPosition)
  
  yPosition += 15
  pdf.setFontSize(8)
  
  // Table headers
  const headers = ['Date', 'Symbol', 'Side', 'Entry', 'Exit', 'P&L', 'Return%']
  const colWidths = [25, 20, 15, 20, 20, 25, 20]
  let xPosition = margin

  headers.forEach((header, index) => {
    pdf.text(header, xPosition, yPosition)
    xPosition += colWidths[index]
  })

  yPosition += 8

  // Table rows
  trades.slice(0, 30).forEach((trade) => { // Limit to first 30 trades
    xPosition = margin
    const rowData = [
      new Date(trade.entryDate).toLocaleDateString(),
      trade.symbol,
      trade.side,
      `$${trade.entryPrice}`,
      trade.exitPrice ? `$${trade.exitPrice}` : 'Open',
      `$${(trade.netPnL || 0).toFixed(2)}`,
      trade.returnPercent ? `${trade.returnPercent.toFixed(1)}%` : 'N/A'
    ]

    rowData.forEach((data, index) => {
      pdf.text(data.toString(), xPosition, yPosition)
      xPosition += colWidths[index]
    })

    yPosition += 8

    // Add new page if needed
    if (yPosition > pdf.internal.pageSize.getHeight() - 30) {
      pdf.addPage()
      yPosition = 30
    }
  })

  // Save the PDF
  pdf.save(`trading-report-${new Date().toISOString().split('T')[0]}.pdf`)
}

export const exportChartToPDF = async (chartElementId: string, title: string) => {
  const chartElement = document.getElementById(chartElementId)
  if (!chartElement) return

  try {
    const canvas = await html2canvas(chartElement, {
      backgroundColor: '#ffffff',
      scale: 2
    })

    const pdf = new jsPDF()
    const imgData = canvas.toDataURL('image/png')
    const imgWidth = 180
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    pdf.setFontSize(16)
    pdf.text(title, 20, 20)
    pdf.addImage(imgData, 'PNG', 15, 30, imgWidth, imgHeight)
    
    pdf.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`)
  } catch (error) {
    console.error('Error exporting chart to PDF:', error)
  }
}

// Performance report with charts
export const exportPerformanceReport = async (trades: any[], stats: any, performanceData: any[]) => {
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 20

  // Title page
  pdf.setFontSize(24)
  pdf.text('Trading Performance Report', margin, 40)
  
  pdf.setFontSize(12)
  pdf.text(`Report Period: ${performanceData.length > 0 ? 
    `${performanceData[0].date} - ${performanceData[performanceData.length - 1].date}` : 
    'Current Period'}`, margin, 60)
  pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, 75)

  // Performance Summary
  pdf.setFontSize(18)
  pdf.text('Performance Summary', margin, 100)
  
  let yPos = 120
  pdf.setFontSize(12)
  
  const performanceMetrics = [
    ['Total Trades', stats.totalTrades.toString()],
    ['Win Rate', `${stats.winRate.toFixed(1)}%`],
    ['Total P&L', `$${stats.totalPnL.toFixed(2)}`],
    ['Profit Factor', stats.profitFactor.toFixed(2)],
    ['Average Win', `$${stats.averageWin.toFixed(2)}`],
    ['Average Loss', `$${Math.abs(stats.averageLoss).toFixed(2)}`],
    ['Best Trade', `$${Math.max(...trades.map(t => t.netPnL || 0)).toFixed(2)}`],
    ['Worst Trade', `$${Math.min(...trades.map(t => t.netPnL || 0)).toFixed(2)}`]
  ]

  performanceMetrics.forEach(([label, value], index) => {
    const col = index % 2
    const row = Math.floor(index / 2)
    pdf.text(`${label}:`, margin + col * 90, yPos + row * 15)
    pdf.text(value, margin + col * 90 + 60, yPos + row * 15)
  })

  // Monthly breakdown
  pdf.addPage()
  pdf.setFontSize(18)
  pdf.text('Monthly Performance', margin, 30)
  
  yPos = 50
  pdf.setFontSize(10)
  pdf.text('Month', margin, yPos)
  pdf.text('Trades', margin + 40, yPos)
  pdf.text('P&L', margin + 70, yPos)
  pdf.text('Return %', margin + 110, yPos)
  
  yPos += 15
  performanceData.forEach((month) => {
    const returnPercent = month.balance > 0 ? ((month.pnl / (month.balance - month.pnl)) * 100) : 0
    pdf.text(month.date, margin, yPos)
    pdf.text(month.trades.toString(), margin + 40, yPos)
    pdf.text(`$${month.pnl.toFixed(2)}`, margin + 70, yPos)
    pdf.text(`${returnPercent.toFixed(1)}%`, margin + 110, yPos)
    yPos += 12
    
    if (yPos > 250) {
      pdf.addPage()
      yPos = 30
    }
  })

  pdf.save(`performance-report-${new Date().toISOString().split('T')[0]}.pdf`)
}