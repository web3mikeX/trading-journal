"use client"

export default function TestSimpleChartPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Simple Chart Test
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Basic Chart Loading Test
          </h2>
          
          <div className="space-y-6">
            {/* Simple placeholder */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Test Chart Placeholder</h3>
              <div 
                className="bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center"
                style={{ width: '600px', height: '300px' }}
              >
                <span className="text-gray-500">Chart would load here</span>
              </div>
            </div>
            
            {/* Test status */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              ✅ Page loading successfully<br/>
              ✅ React components rendering<br/>
              ✅ Tailwind CSS working<br/>
              📊 Ready for chart integration
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}