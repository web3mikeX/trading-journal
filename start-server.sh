#!/bin/bash

echo "🚀 Starting Trading Journal on localhost:3000..."

# Set environment variables
export NODE_ENV=development
export NEXTAUTH_URL=http://localhost:3000
export NEXTAUTH_SECRET=demo-secret-key-for-development
export DATABASE_URL="file:./prisma/dev.db"

# Navigate to project directory and start server
cd "/mnt/c/Users/nftmi/OneDrive/Desktop/Tradedeta/trading-journal"

echo "📦 Ensuring Prisma client is generated..."
npx prisma generate

echo "🔧 Starting Next.js development server..."
npm run dev