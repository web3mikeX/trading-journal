import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/settings - Get user settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        baseCurrency: true,
        initialBalance: true,
        riskPercentage: true,
        timezone: true,
        tradingStyle: true,
        experience: true,
        // Account management fields
        accountBalance: true,
        dailyLossLimit: true,
        maxLossLimit: true,
        profitTarget: true,
        accountStartDate: true,
        brokerSyncEnabled: true,
        autoSyncEnabled: true,
        // Trailing drawdown fields
        accountType: true,
        startingBalance: true,
        currentAccountHigh: true,
        trailingDrawdownAmount: true,
        isLiveFunded: true,
        firstPayoutReceived: true,
        lastEodCalculation: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: errorMessage
    }, { status: 500 })
  }
}

// PUT /api/settings - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const body = await request.json()
    
    // Validate and prepare update data
    const updateData: any = {}
    
    // Basic settings
    if (body.baseCurrency !== undefined) updateData.baseCurrency = body.baseCurrency
    if (body.initialBalance !== undefined) updateData.initialBalance = parseFloat(body.initialBalance)
    if (body.riskPercentage !== undefined) updateData.riskPercentage = parseFloat(body.riskPercentage)
    if (body.timezone !== undefined) updateData.timezone = body.timezone
    if (body.tradingStyle !== undefined) updateData.tradingStyle = body.tradingStyle
    if (body.experience !== undefined) updateData.experience = body.experience
    
    // Account management settings
    if (body.accountBalance !== undefined) {
      updateData.accountBalance = body.accountBalance ? parseFloat(body.accountBalance) : null
    }
    if (body.dailyLossLimit !== undefined) {
      updateData.dailyLossLimit = body.dailyLossLimit ? parseFloat(body.dailyLossLimit) : null
    }
    if (body.maxLossLimit !== undefined) {
      updateData.maxLossLimit = body.maxLossLimit ? parseFloat(body.maxLossLimit) : null
    }
    if (body.profitTarget !== undefined) {
      updateData.profitTarget = body.profitTarget ? parseFloat(body.profitTarget) : null
    }
    if (body.accountStartDate !== undefined) {
      updateData.accountStartDate = body.accountStartDate ? new Date(body.accountStartDate) : null
    }
    if (body.brokerSyncEnabled !== undefined) updateData.brokerSyncEnabled = Boolean(body.brokerSyncEnabled)
    if (body.autoSyncEnabled !== undefined) updateData.autoSyncEnabled = Boolean(body.autoSyncEnabled)

    // Trailing drawdown settings
    if (body.accountType !== undefined) updateData.accountType = body.accountType
    if (body.startingBalance !== undefined) {
      updateData.startingBalance = body.startingBalance ? parseFloat(body.startingBalance) : null
    }
    if (body.trailingDrawdownAmount !== undefined) {
      updateData.trailingDrawdownAmount = body.trailingDrawdownAmount ? parseFloat(body.trailingDrawdownAmount) : null
    }
    if (body.isLiveFunded !== undefined) updateData.isLiveFunded = Boolean(body.isLiveFunded)
    if (body.firstPayoutReceived !== undefined) updateData.firstPayoutReceived = Boolean(body.firstPayoutReceived)

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        baseCurrency: true,
        initialBalance: true,
        riskPercentage: true,
        timezone: true,
        tradingStyle: true,
        experience: true,
        // Account management fields
        accountBalance: true,
        dailyLossLimit: true,
        maxLossLimit: true,
        profitTarget: true,
        accountStartDate: true,
        brokerSyncEnabled: true,
        autoSyncEnabled: true,
        // Trailing drawdown fields
        accountType: true,
        startingBalance: true,
        currentAccountHigh: true,
        trailingDrawdownAmount: true,
        isLiveFunded: true,
        firstPayoutReceived: true,
        lastEodCalculation: true,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: errorMessage
    }, { status: 500 })
  }
}