"use client"

import { useState } from "react"
import TradeDetailModal from "@/components/TradeDetailModal"

export default function DebugTradePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTradeId, setSelectedTradeId] = useState<string>("")

  const testTradeIds = [
    "cmd8xkev20001m1z93zr810oe",
    "cmd8xkevn0003m1z9tyklo65o",
    "cmd7kfw520013m1livfgtplcl"
  ]

  const handleTest = (tradeId: string) => {
    console.log("Testing trade ID:", tradeId)
    setSelectedTradeId(tradeId)
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Trade Detail Modal</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Trade Detail Modal</h2>
          <p className="text-gray-600 mb-6">
            Click a button below to test the TradeDetailModal with different trade IDs.
          </p>
          
          <div className="space-y-4">
            {testTradeIds.map((tradeId, index) => (
              <button
                key={tradeId}
                onClick={() => handleTest(tradeId)}
                className="block w-full p-4 text-left bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Test Trade {index + 1}: {tradeId}
              </button>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Click any test button above</li>
              <li>Check browser console for any errors</li>
              <li>Verify the modal opens and displays trade data</li>
              <li>Check if the error occurs here too</li>
            </ol>
          </div>
        </div>
      </div>

      <TradeDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tradeId={selectedTradeId}
        onEdit={(id) => console.log("Edit trade:", id)}
        onDelete={(id) => console.log("Delete trade:", id)}
      />
    </div>
  )
}