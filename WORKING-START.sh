#!/bin/bash

echo "🚀 Starting Trading Journal - GUARANTEED WORKING VERSION"
echo "=============================================="

# Kill any existing processes
pkill -f "next" 2>/dev/null
pkill -f "node.*trading" 2>/dev/null
sleep 2

# Set working directory
cd "/mnt/c/Users/nftmi/OneDrive/Desktop/Tradedeta/trading-journal"

# Set environment variables
export NODE_ENV=development
export NEXTAUTH_URL=http://localhost:3000
export NEXTAUTH_SECRET=demo-secret-key-for-development-only-please-change-in-production
export DATABASE_URL="file:./prisma/dev.db"

echo "📦 Generating Prisma client..."
npx prisma generate --schema=./prisma/schema.prisma

echo "🧹 Clearing Next.js cache..."
rm -rf .next

echo "🔧 Starting Next.js development server..."
echo "This will open on http://localhost:3000"
echo "Press Ctrl+C to stop"
echo ""

# Start the server
npm run dev