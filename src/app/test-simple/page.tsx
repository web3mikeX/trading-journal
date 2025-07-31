"use client"

import { useState } from "react"

export default function TestSimple() {
  const [status, setStatus] = useState("Page loaded successfully\!")
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Quick Load Test</h1>
      <div className="p-4 bg-green-100 rounded">
        Status: {status}
      </div>
      <div className="mt-4">
        <p>If you can see this immediately, the basic page loading works.</p>
        <p>Loading time test: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  )
}
