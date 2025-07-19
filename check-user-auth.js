const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUserAuth() {
  console.log('🔍 Checking user authentication setup...\n')
  
  try {
    // Find your user
    const user = await prisma.user.findUnique({
      where: { email: 'degenbitkid@gmail.com' }
    })
    
    if (user) {
      console.log('👤 User found:')
      console.log(`   Name: ${user.name}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Created: ${user.createdAt}`)
      console.log(`   Email Verified: ${user.isEmailVerified}`)
      console.log(`   Has Password: ${user.password ? 'Yes' : 'No'}`)
      
      if (!user.password) {
        console.log('\n⚠️  No password set for this user!')
        console.log('\nThis could mean:')
        console.log('   1. User was created without a password')
        console.log('   2. User uses OAuth login (Google, GitHub, etc.)')
        console.log('   3. Password needs to be set/reset')
      } else {
        console.log('\n✅ Password is set (hashed)')
      }
    } else {
      console.log('❌ User not found with email: degenbitkid@gmail.com')
    }
    
    // Check if there are any users with passwords
    const usersWithPasswords = await prisma.user.findMany({
      where: {
        password: {
          not: null
        }
      },
      select: {
        name: true,
        email: true,
        id: true
      }
    })
    
    console.log(`\n👥 Users with passwords: ${usersWithPasswords.length}`)
    if (usersWithPasswords.length > 0) {
      usersWithPasswords.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error checking user auth:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserAuth()