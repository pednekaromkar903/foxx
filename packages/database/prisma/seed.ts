import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 10);
  
  // Engineering Department
  const engineering = await prisma.department.upsert({
    where: { id: 'dept-engineering' },
    update: {},
    create: { id: 'dept-engineering', name: 'Engineering' }
  });
  
  // Design Department  
  const design = await prisma.department.upsert({
    where: { id: 'dept-design' },
    update: {},
    create: { id: 'dept-design', name: 'Design' }
  });

  // Employee: Amit Sharma
  await prisma.user.upsert({
    where: { email: 'amit@atomberg.com' },
    update: {},
    create: {
      id: 'user-amit',
      email: 'amit@atomberg.com',
      name: 'Amit Sharma',
      password: hash,
      role: 'EMPLOYEE',
      departmentId: engineering.id,
    }
  });

  // Employee: Sneha Rao
  await prisma.user.upsert({
    where: { email: 'sneha@atomberg.com' },
    update: {},
    create: {
      id: 'user-sneha',
      email: 'sneha@atomberg.com',
      name: 'Sneha Rao',
      password: hash,
      role: 'EMPLOYEE',
      departmentId: design.id,
    }
  });

  // Manager: Priya Singh (Amit's manager, Engineering dept)
  await prisma.user.upsert({
    where: { email: 'manager@atomberg.com' },
    update: {},
    create: {
      id: 'user-manager',
      email: 'manager@atomberg.com',
      name: 'Priya Singh',
      password: hash,
      role: 'MANAGER',
      departmentId: engineering.id,
    }
  });

  // Admin: Ravi Kumar
  await prisma.user.upsert({
    where: { email: 'admin@atomberg.com' },
    update: {},
    create: {
      id: 'user-admin',
      email: 'admin@atomberg.com',
      name: 'Ravi Kumar',
      password: hash,
      role: 'ADMIN',
    }
  });

  console.log('✅ Seeded 4 test users + 2 departments');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());
