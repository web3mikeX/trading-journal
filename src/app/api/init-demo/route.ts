import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: "cmcwu8b5m0001m17ilm0triy8" }
    })

    if (existingUser) {
      return NextResponse.json({ message: "Demo user already exists", user: existingUser })
    }

    // Create the demo user
    const hashedPassword = await bcrypt.hash("demo123", 12)
    
    const demoUser = await prisma.user.create({
      data: {
        id: "cmcwu8b5m0001m17ilm0triy8",
        email: "degenbitkid@gmail.com",
        name: "mike",
        password: hashedPassword,
        isEmailVerified: true,
        baseCurrency: "USD",
        initialBalance: 10000,
        riskPercentage: 2,
        timezone: "UTC",
        tradingStyle: "Day Trader",
        experience: "Advanced"
      }
    })

    return NextResponse.json({ 
      message: "Demo user created successfully", 
      user: {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name
      }
    })

  } catch (error) {
    console.error('Demo user creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create demo user', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}