import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 10);
  
  const mfg = await prisma.department.create({ data: { name: 'Manufacturing', thrustArea: 'Operational Excellence' } });
  const b2b = await prisma.department.create({ data: { name: 'B2B Sales', thrustArea: 'Revenue Growth' } });
  const rnd = await prisma.department.create({ data: { name: 'R&D', thrustArea: 'Product Innovation' } });
  const ops = await prisma.department.create({ data: { name: 'Operations', thrustArea: 'Enterprise Operations' } });

  await prisma.user.create({ data: { email: 'manager1@atomberg.com', name: 'Rajesh Kumar', role: 'MANAGER', passwordHash: hash, departmentId: mfg.id } });
  await prisma.user.create({ data: { email: 'manager2@atomberg.com', name: 'Priya Sharma', role: 'MANAGER', passwordHash: hash, departmentId: b2b.id } });
  await prisma.user.create({ data: { email: 'employee1@atomberg.com', name: 'Amit Patel', role: 'EMPLOYEE', passwordHash: hash, departmentId: rnd.id } });
  await prisma.user.create({ data: { email: 'admin@atomberg.com', name: 'Admin User', role: 'ADMIN', passwordHash: hash, departmentId: ops.id } });

  console.log('✅ Seeded with old emails');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
