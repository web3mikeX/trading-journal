"use client"

// Redesigned Balance and High boxes with vertical layout - v4
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { 
  CreditCardIcon, 
  TrendingUpIcon, 
  TrendingDownIcon, 
  TargetIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  CalendarIcon,
  SettingsIcon,
  ShieldIcon,
  BarChart3Icon,
  DollarSignIcon,
  BuildingIcon
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useTheme } from "@/components/ThemeProvider"
import { getThemeClasses } from "@/lib/theme"
import { useAuth } from "@/hooks/useAuth"

interface AccountMetrics {
  currentBalance: number
  accountHigh: number
  // New fields
  calculatedTrailingLimit?: number
  calculatedDailyLimit?: number | null
  displayTrailingLimit?: number // The actual calculated amount for display
  trailingDrawdownAmount: number
  dailyLossLimit?: number | null
  netPnLToDate: number
  dailyPnL: number
  accountType: string
  isWithinTrailingLimit?: boolean
  isWithinDailyLimit?: boolean
  trailingBuffer?: number
  dailyBuffer?: number | null
  accountStartDate: string | null
  isLiveFunded: boolean
  firstPayoutReceived: boolean
  // Fee transparency fields
  broker?: string | null
  totalFeesToDate?: number
  dailyFees?: number
  grossPnLToDate?: number
  grossDailyPnL?: number
  feeImpactPercentage?: number
  averageFeePerTrade?: number
  // Balance validation fields
  balanceValidated?: boolean
  lastValidationDate?: string | null
  // Legacy fields for backward compatibility
  calculatedMLL?: number
  isWithinMLL?: boolean
  distanceFromMLL?: number
}

interface Trade {
  id: string
  netPnL?: number
  entryDate: Date
  status: "OPEN" | "CLOSED" | "CANCELLED"
}

interface AccountReportProps {
  trades: Trade[]
}

