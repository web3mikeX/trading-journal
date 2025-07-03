import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const UserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  baseCurrency: z.string().default('USD'),
  initialBalance: z.number().positive().default(10000),
  riskPercentage: z.number().min(0).max(100).default(2),
  timezone: z.string().default('UTC'),
  tradingStyle: z.string().optional(),
  experience: z.string().optional(),
})

const UpdateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  baseCurrency: z.string().optional(),
  initialBalance: z.number().positive().optional(),
  riskPercentage: z.number().min(0).max(100).optional(),
  timezone: z.string().optional(),
  tradingStyle: z.string().optional(),
  experience: z.string().optional(),
})

// GET /api/users - Get user profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')

    if (!userId && !email) {
      return NextResponse.json({ error: 'User ID or email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: userId ? { id: userId } : { email: email! },
      include: {
        trades: {
          orderBy: { entryDate: 'desc' },
          take: 10
        },
        tradingGoals: {
          where: { status: 'ACTIVE' }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = UserSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 })
    }

    const user = await prisma.user.create({
      data: validatedData,
      include: {
        trades: true,
        tradingGoals: true
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PUT /api/users - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...updateData } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const validatedData = UpdateUserSchema.parse(updateData)

    const user = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
      include: {
        trades: {
          orderBy: { entryDate: 'desc' },
          take: 10
        },
        tradingGoals: {
          where: { status: 'ACTIVE' }
        }
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}