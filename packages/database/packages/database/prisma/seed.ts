import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('password123', 10)

  const engineering = await prisma.department.upsert({
    where: { name: 'Engineering' },
    update: {},
    create: {
      id: 'dept-engineering',
      name: 'Engineering',
      thrustArea: 'Technology',
    },
  })

  const design = await prisma.department.upsert({
    where: { name: 'Design' },
    update: {},
    create: {
      id: 'dept-design',
      name: 'Design',
      thrustArea: 'UX',
    },
  })

  await prisma.user.upsert({
    where: { email: 'admin@atomberg.com' },
    update: {},
    create: {
      id: 'user-admin',
      email: 'admin@atomberg.com',
      name: 'Ravi Kumar',
      password: hash,
      role: 'ADMIN',
      departmentId: engineering.id,
    },
  })

  console.log('✅ Seed complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())