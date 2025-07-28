export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-gray-400 mb-6">Page not found</p>
        <a 
          href="/dashboard" 
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded text-white transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}