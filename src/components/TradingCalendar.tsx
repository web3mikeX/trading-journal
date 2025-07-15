"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CalendarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  NotebookPenIcon,
  ImageIcon
} from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"
import { getThemeClasses } from "@/lib/theme"
import { formatCurrency } from "@/lib/utils"

interface CalendarDayData {
  date: string
  pnl: number
  tradesCount: number
  winRate: number
  hasNotes: boolean
  hasImages: boolean
  mood?: number
}

interface CalendarData {
  [date: string]: CalendarDayData
}

interface TradingCalendarProps {
  onDayClick: (date: string, dayData?: CalendarDayData) => void
  userId: string
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function TradingCalendar({ onDayClick, userId }: TradingCalendarProps) {
  const { theme } = useTheme()
  const themeClasses = getThemeClasses(theme)
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarData, setCalendarData] = useState<CalendarData>({})
  const [loading, setLoading] = useState(false)
  const [monthlyPnL, setMonthlyPnL] = useState(0)
  
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const today = new Date()
  const todayString = today.toISOString().split('T')[0]
  
  // Load calendar data for the current month
  useEffect(() => {
    if (!userId) return
    
    const loadCalendarData = async () => {
      setLoading(true)
      try {
        const yearMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
        const response = await fetch(`/api/calendar/month/${yearMonth}?userId=${userId}`)
        
        if (response.ok) {
          const data = await response.json()
          setCalendarData(data.calendarData || {})
          setMonthlyPnL(data.monthlyPnL || 0)
        }
      } catch (error) {
        console.error('Failed to fetch calendar data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadCalendarData()
  }, [userId, currentMonth, currentYear])
  
  // Get days in month and start day
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()
  
  // Generate calendar grid
  const calendarDays: Array<{
    day: number
    date: string
    isCurrentMonth: boolean
    isToday: boolean
  }> = []
  
  // Previous month's trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    calendarDays.push({
      day,
      date: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      isCurrentMonth: false,
      isToday: false
    })
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const isToday = date === todayString
    
    calendarDays.push({
      day,
      date,
      isCurrentMonth: true,
      isToday
    })
  }
  
  // Next month's leading days
  const remainingSlots = 42 - calendarDays.length // 6 weeks * 7 days
  for (let day = 1; day <= remainingSlots; day++) {
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear
    calendarDays.push({
      day,
      date: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      isCurrentMonth: false,
      isToday: false
    })
  }
  
  // Calculate weekly P&L
  const getWeeklyPnL = (weekStartIndex: number): number => {
    let weeklyPnL = 0
    for (let i = 0; i < 7; i++) {
      const dayIndex = weekStartIndex + i
      if (dayIndex < calendarDays.length) {
        const day = calendarDays[dayIndex]
        const dayData = calendarData[day.date]
        if (dayData && day.isCurrentMonth) {
          weeklyPnL += dayData.pnl || 0
        }
      }
    }
    return weeklyPnL
  }

