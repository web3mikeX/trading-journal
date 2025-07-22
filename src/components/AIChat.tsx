"use client"

import { useState, useRef, useEffect } from "react"
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
  Lightbulb
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const renderDataTable = (data: any[], config?: any) => {
    if (!data || data.length === 0) return null

    const keys = Object.keys(data[0])
    
    return (
      <div className="mt-3 overflow-x-auto">
        <table className={`w-full text-sm border ${themeClasses.border} rounded-lg`}>
          <thead className={`${themeClasses.surface}`}>
            <tr>
              {keys.map(key => (
                <th key={key} className={`px-3 py-2 text-left ${themeClasses.text} font-medium`}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((row, index) => (
              <tr key={index} className={`border-t ${themeClasses.border}`}>
                {keys.map(key => (
                  <td key={key} className={`px-3 py-2 ${themeClasses.textSecondary}`}>
                    {typeof row[key] === 'number' && key.includes('PnL') 
                      ? `$${row[key].toFixed(2)}`
                      : typeof row[key] === 'number' && key.includes('Rate')
                      ? `${row[key].toFixed(1)}%`
                      : row[key]?.toString() || '-'
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 10 && (
          <p className={`text-xs ${themeClasses.textSecondary} mt-2`}>
            Showing first 10 of {data.length} results
          </p>
        )}
      </div>
    )
  }

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-50 ${className}`}
      >
        <Brain className="w-6 h-6" />
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed bottom-6 right-6 w-96 h-[600px] ${themeClasses.surface} border ${themeClasses.border} rounded-lg shadow-xl flex flex-col z-50 ${className}`}
    >
      {/* Header */}
      <div className={`p-4 border-b ${themeClasses.border} flex items-center justify-between`}>
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-blue-500" />
          <h3 className={`font-semibold ${themeClasses.text}`}>AI Trading Assistant</h3>
        </div>
        <div className="flex items-center space-x-2">
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : `${themeClasses.surface} border ${themeClasses.border}`
            } rounded-lg p-3`}>
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <Bot className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                )}
                {message.role === 'user' && (
                  <User className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className={`text-sm ${
                    message.role === 'user' ? 'text-white' : themeClasses.text
                  }`}>
                    {message.content}
                  </p>
                  
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
                    <span className={`text-xs ${
                      message.role === 'user' ? 'text-blue-100' : themeClasses.textSecondary
                    }`}>
                      {formatTime(message.timestamp)}
                    </span>
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
    </motion.div>
  )
}