#!/bin/bash
echo "🚀 Starting Trading Journal Development Server..."

# Kill any existing processes
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Clean build artifacts
rm -rf .next

# Start development server
echo "Starting Next.js development server..."
npm run dev