  // Calculate weekly trade count
  const getWeeklyTradeCount = (weekStartIndex: number): number => {
    let weeklyTradeCount = 0
    for (let i = 0; i < 7; i++) {
      const dayIndex = weekStartIndex + i
      if (dayIndex < calendarDays.length) {
        const day = calendarDays[dayIndex]
        const dayData = calendarData[day.date]
        if (dayData && day.isCurrentMonth) {
          weeklyTradeCount += dayData.tradesCount || 0
        }
      }
    }
    return weeklyTradeCount
  }
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }
  
  const goToToday = () => {
    setCurrentDate(new Date())
  }
  
  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return theme === 'light' ? 'text-green-700' : 'text-green-400'
    if (pnl < 0) return theme === 'light' ? 'text-red-700' : 'text-red-400'
    return themeClasses.textSecondary
  }
  
  const getDayBackgroundColor = (pnl: number, hasData: boolean) => {
    if (!hasData) return ''
    if (pnl > 0) return theme === 'light' ? 'bg-green-100 border-green-300' : 'bg-green-900/30 border-green-500'
    if (pnl < 0) return theme === 'light' ? 'bg-red-100 border-red-300' : 'bg-red-900/30 border-red-500'
    return theme === 'light' ? 'bg-gray-100 border-gray-300' : 'bg-gray-800 border-gray-600'
  }

  return (
    <div className={`${themeClasses.surface} rounded-xl shadow-lg border ${themeClasses.border} overflow-hidden`}>
      {/* Calendar Header */}
      <div className={`${themeClasses.background} px-6 py-4 border-b ${themeClasses.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className={`text-xl font-bold ${themeClasses.text}`}>
              Trading Calendar
            </h2>
            <div className={`flex items-center space-x-2 text-sm ${themeClasses.textSecondary}`}>
              <CalendarIcon className="w-4 h-4" />
              <span>{MONTHS[currentMonth]} {currentYear}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Monthly P&L */}
            <div className="text-right">
              <div className={`text-sm ${themeClasses.textSecondary}`}>Monthly P&L</div>
              <div className={`text-lg font-bold ${getPnLColor(monthlyPnL)}`}>
                {formatCurrency(monthlyPnL)}
              </div>
            </div>
            
            {/* Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className={`p-2 rounded-lg ${themeClasses.button} transition-colors`}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              
              <button
                onClick={goToToday}
                className={`px-3 py-2 text-sm rounded-lg ${themeClasses.button} transition-colors`}
              >
                Today
              </button>
              
              <button
                onClick={() => navigateMonth('next')}
                className={`p-2 rounded-lg ${themeClasses.button} transition-colors`}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className={`text-lg ${themeClasses.textSecondary}`}>Loading calendar...</div>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Day Headers */}
            <div className="grid grid-cols-7 lg:grid-cols-8 gap-1 mb-2">
              {DAYS.map(day => (
                <div key={day} className={`p-2 text-center text-xs sm:text-sm font-medium ${themeClasses.textSecondary}`}>
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.slice(0, 1)}</span>
                </div>
              ))}
              <div className={`hidden lg:block p-2 text-center text-sm font-medium ${themeClasses.textSecondary} ml-3`}>
                Week P&L
              </div>
            </div>
            
            {/* Calendar Weeks */}
            {Array.from({ length: 6 }, (_, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 lg:grid-cols-8 gap-1">
                {/* Week Days */}
                {calendarDays.slice(weekIndex * 7, (weekIndex * 7) + 7).map((calendarDay) => {
                  const dayData = calendarData[calendarDay.date]
                  const hasData = dayData && calendarDay.isCurrentMonth
                  const pnl = dayData?.pnl || 0
                  
                  return (
                    <motion.button
                      key={calendarDay.date}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onDayClick(calendarDay.date, dayData)}
                      className={`
                        relative p-2 sm:p-3 min-h-16 sm:min-h-20 h-auto border rounded-lg transition-all duration-200
                        ${calendarDay.isCurrentMonth ? 'cursor-pointer hover:shadow-md' : 'opacity-50 cursor-default'}
                        ${calendarDay.isToday ? 'ring-2 ring-blue-500' : ''}
                        ${hasData ? getDayBackgroundColor(pnl, true) : `${themeClasses.surface} border-gray-200`}
                        ${themeClasses.text}
                      `}
                      disabled={!calendarDay.isCurrentMonth}
                    >
                      {/* Day Number */}
                      <div className={`text-sm font-medium ${calendarDay.isToday ? 'text-blue-600' : ''}`}>
                        {calendarDay.day}
                      </div>
                      
                      {/* P&L and Indicators */}
                      {hasData && (
                        <div className="mt-1 space-y-1 min-w-0">
                          {/* P&L Amount */}
                          <div className={`text-xs font-medium truncate ${getPnLColor(pnl)}`} title={formatCurrency(pnl)}>
                            {Math.abs(pnl) >= 1000 ? 
                              `${pnl < 0 ? '-' : ''}$${(Math.abs(pnl) / 1000).toFixed(1)}K` : 
                              formatCurrency(pnl)
                            }
                          </div>
                          
                          {/* Trade Count */}
                          <div className={`text-xs truncate ${themeClasses.textSecondary}`} title={`${dayData.tradesCount} trades`}>
                            {dayData.tradesCount > 9 ? `${dayData.tradesCount} trades` : `${dayData.tradesCount} ${dayData.tradesCount === 1 ? 'trade' : 'trades'}`}
                          </div>
                          
                          {/* Indicators */}
                          <div className="flex items-center justify-center space-x-1 flex-wrap">
                            {dayData.hasNotes && (
                              <NotebookPenIcon className="w-3 h-3 text-blue-500" />
                            )}
                            {dayData.hasImages && (
                              <ImageIcon className="w-3 h-3 text-purple-500" />
                            )}
                            {pnl > 0 && (
                              <TrendingUpIcon className="w-3 h-3 text-green-500" />
                            )}
                            {pnl < 0 && (
                              <TrendingDownIcon className="w-3 h-3 text-red-500" />
                            )}
                          </div>
                        </div>
                      )}
                    </motion.button>
                  )
                })}
                
                {/* Weekly P&L */}
                <div className={`hidden lg:flex items-center justify-center p-2 sm:p-3 min-h-16 sm:min-h-20 h-auto ${themeClasses.surface} border ${themeClasses.border} rounded-lg ml-6 border-l-4 border-l-blue-500`}>
                  <div className="text-center">
                    <div className={`text-xs ${themeClasses.textSecondary} mb-1`}>Week</div>
                    <div className={`text-sm font-bold ${getPnLColor(getWeeklyPnL(weekIndex * 7))}`}>
                      {formatCurrency(getWeeklyPnL(weekIndex * 7))}
                    </div>
                    <div className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                      {(() => {
                        const tradeCount = getWeeklyTradeCount(weekIndex * 7)
                        return tradeCount === 1 ? '1 trade' : `${tradeCount} trades`
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}