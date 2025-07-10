import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatPercentage(value: number, decimals = 2) {
  return `${value.toFixed(decimals)}%`
}

export function calculatePnL(
  entryPrice: number, 
  exitPrice: number, 
  quantity: number, 
  side: "LONG" | "SHORT", 
  multiplier: number = 1.0
) {
  const pointsDifference = side === "LONG" 
    ? (exitPrice - entryPrice)
    : (entryPrice - exitPrice)
    
  return pointsDifference * quantity * multiplier
}

export function calculateReturnPercentage(entryPrice: number, exitPrice: number, side: "LONG" | "SHORT") {
  if (side === "LONG") {
    return ((exitPrice - entryPrice) / entryPrice) * 100
  } else {
    return ((entryPrice - exitPrice) / entryPrice) * 100
  }
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}