"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import { 
  XIcon, 
  PlusIcon,
  CalendarIcon,
  DollarSignIcon,
  HashIcon,
  FileTextIcon
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const TradeFormSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").toUpperCase(),
  side: z.enum(["LONG", "SHORT"], { required_error: "Side is required" }),
  entryDate: z.string().min(1, "Entry date is required"),
  entryPrice: z.number({ required_error: "Entry price is required" }).positive("Entry price must be positive"),
  quantity: z.number({ required_error: "Quantity is required" }).positive("Quantity must be positive"),
  strategy: z.string().optional(),
  setup: z.string().optional(),
  market: z.string().default("STOCK"),
  entryFees: z.number().min(0, "Entry fees cannot be negative").default(0),
  exitDate: z.string().optional(),
  exitPrice: z.number().positive("Exit price must be positive").optional(),
  exitFees: z.number().min(0, "Exit fees cannot be negative").default(0),
  stopLoss: z.number().positive("Stop loss must be positive").optional(),
  takeProfit: z.number().positive("Take profit must be positive").optional(),
  riskAmount: z.number().min(0, "Risk amount cannot be negative").optional(),
  commission: z.number().min(0, "Commission cannot be negative").default(0),
  swap: z.number().default(0),
  notes: z.string().optional(),
})

type TradeFormData = z.infer<typeof TradeFormSchema>

interface AddTradeModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (trade: any) => Promise<void>
}

export default function AddTradeModal({ isOpen, onClose, onSubmit }: AddTradeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(TradeFormSchema),
    defaultValues: {
      market: "STOCK",
      entryFees: 0,
      exitFees: 0,
      commission: 0,
      swap: 0,
    }
  })

  const exitDate = watch("exitDate")

  const handleFormSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)
      setSubmitError(null)

      // Convert the form data to the format expected by the API
      const tradeData = {
        ...data,
        entryDate: new Date(data.entryDate),
        exitDate: data.exitDate ? new Date(data.exitDate) : undefined,
      }

      await onSubmit(tradeData)
      reset()
      onClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to add trade")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    setSubmitError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <Card className="border-white/20 bg-slate-900/95 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center space-x-2">
              <PlusIcon className="w-5 h-5 text-green-400" />
              <span>Add New Trade</span>
            </CardTitle>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
              {/* Basic Trade Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Symbol *</label>
                  <input
                    type="text"
                    {...register("symbol")}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="AAPL"
                  />
                  {errors.symbol && (
                    <p className="text-red-400 text-xs mt-1">{errors.symbol.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Side *</label>
                  <select
                    {...register("side")}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-slate-800 [&>option]:text-white"
                  >
                    <option value="">Select Side</option>
                    <option value="LONG">LONG</option>
                    <option value="SHORT">SHORT</option>
                  </select>
                  {errors.side && (
                    <p className="text-red-400 text-xs mt-1">{errors.side.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Market</label>
                  <select
                    {...register("market")}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-slate-800 [&>option]:text-white"
                  >
                    <option value="STOCK">Stock</option>
                    <option value="FOREX">Forex</option>
                    <option value="CRYPTO">Crypto</option>
                    <option value="FUTURES">Futures</option>
                    <option value="OPTIONS">Options</option>
                  </select>
                </div>
              </div>

              {/* Entry Details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Entry Date *</label>
                  <input
                    type="datetime-local"
                    {...register("entryDate")}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.entryDate && (
                    <p className="text-red-400 text-xs mt-1">{errors.entryDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Entry Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("entryPrice", { valueAsNumber: true })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                  {errors.entryPrice && (
                    <p className="text-red-400 text-xs mt-1">{errors.entryPrice.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Quantity *</label>
                  <input
                    type="number"
                    step="0.001"
                    {...register("quantity", { valueAsNumber: true })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                  {errors.quantity && (
                    <p className="text-red-400 text-xs mt-1">{errors.quantity.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Entry Fees</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("entryFees", { valueAsNumber: true })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                  {errors.entryFees && (
                    <p className="text-red-400 text-xs mt-1">{errors.entryFees.message}</p>
                  )}
                </div>
              </div>

              {/* Exit Details (Optional) */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-lg font-semibold text-white mb-3">Exit Details (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Exit Date</label>
                    <input
                      type="datetime-local"
                      {...register("exitDate")}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Exit Price</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("exitPrice", { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      disabled={!exitDate}
                    />
                    {errors.exitPrice && (
                      <p className="text-red-400 text-xs mt-1">{errors.exitPrice.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Exit Fees</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("exitFees", { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      disabled={!exitDate}
                    />
                  </div>
                </div>
              </div>

              {/* Risk Management */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-lg font-semibold text-white mb-3">Risk Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Stop Loss</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("stopLoss", { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Take Profit</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("takeProfit", { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Risk Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("riskAmount", { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Strategy and Notes */}
              <div className="border-t border-white/10 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Strategy</label>
                    <input
                      type="text"
                      {...register("strategy")}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Momentum, Mean Reversion, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Setup</label>
                    <input
                      type="text"
                      {...register("setup")}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Breakout, Support/Resistance, etc."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">Notes</label>
                  <textarea
                    {...register("notes")}
                    rows={3}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Add any additional notes about this trade..."
                  />
                </div>
              </div>

              {/* Fees and Commission */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-lg font-semibold text-white mb-3">Additional Costs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Commission</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("commission", { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Swap/Overnight Fees</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("swap", { valueAsNumber: true })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {submitError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{submitError}</p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4" />
                      <span>Add Trade</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}