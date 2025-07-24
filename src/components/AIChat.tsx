"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  MessageCircle, 
  Send, 
  Brain, 
  Loader2, 
  BarChart3, 
  TrendingUp,
  Clock,
  User,
  Bot,
  Trash2,
  Lightbulb,
  Move,
  Copy,
  Check
} from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"
import { getThemeClasses } from "@/lib/theme"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  data?: any[]
  enhancedData?: any
  agenticWorkflow?: {
    primaryObjective: string
    subTasks: string[]
    mathematicalOperations: string[]
    behavioralInsights: string[]
  }
  chartConfig?: {
    type: 'line' | 'bar' | 'pie' | 'table' | 'heatmap'
    xAxis?: string
    yAxis?: string
    title?: string
    insights?: any
  }
  executionTime?: number
}

interface AIChatProps {
  className?: string
}

const EXAMPLE_QUERIES = [
  "Calculate my Sharpe ratio and analyze risk metrics",
  "Show correlation between my NQ and crypto performance", 
  "Analyze my emotional patterns in trading notes",
  "What's my maximum drawdown and when did it occur?",
  "Compare volatility metrics across different strategies",
  "Identify behavioral patterns affecting my win rate"
]

export default function AIChat({ className }: AIChatProps) {
  const { theme } = useTheme()
  const themeClasses = getThemeClasses(theme)
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [chatSize, setChatSize] = useState({ width: 600, height: 600 })
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left' | 'center'>('bottom-right')
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Add a small delay to ensure all DOM elements are fully rendered
    const timer = setTimeout(() => {
      setMounted(true)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (query?: string) => {
    const messageText = query || input.trim()
    if (!messageText || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: messageText,
          conversationHistory: messages.slice(-5), // Last 5 messages for context
          userId: 'cmcwu8b5m0001m17ilm0triy8' // Demo user ID
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        data: data.data,
        enhancedData: data.enhancedData,
        agenticWorkflow: data.agenticWorkflow,
        chartConfig: data.chartConfig,
        executionTime: data.executionTime
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I couldn't process your request right now. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleResize = (e: MouseEvent) => {
    if (!isResizing) return
    
    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y
    
    setChatSize(prev => ({
      width: Math.max(320, Math.min(window.innerWidth - 100, prev.width + deltaX)),
      height: Math.max(400, Math.min(window.innerHeight - 100, prev.height + deltaY))
    }))
    
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleResizeEnd = () => {
    setIsResizing(false)
  }

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResize)
      document.addEventListener('mouseup', handleResizeEnd)
    }
    
    return () => {
      document.removeEventListener('mousemove', handleResize)
      document.removeEventListener('mouseup', handleResizeEnd)
    }
  }, [isResizing, dragStart])

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-6 left-6'
      case 'center':
        return ''
      default:
        return 'bottom-6 right-6'
    }
  }

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      // Force fixed positioning to override any inherited positioning
      transform: position === 'center' ? 'translate(-50%, -50%)' : undefined,
      willChange: 'transform' as const,
      // Ensure the element creates its own stacking context
      isolation: 'isolate' as const
    }

    if (position === 'center') {
      return {
        ...baseStyles,
        top: '50%',
        left: '50%'
      }
    }
    
    return baseStyles
  }

  const togglePosition = () => {
    const positions: Array<'bottom-right' | 'bottom-left' | 'center'> = ['bottom-right', 'bottom-left', 'center']
    const currentIndex = positions.indexOf(position)
    const nextIndex = (currentIndex + 1) % positions.length
    setPosition(positions[nextIndex])
  }

  const copyMessageContent = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      console.error('Failed to copy message:', err)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const renderEnhancedContent = (content: string) => {
    console.log('renderEnhancedContent called with:', content.substring(0, 100))
    
    // Simple but effective formatting - break into logical sections
    const sections = content.split(/\n\s*\n/).filter(s => s.trim())
    
    return sections.map((section, sectionIndex) => {
      const trimmedSection = section.trim()
      
      // Handle different content types
      if (trimmedSection.includes('Symbol') && trimmedSection.includes('NetPnL')) {
        // This looks like trading data - format as structured data
        const lines = trimmedSection.split('\n').filter(l => l.trim())
        return (
          <div key={`data-${sectionIndex}`} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
            {lines.map((line, lineIndex) => {
              if (line.includes(':')) {
                const parts = line.split(':')
                const key = parts[0].trim()
                const value = parts.slice(1).join(':').trim()
                return (
                  <div key={lineIndex} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{key}:</span>
                    <span className="text-gray-900 dark:text-gray-100 text-sm font-mono">{value}</span>
                  </div>
                )
              }
              return (
                <div key={lineIndex} className="py-1 text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                  {line}
                </div>
              )
            })}
          </div>
        )
      }
      
      // Handle summary/analysis sections
      if (trimmedSection.toLowerCase().includes('analysis') || 
          trimmedSection.toLowerCase().includes('summary') ||
          trimmedSection.toLowerCase().includes('calculated')) {
        return (
          <div key={`summary-${sectionIndex}`} className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 rounded-r-lg">
            <div className="text-sm leading-relaxed text-blue-800 dark:text-blue-200">
              {trimmedSection.split('\n').map((line, i) => (
                <div key={i} className="mb-2 last:mb-0">{line}</div>
              ))}
            </div>
          </div>
        )
      }
      
      // Regular text content
      return (
        <div key={`text-${sectionIndex}`} className="mb-4 text-sm leading-relaxed text-gray-800 dark:text-gray-200">
          {trimmedSection.split('\n').map((line, i) => (
            <div key={i} className="mb-2 last:mb-0">{line}</div>
          ))}
        </div>
      )
    })
  }

  const renderDataTable = (data: any[], config?: any) => {
    if (!data || data.length === 0) return null

    const keys = Object.keys(data[0])
    console.log('renderDataTable called with keys:', keys)
    
    return (
      <div className="my-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {keys.map(key => (
                  <th key={key} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.slice(0, 6).map((row, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  {keys.map(key => {
                    let value = row[key]
                    let formattedValue = value?.toString() || '-'
                    let cellClass = 'px-4 py-4 text-sm text-gray-900 dark:text-gray-100'
                    
                    // Format specific data types
                    if (typeof value === 'number') {
                      if (key.toLowerCase().includes('pnl') || key.toLowerCase().includes('profit') || key.toLowerCase().includes('loss')) {
                        formattedValue = `$${value.toFixed(2)}`
                        cellClass += value >= 0 ? ' text-green-600 dark:text-green-400 font-medium' : ' text-red-600 dark:text-red-400 font-medium'
                      } else if (key.toLowerCase().includes('rate') || key.toLowerCase().includes('percent')) {
                        formattedValue = `${value.toFixed(1)}%`
                      } else if (key.toLowerCase().includes('price')) {
                        formattedValue = `$${value.toFixed(2)}`
                      } else {
                        formattedValue = value.toLocaleString()
                      }
                    }
                    
                    // Handle dates
                    if (key.toLowerCase().includes('date') && value) {
                      try {
                        const date = new Date(value)
                        formattedValue = date.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: '2-digit' 
                        })
                      } catch (e) {
                        // Keep original value if date parsing fails
                      }
                    }
                    
                    return (
                      <td key={key} className={cellClass}>
                        <div className="font-mono" title={formattedValue}>
                          {formattedValue}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length > 6 && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Showing first 6 of {data.length} results
            </span>
          </div>
        )}
      </div>
    )
  }

  if (!mounted) return null

  const chatContent = !isOpen ? (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setIsOpen(true)}
      className={`fixed ${getPositionClasses()} w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-[9999] ${className}`}
      style={getPositionStyles()}
    >
      <Brain className="w-6 h-6" />
    </motion.button>
  ) : (
    <motion.div
      ref={chatRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`fixed ${getPositionClasses()} ${themeClasses.surface} border ${themeClasses.border} rounded-lg shadow-xl flex flex-col z-[9999] ${className} ${isResizing ? 'cursor-nw-resize' : ''}`}
      style={{
        width: `${chatSize.width}px`,
        height: `${chatSize.height}px`,
        minWidth: '320px',
        minHeight: '400px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        ...getPositionStyles()
      }}
    >
      {/* Header */}
      <div className={`p-4 border-b ${themeClasses.border} flex items-center justify-between`}>
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-blue-500" />
          <h3 className={`font-semibold ${themeClasses.text}`}>AI Trading Assistant</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePosition}
            className={`p-1 rounded hover:bg-opacity-80 ${themeClasses.button}`}
            title={`Position: ${position.replace('-', ' ')}`}
          >
            <Move className="w-4 h-4" />
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className={`p-1 rounded hover:bg-opacity-80 ${themeClasses.button}`}
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className={`p-1 rounded hover:bg-opacity-80 ${themeClasses.button}`}
          >
            ×
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center">
            <Lightbulb className={`w-12 h-12 ${themeClasses.textSecondary} mx-auto mb-4`} />
            <p className={`${themeClasses.textSecondary} mb-4`}>
              Ask me anything about your trading data!
            </p>
            <div className="space-y-2">
              <p className={`text-xs ${themeClasses.textSecondary} mb-2`}>Try these examples:</p>
              {EXAMPLE_QUERIES.slice(0, 3).map((query, index) => (
                <button
                  key={index}
                  onClick={() => sendMessage(query)}
                  className={`block w-full text-left text-xs px-3 py-2 rounded border ${themeClasses.border} hover:bg-opacity-80 ${themeClasses.button} ${themeClasses.textSecondary}`}
                >
                  "{query}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[95%] ${
              message.role === 'user' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                : `${themeClasses.surface} border ${themeClasses.border} shadow-md hover:shadow-lg transition-shadow`
            } rounded-xl p-4`}>
              <div className="flex items-start space-x-4">
                {message.role === 'assistant' && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
                {message.role === 'user' && (
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="flex-1 space-y-2 min-w-0">
                  <div className={`${
                    message.role === 'user' ? 'text-white' : themeClasses.text
                  }`}>
                    <div className="break-words overflow-hidden">
                      {message.role === 'assistant' ? (
                        <div className="space-y-3">
                          {renderEnhancedContent(message.content)}
                        </div>
                      ) : (
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {message.data && message.data.length > 0 && (
                    renderDataTable(message.data, message.chartConfig)
                  )}
                  
                  {/* Enhanced Data Display */}
                  {message.enhancedData && (
                    <div className={`mt-3 p-3 rounded border ${themeClasses.border} ${themeClasses.surface}`}>
                      <h4 className={`text-sm font-medium ${themeClasses.text} mb-2`}>
                        🧮 Advanced Analysis
                      </h4>
                      
                      {message.enhancedData.calculations?.riskMetrics && (
                        <div className="mb-2">
                          <span className={`text-xs ${themeClasses.textSecondary}`}>Risk Metrics:</span>
                          <div className="grid grid-cols-3 gap-2 mt-1">
                            <div className="text-center">
                              <div className={`text-sm font-medium ${themeClasses.text}`}>
                                {message.enhancedData.calculations.riskMetrics.sharpeRatio}
                              </div>
                              <div className={`text-xs ${themeClasses.textSecondary}`}>Sharpe Ratio</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-sm font-medium ${themeClasses.text}`}>
                                {(message.enhancedData.calculations.riskMetrics.volatility * 100).toFixed(1)}%
                              </div>
                              <div className={`text-xs ${themeClasses.textSecondary}`}>Volatility</div>
                            </div>
                            <div className={`text-center`}>
                              <div className={`text-sm font-medium ${themeClasses.text}`}>
                                {(message.enhancedData.calculations.riskMetrics.averageReturn * 100).toFixed(1)}%
                              </div>
                              <div className={`text-xs ${themeClasses.textSecondary}`}>Avg Return</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {message.enhancedData.calculations?.drawdownAnalysis && (
                        <div className="mb-2">
                          <span className={`text-xs ${themeClasses.textSecondary}`}>Drawdown Analysis:</span>
                          <div className={`text-sm ${themeClasses.text}`}>
                            Max: ${message.enhancedData.calculations.drawdownAnalysis.maxDrawdown} 
                            (Peak: ${message.enhancedData.calculations.drawdownAnalysis.peakEquity})
                          </div>
                        </div>
                      )}
                      
                      {message.enhancedData.sentimentAnalysis && (
                        <div>
                          <span className={`text-xs ${themeClasses.textSecondary}`}>Sentiment Analysis:</span>
                          <div className={`text-sm ${themeClasses.text}`}>
                            {message.enhancedData.sentimentAnalysis.totalAnalyzed} trades analyzed
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Agentic Workflow Display */}
                  {message.agenticWorkflow && (
                    <div className={`mt-3 p-3 rounded border ${themeClasses.border} bg-blue-500/5`}>
                      <h4 className={`text-sm font-medium text-blue-400 mb-2`}>
                        🤖 Agentic Analysis Workflow
                      </h4>
                      <div className={`text-xs ${themeClasses.textSecondary} mb-1`}>
                        <strong>Objective:</strong> {message.agenticWorkflow.primaryObjective}
                      </div>
                      {message.agenticWorkflow.subTasks.length > 0 && (
                        <div className={`text-xs ${themeClasses.textSecondary} mb-1`}>
                          <strong>Tasks:</strong> {message.agenticWorkflow.subTasks.join(' → ')}
                        </div>
                      )}
                      {message.agenticWorkflow.mathematicalOperations.length > 0 && (
                        <div className={`text-xs ${themeClasses.textSecondary}`}>
                          <strong>Calculations:</strong> {message.agenticWorkflow.mathematicalOperations.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs ${
                        message.role === 'user' ? 'text-blue-100' : themeClasses.textSecondary
                      }`}>
                        {formatTime(message.timestamp)}
                      </span>
                      {message.role === 'assistant' && message.content.length > 100 && (
                        <button
                          onClick={() => copyMessageContent(message.id, message.content)}
                          className={`p-1 rounded hover:bg-opacity-20 hover:bg-gray-500 transition-colors ${
                            message.role === 'user' ? 'text-blue-100' : themeClasses.textSecondary
                          }`}
                          title="Copy message"
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                    {message.executionTime && (
                      <span className={`text-xs ${
                        message.role === 'user' ? 'text-blue-100' : themeClasses.textSecondary
                      } flex items-center space-x-1`}>
                        <Clock className="w-3 h-3" />
                        <span>{message.executionTime}ms</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className={`${themeClasses.surface} border ${themeClasses.border} rounded-lg p-3`}>
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-blue-500" />
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className={`text-sm ${themeClasses.textSecondary}`}>Analyzing...</span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`p-4 border-t ${themeClasses.border}`}>
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your trading data..."
            className={`flex-1 px-3 py-2 text-sm rounded border ${themeClasses.border} ${themeClasses.surface} ${themeClasses.text} placeholder:${themeClasses.textSecondary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {messages.length === 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {EXAMPLE_QUERIES.slice(3, 6).map((query, index) => (
              <button
                key={index}
                onClick={() => sendMessage(query)}
                className={`text-xs px-2 py-1 rounded border ${themeClasses.border} hover:bg-opacity-80 ${themeClasses.button} ${themeClasses.textSecondary}`}
              >
                {query}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Resize Handle */}
      <div
        className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize hover:bg-blue-500 hover:bg-opacity-20 rounded-br-lg"
        onMouseDown={handleResizeStart}
        title="Drag to resize"
      >
        <div className="absolute top-1 left-1 w-2 h-2">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-400 rounded"></div>
          <div className="absolute top-0.5 left-0 w-full h-0.5 bg-gray-400 rounded"></div>
          <div className="absolute top-1 left-0 w-full h-0.5 bg-gray-400 rounded"></div>
        </div>
      </div>
    </motion.div>
  )

  // Ensure document.body is available and component is mounted
  if (typeof window === 'undefined' || !document.body) {
    return null
  }
  
  return createPortal(chatContent, document.body)
}