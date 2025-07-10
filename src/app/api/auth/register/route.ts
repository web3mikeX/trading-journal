import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { registerSchema, sanitizeUserInput, checkRateLimit, securityHeaders } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(clientIP, 5, 300000)) { // 5 requests per 5 minutes
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429, headers: securityHeaders }
      )
    }

    const body = await request.json()
    const sanitizedBody = sanitizeUserInput(body)
    const { name, email, password } = registerSchema.parse(sanitizedBody)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400, headers: securityHeaders }
      )
    }

    // Hash password with higher cost for better security
    const hashedPassword = await bcrypt.hash(password, 14)

    // Create user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        isEmailVerified: false, // Will implement email verification later
      }
    })

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    
    return NextResponse.json({
      message: 'User created successfully',
      user: userWithoutPassword
    }, { 
      status: 201,
      headers: securityHeaders
    })

  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      console.error('Validation error:', (error as any).errors)
      return NextResponse.json(
        { error: 'Validation error', details: (error as any).errors },
        { status: 400, headers: securityHeaders }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: securityHeaders }
    )
  }
}