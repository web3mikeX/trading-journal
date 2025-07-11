"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { motion, AnimatePresence } from "framer-motion"
import { useSession } from "next-auth/react"
import { 
  X, 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  Download,
  Loader2
} from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"
import { getThemeClasses } from "@/lib/theme"
import * as XLSX from 'xlsx'

interface ImportTradesModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

interface ParsedTrade {
  symbol: string
  side: 'LONG' | 'SHORT'
  entryDate: string
  entryPrice: number
  quantity: number
  exitDate?: string
  exitPrice?: number
  market: string
  notes?: string
  netPnL?: number
  grossPnL?: number
  returnPercent?: number
  status?: 'OPEN' | 'CLOSED' | 'CANCELLED'
  dataSource?: string
  commission?: number
  entryFees?: number
  exitFees?: number
  swap?: number
  isValid: boolean
  errors: string[]
  
  // Enhanced CSV and execution data
  rawCsvData?: string
  fillIds?: string
  executionMetadata?: string
  timingData?: string
  slippage?: number
  orderDetails?: string
  
  // Advanced performance metrics
  maxAdverseExcursion?: number
  maxFavorableExcursion?: number
  commissionPerUnit?: number
  executionDuration?: number
}

export default function ImportTradesModal({ isOpen, onClose, onImportComplete }: ImportTradesModalProps) {
  const { theme } = useTheme()
  const themeClasses = getThemeClasses(theme)
  const { data: session } = useSession()
  
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parsedTrades, setParsedTrades] = useState<ParsedTrade[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('auto')
  const [rawData, setRawData] = useState<any[][]>([])
  const [columnMapping, setColumnMapping] = useState<{[key: string]: string}>({
    symbol: '',
    side: '',
    date: '',
    price: '',
    quantity: ''
  })

  // Broker templates for different CSV formats
  const brokerTemplates = {
    auto: { name: 'Auto-detect', description: 'Automatically detect format' },
    tradovate: { name: 'Tradovate', description: 'Tradovate CSV export format' },
    robinhood: { name: 'Robinhood', description: 'Robinhood CSV export' },
    td_ameritrade: { name: 'TD Ameritrade', description: 'TD Ameritrade export' },
    interactive_brokers: { name: 'Interactive Brokers', description: 'IB export format' },
    custom: { name: 'Custom', description: 'Manual column mapping' }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0]
    if (uploadedFile) {
      setFile(uploadedFile)
      parseFile(uploadedFile)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  })

  const parseFile = async (file: File) => {
    console.log('Starting to parse file:', file.name, 'Size:', file.size, 'Type:', file.type)
    try {
      const buffer = await file.arrayBuffer()
      let data: any[][] = []

      if (file.name.endsWith('.csv')) {
        console.log('Parsing as CSV file')
        const text = new TextDecoder().decode(buffer)
        console.log('File content preview:', text.substring(0, 500))
        const lines = text.split('\n').filter(line => line.trim())
        console.log('Found', lines.length, 'lines')
        
        // Better CSV parsing to handle quoted fields
        data = lines.map(line => {
          const cells = []
          let current = ''
          let inQuotes = false
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
              cells.push(current.trim().replace(/^"|"$/g, ''))
              current = ''
            } else {
              current += char
            }
          }
          
          // Add the last cell
          cells.push(current.trim().replace(/^"|"$/g, ''))
          return cells
        })
      } else {
        console.log('Parsing as Excel file')
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      }

      console.log('Parsed data preview:', data.slice(0, 3))
      setRawData(data)
      
      if (selectedTemplate === 'custom') {
        // Go to manual mapping step
        setStep('mapping')
      } else {
        // Try automatic parsing
        console.log('Using template:', selectedTemplate)
        const trades = parseTradeData(data, selectedTemplate)
        console.log('Parsed trades:', trades.length)
        setParsedTrades(trades)
        setStep('preview')
      }
    } catch (error) {
      console.error('Error parsing file:', error)
      alert('Error parsing file. Please check the format and try again.')
    }
  }

  const parseTradeData = (data: any[][], template: string): ParsedTrade[] => {
    if (data.length < 2) return []

    const headers = data[0].map((h: string) => h.toLowerCase().trim())
    const rows = data.slice(1)
    
    // Auto-detect Tradovate format based on column names (headers are already lowercase)
    const isTradovateFormat = headers.includes('buyprice') && headers.includes('sellprice') && 
                              headers.includes('boughttimestamp') && headers.includes('soldtimestamp')
    
    // Debug: log headers to console to help with mapping
    console.log('CSV Headers found:', headers)
    console.log('Template selected:', template)
    console.log('Detected Tradovate format:', isTradovateFormat)

    return rows.map((row, index) => {
      const trade: ParsedTrade = {
        symbol: '',
        side: 'LONG',
        entryDate: '',
        entryPrice: 0,
        quantity: 0,
        market: 'FUTURES',
        isValid: true,
        errors: []
      }

      // Use Tradovate-specific parsing if detected or template is 'tradovate'
      if (template === 'tradovate' || isTradovateFormat) {
        trade.symbol = findColumnValue(row, headers, ['symbol'])
        
        // Tradovate exports completed round-trip trades with specific column names
        const buyPrice = parseFloat(findColumnValue(row, headers, ['buyprice']) || '0')
        const sellPrice = parseFloat(findColumnValue(row, headers, ['sellprice']) || '0')
        const quantity = Math.abs(parseFloat(findColumnValue(row, headers, ['qty']) || '0'))
        const buyTime = findColumnValue(row, headers, ['boughttimestamp'])
        const sellTime = findColumnValue(row, headers, ['soldtimestamp'])
        const pnlString = findColumnValue(row, headers, ['pnl'])
        const grossPnL = parsePnL(pnlString) // This is gross P&L from Tradovate
        
        // Look for commission/fee columns in Tradovate CSV
        const commission = parseFloat(findColumnValue(row, headers, ['commission', 'commissions', 'comm']) || '0')
        const fees = parseFloat(findColumnValue(row, headers, ['fees', 'fee', 'costs', 'cost']) || '0')
        const exchange_fees = parseFloat(findColumnValue(row, headers, ['exchange fee', 'exchange fees', 'exch fee']) || '0')
        const clearing_fees = parseFloat(findColumnValue(row, headers, ['clearing fee', 'clearing fees', 'clear fee']) || '0')
        const regulatory_fees = parseFloat(findColumnValue(row, headers, ['regulatory fee', 'reg fee', 'nfa fee']) || '0')
        
        // Total fees calculation - if no commission columns exist, use a standard commission estimate
        const totalFees = commission + fees + exchange_fees + clearing_fees + regulatory_fees
        const estimatedCommission = totalFees === 0 ? 1.34 : 0 // Estimate $1.34 commission for Tradovate (typical rate)
        const finalTotalFees = totalFees + estimatedCommission
        const netPnL = grossPnL - finalTotalFees
        
        console.log('Tradovate parsing debug:', {
          symbol: trade.symbol, buyPrice, sellPrice, quantity, buyTime, sellTime, 
          pnlString, grossPnL, totalFees, estimatedCommission, finalTotalFees, netPnL, commission, fees
        })
        
        // Enhanced Tradovate date parsing - handle MM/dd/yyyy HH:mm:ss format
        const parseTradovateDate = (dateStr: string): Date | null => {
          if (!dateStr) return null
          try {
            // Tradovate format: "06/09/2025 23:43:53"
            // First try direct parsing
            let date = new Date(dateStr)
            if (!isNaN(date.getTime())) {
              return date
            }
            
            // If that fails, try manual parsing for MM/dd/yyyy HH:mm:ss
            const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})/)
            if (match) {
              const [, month, day, year, hour, minute, second] = match
              date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 
                              parseInt(hour), parseInt(minute), parseInt(second))
              return !isNaN(date.getTime()) ? date : null
            }
            return null
          } catch (error) {
            console.error('Date parsing error:', error, 'for date:', dateStr)
            return null
          }
        }
        
        // Parse dates with enhanced logic
        const buyDate = parseTradovateDate(buyTime)
        const sellDate = parseTradovateDate(sellTime)
        
        console.log('Enhanced date parsing:', { 
          buyTime, sellTime, 
          buyDate: buyDate?.toISOString(), 
          sellDate: sellDate?.toISOString() 
        })
        
        // Enhanced side detection for Tradovate round-trip trades
        if (buyDate && sellDate && buyPrice > 0 && sellPrice > 0) {
          // Determine trade direction based on chronological order and P&L
          if (buyDate.getTime() < sellDate.getTime()) {
            // Buy happened first, then sell = LONG trade
            trade.side = 'LONG'
            trade.entryDate = buyDate.toISOString()
            trade.entryPrice = buyPrice
            trade.exitDate = sellDate.toISOString()
            trade.exitPrice = sellPrice
          } else if (sellDate.getTime() < buyDate.getTime()) {
            // Sell happened first, then buy back = SHORT trade
            trade.side = 'SHORT'
            trade.entryDate = sellDate.toISOString()
            trade.entryPrice = sellPrice
            trade.exitDate = buyDate.toISOString()
            trade.exitPrice = buyPrice
          } else {
            // Same timestamp - use P&L to determine direction
            // If sellPrice > buyPrice and P&L positive, likely LONG
            // If buyPrice > sellPrice and P&L positive, likely SHORT
            if (netPnL > 0) {
              trade.side = sellPrice > buyPrice ? 'LONG' : 'SHORT'
            } else {
              trade.side = sellPrice < buyPrice ? 'LONG' : 'SHORT'
            }
          }
          
          // Enhanced data capture for detailed trade analysis
          // Store raw CSV data for detailed analysis
          const rawCsvData = {
            originalRow: row,
            headers: headers,
            parsedValues: {
              symbol: trade.symbol,
              buyPrice, sellPrice, quantity, buyTime, sellTime, pnlString,
              commission, fees, exchange_fees, clearing_fees, regulatory_fees
            }
          }
          
          // Extract fill IDs if available
          const buyFillId = findColumnValue(row, headers, ['buyfillid', 'buy_fill_id', 'buyid'])
          const sellFillId = findColumnValue(row, headers, ['sellfillid', 'sell_fill_id', 'sellid'])
          const fillIds = []
          if (buyFillId) fillIds.push(buyFillId)
          if (sellFillId) fillIds.push(sellFillId)
          
          // Extract execution metadata
          const priceFormat = findColumnValue(row, headers, ['_priceformat', 'priceformat'])
          const priceFormatType = findColumnValue(row, headers, ['_priceformattype', 'priceformattype'])
          const tickSize = findColumnValue(row, headers, ['_ticksize', 'ticksize'])
          const duration = findColumnValue(row, headers, ['duration'])
          
          const executionMetadata = {
            priceFormat: priceFormat ? parseInt(priceFormat) : null,
            priceFormatType: priceFormatType ? parseInt(priceFormatType) : null,
            tickSize: tickSize ? parseFloat(tickSize) : null,
            duration: duration
          }
          
          // Calculate timing data
          const executionDuration = buyDate && sellDate ? 
            Math.abs(sellDate.getTime() - buyDate.getTime()) : null
          
          const timingData = {
            buyTimestamp: buyDate?.toISOString(),
            sellTimestamp: sellDate?.toISOString(),
            executionDuration: executionDuration,
            durationString: duration
          }
          
          // Calculate slippage (if we had market data, we could calculate this more precisely)
          // For now, we'll use a placeholder that can be enhanced later
          const slippage = null // Can be calculated if we have bid/ask data
          
          // Store enhanced data
          trade.rawCsvData = JSON.stringify(rawCsvData)
          trade.fillIds = fillIds.length > 0 ? JSON.stringify(fillIds) : undefined
          trade.executionMetadata = JSON.stringify(executionMetadata)
          trade.timingData = JSON.stringify(timingData)
          trade.slippage = slippage || undefined
          trade.executionDuration = executionDuration || undefined
          trade.commissionPerUnit = finalTotalFees > 0 ? finalTotalFees / quantity : undefined
          
          if (trade.side === 'LONG') {
            trade.entryDate = buyDate.toISOString()
            trade.entryPrice = buyPrice
            trade.exitDate = sellDate.toISOString()
            trade.exitPrice = sellPrice
          } else {
            trade.entryDate = sellDate.toISOString()
            trade.entryPrice = sellPrice
            trade.exitDate = buyDate.toISOString()
            trade.exitPrice = buyPrice
          }
        } else {
          // Fallback if dates are invalid
          trade.errors.push('Invalid buy/sell timestamps')
          trade.side = 'LONG'
          trade.entryDate = buyTime || sellTime || ''
          trade.entryPrice = buyPrice || sellPrice || 0
          if (sellTime) {
            trade.exitDate = sellTime
            trade.exitPrice = sellPrice
          }
        }
        
        trade.quantity = quantity
        trade.market = 'FUTURES'
        
        // Enhanced P&L handling with proper gross/net separation
        if (grossPnL !== undefined && grossPnL !== 0) {
          trade.grossPnL = grossPnL
          trade.netPnL = netPnL
          trade.commission = finalTotalFees // Total commission including estimated commission
          trade.entryFees = fees / 2 // Split total fees between entry and exit
          trade.exitFees = fees / 2
          // Note: exchange_fees, clearing_fees, regulatory_fees and estimated commission stored in commission field
          
          // Calculate return percentage based on net P&L
          if (trade.entryPrice > 0 && trade.quantity > 0) {
            const notionalValue = trade.entryPrice * trade.quantity
            if (notionalValue > 0) {
              trade.returnPercent = (netPnL / notionalValue) * 100
            }
          }
        }
        
        // Set trade status and data source
        trade.status = 'CLOSED' // Tradovate exports are completed trades
        trade.dataSource = 'csv'
        
      } else {
        // Generic auto-detection
        trade.symbol = findColumnValue(row, headers, ['symbol', 'ticker', 'instrument'])
        trade.side = mapGenericSide(findColumnValue(row, headers, ['side', 'action', 'type', 'buy/sell']))
        trade.entryDate = findColumnValue(row, headers, ['date', 'time', 'timestamp', 'order date'])
        trade.entryPrice = parseFloat(findColumnValue(row, headers, ['price', 'entry price', 'fill price']))
        trade.quantity = Math.abs(parseFloat(findColumnValue(row, headers, ['quantity', 'qty', 'shares', 'size'])))
        
        // For generic imports, check if there's P&L data and apply commission estimation
        const pnlString = findColumnValue(row, headers, ['pnl', 'p&l', 'profit', 'profit/loss'])
        if (pnlString) {
          const grossPnL = parsePnL(pnlString)
          const commission = parseFloat(findColumnValue(row, headers, ['commission', 'commissions', 'comm', 'fees', 'fee']) || '0')
          const estimatedCommission = commission === 0 ? 1.34 : 0 // Estimate $1.34 commission if no commission data
          const finalTotalFees = commission + estimatedCommission
          const netPnL = grossPnL - finalTotalFees
          
          trade.grossPnL = grossPnL
          trade.netPnL = netPnL
          trade.commission = finalTotalFees
        }
      }

      // Enhanced validation with better error messages
      if (!trade.symbol) {
        trade.errors.push('Missing symbol')
      } else if (!/^[A-Z]{2,6}[A-Z0-9]{0,2}$/i.test(trade.symbol)) {
        // Basic futures symbol validation
        console.warn(`Unusual symbol format: ${trade.symbol}`)
      }
      
      if (!trade.entryDate) {
        trade.errors.push('Missing entry date')
      } else if (new Date(trade.entryDate).getTime() > Date.now()) {
        trade.errors.push('Entry date is in the future')
      }
      
      if (!trade.entryPrice || trade.entryPrice <= 0) {
        trade.errors.push('Invalid entry price')
      } else if (trade.entryPrice > 1000000) {
        trade.errors.push('Entry price seems unreasonably high')
      }
      
      if (!trade.quantity || trade.quantity <= 0) {
        trade.errors.push('Invalid quantity')
      } else if (trade.quantity > 10000) {
        trade.errors.push('Quantity seems unreasonably high')
      }
      
      // For Tradovate, we expect both entry and exit data since these are completed round-trip trades
      if (template === 'tradovate' || isTradovateFormat) {
        if (!trade.exitDate) {
          trade.errors.push('Missing exit date')
        } else if (new Date(trade.exitDate) <= new Date(trade.entryDate)) {
          trade.errors.push('Exit date must be after entry date')
        }
        
        if (!trade.exitPrice || trade.exitPrice <= 0) {
          trade.errors.push('Invalid exit price')
        }
        
        // Validate P&L consistency
        if (trade.netPnL !== undefined && trade.entryPrice > 0 && trade.exitPrice && trade.exitPrice > 0) {
          const calculatedPnL = trade.side === 'LONG' 
            ? (trade.exitPrice - trade.entryPrice) * trade.quantity
            : (trade.entryPrice - trade.exitPrice) * trade.quantity
          
          const pnlDifference = Math.abs(calculatedPnL - trade.netPnL)
          if (pnlDifference > Math.abs(trade.netPnL) * 0.1) { // 10% tolerance for fees
            console.warn(`P&L mismatch for ${trade.symbol}: calculated=${calculatedPnL}, actual=${trade.netPnL}`)
          }
        }
      }

      trade.isValid = trade.errors.length === 0

      return trade
    }).filter(trade => trade.symbol && trade.symbol.trim() !== '') // Filter out empty rows
  }

  const findColumnValue = (row: any[], headers: string[], possibleNames: string[]): string => {
    for (const name of possibleNames) {
      // Try exact match first (case insensitive)
      let index = headers.findIndex(h => h.toLowerCase() === name.toLowerCase())
      if (index === -1) {
        // Try partial match (case insensitive)
        index = headers.findIndex(h => 
          h.toLowerCase().includes(name.toLowerCase()) || 
          name.toLowerCase().includes(h.toLowerCase())
        )
      }
      if (index !== -1 && row[index] !== undefined && row[index] !== null && row[index] !== '') {
        const value = row[index].toString().trim()
        console.log(`Found value "${value}" for column "${name}" at index ${index}`)
        return value
      }
    }
    console.log(`No value found for any of: ${possibleNames.join(', ')}`)
    return ''
  }

  // Helper function to parse P&L values like "$19.00" or "$(5.00)"
  const parsePnL = (pnlString: string): number => {
    if (!pnlString || pnlString.trim() === '') return 0
    
    try {
      // Handle various P&L formats from different brokers
      let cleanValue = pnlString.toString().trim()
      
      // Remove common currency symbols and spaces
      cleanValue = cleanValue.replace(/[\$£€¥₹₽]/g, '')
      cleanValue = cleanValue.replace(/\s+/g, '')
      
      // Handle percentage values (convert to decimal if needed)
      if (cleanValue.includes('%')) {
        cleanValue = cleanValue.replace(/%/g, '')
        const percentValue = parseFloat(cleanValue) || 0
        return percentValue // Return as percentage, not decimal
      }
      
      // Handle parentheses for negative values: $(5.00) or (5.00) -> -5.00
      if (cleanValue.includes('(') && cleanValue.includes(')')) {
        cleanValue = '-' + cleanValue.replace(/[()]/g, '')
      }
      
      // Handle explicit negative signs
      if (cleanValue.startsWith('-')) {
        cleanValue = cleanValue.substring(1)
        const value = parseFloat(cleanValue) || 0
        return -Math.abs(value)
      }
      
      // Handle explicit positive signs
      if (cleanValue.startsWith('+')) {
        cleanValue = cleanValue.substring(1)
      }
      
      // Handle comma separators in large numbers: 1,234.56 -> 1234.56
      cleanValue = cleanValue.replace(/,/g, '')
      
      // Final parsing
      const result = parseFloat(cleanValue)
      
      if (isNaN(result)) {
        console.warn(`Could not parse P&L value: "${pnlString}"`)
        return 0
      }
      
      // Sanity check for unreasonable values
      if (Math.abs(result) > 1000000) {
        console.warn(`P&L value seems unreasonably large: ${result} from "${pnlString}"`)
      }
      
      return result
    } catch (error) {
      console.error('Error parsing P&L:', error, 'Input:', pnlString)
      return 0
    }
  }

  const mapTradovateSide = (value: string): 'LONG' | 'SHORT' => {
    const v = value.toLowerCase()
    if (v.includes('buy') || v.includes('long')) return 'LONG'
    if (v.includes('sell') || v.includes('short')) return 'SHORT'
    return 'LONG'
  }

  const mapGenericSide = (value: string): 'LONG' | 'SHORT' => {
    const v = value.toLowerCase()
    if (v.includes('buy') || v.includes('long')) return 'LONG'
    if (v.includes('sell') || v.includes('short')) return 'SHORT'
    return 'LONG'
  }

  const parseWithMapping = (data: any[][], mapping: {[key: string]: string}): ParsedTrade[] => {
    if (data.length < 2) return []

    const headers = data[0]
    const rows = data.slice(1)

    return rows.map((row, index) => {
      const trade: ParsedTrade = {
        symbol: '',
        side: 'LONG',
        entryDate: '',
        entryPrice: 0,
        quantity: 0,
        market: 'FUTURES',
        isValid: true,
        errors: []
      }

      // Get values using the manual mapping
      const symbolIndex = headers.findIndex((h: string) => h === mapping.symbol)
      const sideIndex = headers.findIndex((h: string) => h === mapping.side)
      const dateIndex = headers.findIndex((h: string) => h === mapping.date)
      const priceIndex = headers.findIndex((h: string) => h === mapping.price)
      const quantityIndex = headers.findIndex((h: string) => h === mapping.quantity)

      if (symbolIndex !== -1) trade.symbol = row[symbolIndex]?.toString().trim() || ''
      if (sideIndex !== -1) trade.side = mapGenericSide(row[sideIndex]?.toString() || '')
      if (dateIndex !== -1) trade.entryDate = row[dateIndex]?.toString().trim() || ''
      if (priceIndex !== -1) trade.entryPrice = parseFloat(row[priceIndex]?.toString() || '0') || 0
      if (quantityIndex !== -1) trade.quantity = Math.abs(parseFloat(row[quantityIndex]?.toString() || '0')) || 0

      // Validation
      if (!trade.symbol) trade.errors.push('Missing symbol')
      if (!trade.entryDate) trade.errors.push('Missing entry date')
      if (!trade.entryPrice || trade.entryPrice <= 0) trade.errors.push('Invalid entry price')
      if (!trade.quantity || trade.quantity <= 0) trade.errors.push('Invalid quantity')

      trade.isValid = trade.errors.length === 0

      return trade
    }).filter(trade => trade.symbol) // Filter out empty rows
  }

  const handleImport = async () => {
    if (!session?.user?.id) {
      alert('You must be signed in to import trades. Please sign in and try again.')
      return
    }

    setStep('importing')
    setImportProgress(0)

    const validTrades = parsedTrades.filter(trade => trade.isValid)
    
    console.log('Starting import of', validTrades.length, 'valid trades')
    
    try {
      for (let i = 0; i < validTrades.length; i++) {
        const trade = validTrades[i]
        
        // Convert to API format with enhanced round-trip support
        const tradeData = {
          userId: session?.user?.id || '',
          symbol: trade.symbol,
          side: trade.side,
          entryDate: new Date(trade.entryDate).toISOString(),
          entryPrice: trade.entryPrice,
          quantity: trade.quantity,
          market: trade.market || 'FUTURES',
          notes: trade.notes || `Imported from CSV - ${trade.symbol} ${trade.side}`,
          dataSource: trade.dataSource || 'csv',
          
          // Round-trip trade data (for completed trades like Tradovate)
          ...(trade.exitDate && { 
            exitDate: new Date(trade.exitDate).toISOString(),
            status: 'CLOSED' // Mark as closed if we have exit data
          }),
          ...(trade.exitPrice && { exitPrice: trade.exitPrice }),
          
          // Enhanced P&L and performance data
          ...(trade.netPnL !== undefined && { netPnL: trade.netPnL }),
          ...(trade.grossPnL !== undefined && { grossPnL: trade.grossPnL }),
          ...(trade.returnPercent !== undefined && { returnPercent: trade.returnPercent }),
          
          // Set trade status based on available data
          status: trade.status || (trade.exitDate ? 'CLOSED' : 'OPEN'),
          
          // Additional fields for better tracking
          entryFees: trade.entryFees || 0,
          exitFees: trade.exitFees || 0,
          commission: trade.commission || 0, // Use calculated commission values
          swap: trade.swap || 0,
          
          // Enhanced CSV and execution data
          ...(trade.rawCsvData && { rawCsvData: trade.rawCsvData }),
          ...(trade.fillIds && { fillIds: trade.fillIds }),
          ...(trade.executionMetadata && { executionMetadata: trade.executionMetadata }),
          ...(trade.timingData && { timingData: trade.timingData }),
          ...(trade.slippage !== undefined && { slippage: trade.slippage }),
          ...(trade.orderDetails && { orderDetails: trade.orderDetails }),
          
          // Advanced performance metrics
          ...(trade.maxAdverseExcursion !== undefined && { maxAdverseExcursion: trade.maxAdverseExcursion }),
          ...(trade.maxFavorableExcursion !== undefined && { maxFavorableExcursion: trade.maxFavorableExcursion }),
          ...(trade.commissionPerUnit !== undefined && { commissionPerUnit: trade.commissionPerUnit }),
          ...(trade.executionDuration !== undefined && { executionDuration: trade.executionDuration })
        }

        console.log(`Importing trade ${i + 1}:`, tradeData)
        
        const response = await fetch('/api/trades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tradeData)
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Failed to import trade ${i + 1} (${trade.symbol}):`, errorText)
          
          // Try to parse error response for better user feedback
          let errorMessage = `Failed to import ${trade.symbol}`
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.error || errorData.message || errorMessage
          } catch {
            // Use raw text if not JSON
            errorMessage = errorText.substring(0, 100) || errorMessage
          }
          
          throw new Error(`Trade ${i + 1} (${trade.symbol}): ${errorMessage}`)
        }
        
        const result = await response.json()
        console.log(`Successfully imported trade ${i + 1}:`, result)

        setImportProgress(((i + 1) / validTrades.length) * 100)
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      onImportComplete()
      handleClose()
    } catch (error) {
      console.error('Import error:', error)
      
      // Show detailed error message to user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      const detailedMessage = `Import failed: ${errorMessage}\n\nPlease check your data and try again. If the problem persists, verify that:\n- All required fields are present\n- Dates are valid\n- Prices are positive numbers\n- No duplicate trades exist`
      
      alert(detailedMessage)
      setStep('preview')
    }
  }

  const handleClose = () => {
    setStep('upload')
    setFile(null)
    setParsedTrades([])
    setImportProgress(0)
    setRawData([])
    setColumnMapping({
      symbol: '',
      side: '',
      date: '',
      price: '',
      quantity: ''
    })
    onClose()
  }

  const downloadTemplate = (templateType: string) => {
    let csvContent = ''
    
    if (templateType === 'tradovate') {
      csvContent = 'Date,Symbol,Side,Quantity,Price,Contract Month\n2024-01-15,ES,BUY,1,4500.50,MAR24\n2024-01-15,NQ,SELL,2,16000.25,MAR24'
    } else {
      csvContent = 'Date,Symbol,Side,Quantity,Price,Market\n2024-01-15,AAPL,BUY,100,150.25,STOCK\n2024-01-16,TSLA,SELL,50,250.75,STOCK'
    }

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${templateType}_template.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`${themeClasses.surface} rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-semibold ${themeClasses.text}`}>
                Import Trades
                {step === 'preview' && ` (${parsedTrades.length} trades found)`}
                {step === 'importing' && ` (${Math.round(importProgress)}% complete)`}
              </h2>
              <button
                onClick={handleClose}
                className={`${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {step === 'upload' && (
              <div className="space-y-6">
                {/* Template Selection */}
                <div>
                  <label className={`block text-sm ${themeClasses.textSecondary} mb-3`}>
                    Select Broker Format
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(brokerTemplates).map(([key, template]) => (
                      <div
                        key={key}
                        onClick={() => setSelectedTemplate(key)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedTemplate === key
                            ? 'border-blue-500 bg-blue-500/10'
                            : `border-gray-300 ${themeClasses.surface} hover:border-blue-300`
                        }`}
                      >
                        <div className={`font-medium ${themeClasses.text}`}>{template.name}</div>
                        <div className={`text-sm ${themeClasses.textSecondary}`}>{template.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* File Upload */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-500/10'
                      : `border-gray-300 ${themeClasses.surface} hover:border-blue-400`
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className={`w-12 h-12 mx-auto mb-4 ${themeClasses.textSecondary}`} />
                  <p className={`text-lg font-medium ${themeClasses.text} mb-2`}>
                    Drop your CSV or Excel file here
                  </p>
                  <p className={`text-sm ${themeClasses.textSecondary} mb-4`}>
                    or click to select a file
                  </p>
                  <p className={`text-xs ${themeClasses.textSecondary}`}>
                    Supports .csv, .xlsx, and .xls files
                  </p>
                </div>

                {/* Download Templates */}
                <div className="border-t border-gray-200 pt-4">
                  <p className={`text-sm ${themeClasses.textSecondary} mb-3`}>
                    Need a template? Download sample formats:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => downloadTemplate('tradovate')}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Tradovate Template</span>
                    </button>
                    <button
                      onClick={() => downloadTemplate('generic')}
                      className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Generic Template</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 'mapping' && (
              <div className="space-y-6">
                <div>
                  <h3 className={`text-lg font-medium ${themeClasses.text} mb-4`}>Map Your Columns</h3>
                  <p className={`text-sm ${themeClasses.textSecondary} mb-6`}>
                    Match your CSV columns to the required fields:
                  </p>
                </div>

                {/* Show preview of CSV data */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-40">
                    <table className="w-full">
                      <thead className={`${themeClasses.surface} border-b`}>
                        <tr>
                          {rawData[0]?.map((header: string, index: number) => (
                            <th key={index} className={`text-left py-2 px-3 ${themeClasses.textSecondary} font-medium text-sm`}>
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rawData.slice(1, 4).map((row: any[], index: number) => (
                          <tr key={index} className="border-b">
                            {row.map((cell: any, cellIndex: number) => (
                              <td key={cellIndex} className={`py-2 px-3 text-sm ${themeClasses.text}`}>
                                {cell?.toString().substring(0, 20)}...
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Column mapping */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(columnMapping).map(([field, value]) => (
                    <div key={field}>
                      <label className={`block text-sm ${themeClasses.textSecondary} mb-2 capitalize`}>
                        {field} *
                      </label>
                      <select
                        value={value}
                        onChange={(e) => setColumnMapping({...columnMapping, [field]: e.target.value})}
                        className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.input}`}
                      >
                        <option value="">Select column...</option>
                        {rawData[0]?.map((header: string, index: number) => (
                          <option key={index} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setStep('upload')}
                    className={`px-4 py-2 ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      const trades = parseWithMapping(rawData, columnMapping)
                      setParsedTrades(trades)
                      setStep('preview')
                    }}
                    disabled={!columnMapping.symbol || !columnMapping.side || !columnMapping.date || !columnMapping.price || !columnMapping.quantity}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Continue to Preview
                  </button>
                </div>
              </div>
            )}

            {step === 'preview' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className={`text-sm ${themeClasses.text}`}>
                        {parsedTrades.filter(t => t.isValid).length} valid trades
                      </span>
                    </div>
                    {parsedTrades.some(t => !t.isValid) && (
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        <span className={`text-sm ${themeClasses.text}`}>
                          {parsedTrades.filter(t => !t.isValid).length} with errors
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setStep('upload')}
                      className={`px-4 py-2 ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
                    >
                      Back
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={parsedTrades.filter(t => t.isValid).length === 0}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      Import {parsedTrades.filter(t => t.isValid).length} Trades
                    </button>
                  </div>
                </div>

                {/* Enhanced Preview Table for Round-Trip Trades */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full">
                      <thead className={`${themeClasses.surface} border-b`}>
                        <tr>
                          <th className={`text-left py-3 px-4 ${themeClasses.textSecondary} font-medium`}>Status</th>
                          <th className={`text-left py-3 px-4 ${themeClasses.textSecondary} font-medium`}>Symbol</th>
                          <th className={`text-left py-3 px-4 ${themeClasses.textSecondary} font-medium`}>Side</th>
                          <th className={`text-left py-3 px-4 ${themeClasses.textSecondary} font-medium`}>Entry</th>
                          <th className={`text-left py-3 px-4 ${themeClasses.textSecondary} font-medium`}>Exit</th>
                          <th className={`text-left py-3 px-4 ${themeClasses.textSecondary} font-medium`}>Qty</th>
                          <th className={`text-left py-3 px-4 ${themeClasses.textSecondary} font-medium`}>P&L</th>
                          <th className={`text-left py-3 px-4 ${themeClasses.textSecondary} font-medium`}>Duration</th>
                          <th className={`text-left py-3 px-4 ${themeClasses.textSecondary} font-medium`}>Issues</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedTrades.map((trade, index) => {
                          // Calculate trade duration if both dates available
                          const getDuration = () => {
                            if (!trade.entryDate || !trade.exitDate) return '-'
                            try {
                              const entryTime = new Date(trade.entryDate).getTime()
                              const exitTime = new Date(trade.exitDate).getTime()
                              const diffMs = Math.abs(exitTime - entryTime)
                              
                              const hours = Math.floor(diffMs / (1000 * 60 * 60))
                              const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
                              
                              if (hours > 0) return `${hours}h ${minutes}m`
                              if (minutes > 0) return `${minutes}m`
                              return '<1m'
                            } catch {
                              return '-'
                            }
                          }
                          
                          const formatDate = (dateStr: string) => {
                            if (!dateStr) return '-'
                            try {
                              const date = new Date(dateStr)
                              return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            } catch {
                              return dateStr.substring(0, 16)
                            }
                          }
                          
                          return (
                            <tr key={index} className={`border-b ${trade.isValid ? '' : 'bg-red-50'}`}>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  {trade.isValid ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                  )}
                                  {trade.exitDate && (
                                    <span className="px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                      CLOSED
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className={`py-3 px-4 ${themeClasses.text} font-medium`}>{trade.symbol}</td>
                              <td className={`py-3 px-4 ${themeClasses.text}`}>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  trade.side === 'LONG' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {trade.side}
                                </span>
                              </td>
                              <td className={`py-3 px-4 ${themeClasses.text} text-sm`}>
                                <div className="space-y-1">
                                  <div className="font-medium">${trade.entryPrice?.toFixed(2) || '0.00'}</div>
                                  <div className={`text-xs ${themeClasses.textSecondary}`}>
                                    {formatDate(trade.entryDate)}
                                  </div>
                                </div>
                              </td>
                              <td className={`py-3 px-4 ${themeClasses.text} text-sm`}>
                                {trade.exitPrice ? (
                                  <div className="space-y-1">
                                    <div className="font-medium">${trade.exitPrice.toFixed(2)}</div>
                                    <div className={`text-xs ${themeClasses.textSecondary}`}>
                                      {formatDate(trade.exitDate || '')}
                                    </div>
                                  </div>
                                ) : (
                                  <span className={`text-xs ${themeClasses.textSecondary}`}>Open</span>
                                )}
                              </td>
                              <td className={`py-3 px-4 ${themeClasses.text} font-medium`}>{trade.quantity}</td>
                              <td className={`py-3 px-4 text-sm`}>
                                {trade.netPnL !== undefined ? (
                                  <div className="space-y-1">
                                    <div className={`font-medium ${
                                      trade.netPnL >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {trade.netPnL >= 0 ? '+' : ''}${trade.netPnL.toFixed(2)}
                                    </div>
                                    {trade.returnPercent !== undefined && (
                                      <div className={`text-xs ${
                                        trade.returnPercent >= 0 ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {trade.returnPercent >= 0 ? '+' : ''}{trade.returnPercent.toFixed(1)}%
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className={`text-xs ${themeClasses.textSecondary}`}>-</span>
                                )}
                              </td>
                              <td className={`py-3 px-4 ${themeClasses.text} text-sm`}>
                                {getDuration()}
                              </td>
                              <td className={`py-3 px-4 text-sm text-red-600`}>
                                {trade.errors.length > 0 ? trade.errors.join(', ') : '-'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {step === 'importing' && (
              <div className="text-center py-12">
                <Loader2 className={`w-12 h-12 mx-auto mb-4 animate-spin ${themeClasses.accent}`} />
                <h3 className={`text-lg font-medium ${themeClasses.text} mb-2`}>Importing Trades...</h3>
                <p className={`text-sm ${themeClasses.textSecondary} mb-4`}>
                  Please wait while we process your trades
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <p className={`text-sm ${themeClasses.textSecondary} mt-2`}>
                  {Math.round(importProgress)}% complete
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}