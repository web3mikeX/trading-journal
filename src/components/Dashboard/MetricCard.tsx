"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: LucideIcon
  className?: string
  valueColor?: "default" | "success" | "danger" | "warning"
}

export default function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  className,
  valueColor = "default"
}: MetricCardProps) {
  const valueColorClasses = {
    default: "text-gray-900 dark:text-white",
    success: "text-green-600 dark:text-green-400",
    danger: "text-red-600 dark:text-red-400",
    warning: "text-yellow-600 dark:text-yellow-400"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative group overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl",
        "hover:border-white/30 hover:bg-white/20 transition-all duration-300",
        "shadow-lg hover:shadow-xl",
        className
      )}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
      
      {/* Content */}
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {title}
            </h3>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className={cn(
            "text-2xl font-bold",
            valueColorClasses[valueColor]
          )}>
            {value}
          </p>
          
          {change !== undefined && (
            <div className="flex items-center space-x-1">
              <span className={cn(
                "text-xs font-medium",
                change >= 0 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              )}>
                {change >= 0 ? "+" : ""}{change.toFixed(2)}%
              </span>
              {changeLabel && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Hover effect */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500/20 rounded-2xl transition-all duration-300" />
    </motion.div>
  )
}