export default function AccountReport({ trades }: AccountReportProps) {
  const { theme } = useTheme()
  const themeClasses = getThemeClasses(theme)
  const { user } = useAuth()
  const router = useRouter()
  const [accountMetrics, setAccountMetrics] = useState<AccountMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  const handleSettingsClick = () => {
    router.push('/settings')
  }

  // Load account metrics
  useEffect(() => {
    const loadAccountMetrics = async () => {
      if (!user?.id) return
      
      try {
        const response = await fetch(`/api/account-metrics?userId=${user.id}&t=${Date.now()}`)
        if (response.ok) {
          const metrics = await response.json()
          setAccountMetrics(metrics)
        } else {
          setAccountMetrics(null)
        }
      } catch (error) {
        console.error('Failed to load account metrics:', error)
        setAccountMetrics(null)
      } finally {
        setLoading(false)
      }
    }

    loadAccountMetrics()
  }, [user?.id, trades]) // Re-fetch when trades change

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="h-full"
      >
        <Card className={`${themeClasses.surface} h-full flex items-center justify-center`}>
          <div className={`${themeClasses.textSecondary}`}>Loading account data...</div>
        </Card>
      </motion.div>
    )
  }

  if (!accountMetrics) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="h-full"
      >
        <Card className={`${themeClasses.surface} h-full flex flex-col`}>
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className={`font-semibold leading-none tracking-tight ${themeClasses.text}`}>
                Account Report
              </h3>
              <SettingsIcon className={`w-4 h-4 ${themeClasses.textSecondary}`} />
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center text-center">
            <CreditCardIcon className={`w-12 h-12 ${themeClasses.textSecondary} mb-4`} />
            <p className={`${themeClasses.textSecondary} mb-2`}>
              No account configuration found
            </p>
            <p className={`text-sm ${themeClasses.textMuted} mb-4`}>
              Configure your account settings to see detailed account metrics and trailing drawdown
            </p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Format account type for display
  const formatAccountType = (type: string) => {
    switch (type) {
      case 'EVALUATION_50K': return 'Evaluation $50K'
      case 'EVALUATION_100K': return 'Evaluation $100K'
      case 'EVALUATION_150K': return 'Evaluation $150K'
      case 'EVALUATION': return 'Evaluation Account'
      case 'LIVE_FUNDED': return 'Live Funded'
      case 'CUSTOM': return 'Custom Account'
      case 'TOPSTEP': return 'Prop Firm Account'
      case 'TOPSTEP_50K': return 'Prop Firm $50K'
      case 'TOPSTEP_100K': return 'Prop Firm $100K'
      case 'TOPSTEP_150K': return 'Prop Firm $150K'
      default: return type === 'TOPSTEP' ? 'Prop Firm Account' : (type || '').replace(/TOPSTEP/gi, 'Prop Firm')
    }
  }

  // Format broker name for display
  const formatBrokerName = (broker: string) => {
    switch (broker) {
      case 'TOPSTEP': return 'Prop Firm'
      case 'TRADOVATE': return 'Tradovate'
      case 'GENERIC': return 'Futures Broker'
      default: return broker === 'TOPSTEP' ? 'Prop Firm' : (broker || '').replace(/TOPSTEP/gi, 'Prop Firm')
    }
  }

  // Sanitize all account metrics to remove TOPSTEP branding
  const sanitizedMetrics = {
    ...accountMetrics,
    accountType: formatAccountType(accountMetrics.accountType),
    broker: accountMetrics.broker ? formatBrokerName(accountMetrics.broker) : null
  }

  // Emergency replacement function
  const replaceTopStepText = (text: any): string => {
    if (typeof text === 'string') {
      return text.replace(/TOPSTEP/gi, 'PROP_FIRM')
    }
    return String(text || '').replace(/TOPSTEP/gi, 'PROP_FIRM')
  }

  // Calculate today's trades count
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayTrades = trades.filter(trade => {
    const tradeDate = new Date(trade.entryDate)
    return tradeDate >= today && tradeDate < tomorrow
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="h-full"
    >
      <Card className={`${themeClasses.surface} h-full flex flex-col`}>
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold leading-none tracking-tight ${themeClasses.text}`}>
              Account Report
            </h3>
            <div className="flex items-center space-x-2">
              {accountMetrics.isLiveFunded && (
                <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                  Live
                </div>
              )}
              <button
                onClick={handleSettingsClick}
                className={`p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${themeClasses.textSecondary} hover:${themeClasses.text}`}
                title="Account Settings"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-2">
              <BarChart3Icon className={`w-3 h-3 ${themeClasses.textSecondary}`} />
              <span className={`text-xs ${themeClasses.textSecondary}`}>
                {sanitizedMetrics.accountType}
              </span>
            </div>
            {accountMetrics.accountStartDate && (
              <div className="flex items-center space-x-2">
                <CalendarIcon className={`w-3 h-3 ${themeClasses.textSecondary}`} />
                <span className={`text-xs ${themeClasses.textSecondary}`}>
                  Since {formatDate(new Date(accountMetrics.accountStartDate))}
                </span>
              </div>
            )}
            {sanitizedMetrics.broker && (
              <div className="flex items-center space-x-2">
                <BuildingIcon className={`w-3 h-3 ${themeClasses.textSecondary}`} />
                <span className={`text-xs ${themeClasses.textSecondary}`}>
                  {replaceTopStepText(sanitizedMetrics.broker)}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <div className="space-y-3">
            {/* Current Balance & Account High */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10 min-h-[4rem]">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="p-1 rounded-full bg-blue-500/20">
                    <CreditCardIcon className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className={`text-sm ${themeClasses.text}`}>Balance</span>
                  {accountMetrics.balanceValidated && (
                    <div className="p-1 rounded-full bg-green-500/20">
                      <CheckCircleIcon className="w-2 h-2 text-green-400" />
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className={`font-semibold text-lg ${themeClasses.text}`}>
                    {formatCurrency(accountMetrics.currentBalance)}
                  </div>
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-purple-500/10 min-h-[4rem]">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="p-1 rounded-full bg-purple-500/20">
                    <TrendingUpIcon className="w-3 h-3 text-purple-400" />
                  </div>
                  <span className={`text-sm ${themeClasses.text}`}>High</span>
                </div>
                <div className="text-right">
                  <div className={`font-semibold text-lg text-purple-400`}>
                    {formatCurrency(accountMetrics.accountHigh)}
                  </div>
                </div>
              </div>
            </div>

            {/* Daily P&L */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-500/10">
              <div className="flex items-center space-x-2 min-w-0">
                <div className={`p-1 rounded-full ${
                  accountMetrics.dailyPnL >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {accountMetrics.dailyPnL >= 0 ? (
                    <TrendingUpIcon className="w-3 h-3 text-green-400" />
                  ) : (
                    <TrendingDownIcon className="w-3 h-3 text-red-400" />
                  )}
                </div>
                <span className={`text-sm ${themeClasses.text}`}>Today's P&L</span>
              </div>
              <div className="flex-shrink-0 text-right ml-4">
                <div className={`font-semibold ${
                  accountMetrics.dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatCurrency(accountMetrics.dailyPnL)}
                </div>
                <div className={`text-xs ${themeClasses.textSecondary}`}>
                  {todayTrades.length} trades
                </div>
              </div>
            </div>

            {/* Trailing Drawdown Limit */}
            <div className={`flex items-center justify-between p-2.5 rounded-lg ${
              !(accountMetrics.isWithinTrailingLimit ?? accountMetrics.isWithinMLL ?? true)
                ? 'bg-red-500/10' 
                : ((accountMetrics.trailingBuffer ?? accountMetrics.distanceFromMLL ?? 0) < (accountMetrics.trailingDrawdownAmount * 0.1))
                ? 'bg-yellow-500/10' 
                : 'bg-green-500/10'
            }`}>
              <div className="flex items-center space-x-2 min-w-0">
                <div className={`p-1 rounded-full ${
                  !(accountMetrics.isWithinTrailingLimit ?? accountMetrics.isWithinMLL ?? true)
                    ? 'bg-red-500/20' 
                    : ((accountMetrics.trailingBuffer ?? accountMetrics.distanceFromMLL ?? 0) < (accountMetrics.trailingDrawdownAmount * 0.1))
                    ? 'bg-yellow-500/20' 
                    : 'bg-green-500/20'
                }`}>
                  {!(accountMetrics.isWithinTrailingLimit ?? accountMetrics.isWithinMLL ?? true) ? (
                    <AlertTriangleIcon className="w-3 h-3 text-red-400" />
                  ) : ((accountMetrics.trailingBuffer ?? accountMetrics.distanceFromMLL ?? 0) < (accountMetrics.trailingDrawdownAmount * 0.1)) ? (
                    <AlertTriangleIcon className="w-3 h-3 text-yellow-400" />
                  ) : (
                    <ShieldIcon className="w-3 h-3 text-green-400" />
                  )}
                </div>
                <span className={`text-sm ${themeClasses.text} truncate`}>Trailing Drawdown Limit</span>
              </div>
              <div className="flex-shrink-0 text-right ml-4">
                <div className={`font-semibold ${
                  !(accountMetrics.isWithinTrailingLimit ?? accountMetrics.isWithinMLL ?? true)
                    ? 'text-red-400' 
                    : ((accountMetrics.trailingBuffer ?? accountMetrics.distanceFromMLL ?? 0) < (accountMetrics.trailingDrawdownAmount * 0.1))
                    ? 'text-yellow-400'
                    : themeClasses.text
                }`}>
                  {accountMetrics.isLiveFunded && accountMetrics.firstPayoutReceived 
                    ? '$0' 
                    : formatCurrency(accountMetrics.displayTrailingLimit || accountMetrics.calculatedTrailingLimit || accountMetrics.calculatedMLL || 0)
                  }
                </div>
                <div className={`text-xs ${themeClasses.textSecondary}`}>
                  {formatCurrency(accountMetrics.trailingBuffer ?? accountMetrics.distanceFromMLL ?? 0)} buffer
                </div>
              </div>
            </div>

            {/* Daily Loss Limit (if configured) */}
            {accountMetrics.dailyLossLimit && accountMetrics.calculatedDailyLimit && (
              <div className={`flex items-center justify-between p-2.5 rounded-lg ${
                !accountMetrics.isWithinDailyLimit 
                  ? 'bg-red-500/10' 
                  : accountMetrics.dailyBuffer && accountMetrics.dailyBuffer < (accountMetrics.dailyLossLimit * 0.1)
                  ? 'bg-yellow-500/10' 
                  : 'bg-blue-500/10'
              }`}>
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div className={`p-1 rounded-full ${
                    !accountMetrics.isWithinDailyLimit 
                      ? 'bg-red-500/20' 
                      : accountMetrics.dailyBuffer && accountMetrics.dailyBuffer < (accountMetrics.dailyLossLimit * 0.1)
                      ? 'bg-yellow-500/20' 
                      : 'bg-blue-500/20'
                  }`}>
                    {!accountMetrics.isWithinDailyLimit ? (
                      <AlertTriangleIcon className="w-3 h-3 text-red-400" />
                    ) : accountMetrics.dailyBuffer && accountMetrics.dailyBuffer < (accountMetrics.dailyLossLimit * 0.1) ? (
                      <AlertTriangleIcon className="w-3 h-3 text-yellow-400" />
                    ) : (
                      <CheckCircleIcon className="w-3 h-3 text-blue-400" />
                    )}
                  </div>
                  <span className={`text-sm ${themeClasses.text}`}>Daily Loss Limit</span>
                </div>
                <div className="flex-shrink-0 text-right pl-2">
                  <div className={`font-semibold block ${
                    !accountMetrics.isWithinDailyLimit 
                      ? 'text-red-400' 
                      : accountMetrics.dailyBuffer && accountMetrics.dailyBuffer < (accountMetrics.dailyLossLimit * 0.1)
                      ? 'text-yellow-400'
                      : 'text-blue-400'
                  }`}>
                    {formatCurrency(accountMetrics.calculatedDailyLimit)}
                  </div>
                  <div className={`text-xs ${themeClasses.textSecondary}`}>
                    {accountMetrics.dailyBuffer ? formatCurrency(accountMetrics.dailyBuffer) : '$0'} buffer
                  </div>
                </div>
              </div>
            )}

            {/* Fixed Amounts Info */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-orange-500/10">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div className="p-1 rounded-full bg-orange-500/20">
                  <TargetIcon className="w-3 h-3 text-orange-400" />
                </div>
                <span className={`text-sm ${themeClasses.text} truncate`}>Fixed Trailing Amount</span>
              </div>
              <div className="flex-shrink-0 text-right pl-2">
                <div className={`font-semibold text-orange-400 block`}>
                  {formatCurrency(accountMetrics.trailingDrawdownAmount)}
                </div>
                <div className={`text-xs ${themeClasses.textSecondary}`}>
                  Below account high
                </div>
              </div>
            </div>

            {/* Net P&L Since Start */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-500/10">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div className="p-1 rounded-full bg-indigo-500/20">
                  <BarChart3Icon className="w-3 h-3 text-indigo-400" />
                </div>
                <span className={`text-sm ${themeClasses.text}`}>Total P&L</span>
              </div>
              <div className="flex-shrink-0 text-right pl-2">
                <div className={`font-semibold block ${
                  accountMetrics.netPnLToDate >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatCurrency(accountMetrics.netPnLToDate)}
                </div>
                <div className={`text-xs ${themeClasses.textSecondary}`}>
                  Since start
                </div>
              </div>
            </div>

            {/* Trading Fees Section */}
            {(accountMetrics.totalFeesToDate !== undefined && accountMetrics.totalFeesToDate > 0) && (
              <>
                {/* Total Fees */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div className="p-1 rounded-full bg-amber-500/20">
                      <DollarSignIcon className="w-3 h-3 text-amber-400" />
                    </div>
                    <span className={`text-sm ${themeClasses.text}`}>Total Fees</span>
                  </div>
                  <div className="flex-shrink-0 text-right pl-2">
                    <div className="font-semibold text-amber-400">
                      {formatCurrency(accountMetrics.totalFeesToDate)}
                    </div>
                    <div className={`text-xs ${themeClasses.textSecondary}`}>
                      ${accountMetrics.averageFeePerTrade?.toFixed(2) || '0.00'} avg/trade
                    </div>
                  </div>
                </div>

                {/* Today's Fees */}
                {(accountMetrics.dailyFees !== undefined && accountMetrics.dailyFees > 0) && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className="p-1 rounded-full bg-amber-500/20">
                        <DollarSignIcon className="w-3 h-3 text-amber-400" />
                      </div>
                      <span className={`text-sm ${themeClasses.text}`}>Today's Fees</span>
                    </div>
                    <div className="flex-shrink-0 text-right pl-2">
                      <div className="font-semibold text-amber-400">
                        {formatCurrency(accountMetrics.dailyFees)}
                      </div>
                      <div className={`text-xs ${themeClasses.textSecondary}`}>
                        {accountMetrics.feeImpactPercentage !== undefined && accountMetrics.feeImpactPercentage > 0 
                          ? `${accountMetrics.feeImpactPercentage.toFixed(1)}% of profits` 
                          : 'Fee impact'
                        }
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Special Status Messages */}
            {accountMetrics.isLiveFunded && accountMetrics.firstPayoutReceived && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="w-4 h-4 text-green-400" />
                  <span className={`text-sm font-medium text-green-400`}>
                    First Payout Received
                  </span>
                </div>
                <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                  Maximum Loss Limit has been reset to $0
                </p>
              </div>
            )}

            {!(accountMetrics.isWithinTrailingLimit ?? accountMetrics.isWithinMLL ?? true) && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center space-x-2">
                  <AlertTriangleIcon className="w-4 h-4 text-red-400" />
                  <span className={`text-sm font-medium text-red-400`}>
                    Trailing Drawdown Violation
                  </span>
                </div>
                <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                  Account balance is below the trailing drawdown limit
                </p>
              </div>
            )}

            {accountMetrics.dailyLossLimit && !(accountMetrics.isWithinDailyLimit ?? true) && (
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-center space-x-2">
                  <AlertTriangleIcon className="w-4 h-4 text-orange-400" />
                  <span className={`text-sm font-medium text-orange-400`}>
                    Daily Loss Limit Violation
                  </span>
                </div>
                <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                  Account balance is below the daily loss limit
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}