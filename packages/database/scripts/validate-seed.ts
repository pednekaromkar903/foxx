import { PrismaClient } from '@prisma/client';
import { DEMO_DATA } from '../seed.ts';

const prisma = new PrismaClient();

async function validate() {
  const errors: string[] = [];
  
  console.log('🔍 Validating seed data...');

  // Check all seeded users exist
  for (const [key, user] of Object.entries(DEMO_DATA.users)) {
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
    if (!dbUser) {
        errors.push(`Missing user: ${user.email}`);
    } else {
        if (dbUser.name !== user.name) errors.push(`Name mismatch for ${user.email}: expected ${user.name}, got ${dbUser.name}`);
        if (dbUser.role !== user.role) errors.push(`Role mismatch for ${user.email}: expected ${user.role}, got ${dbUser.role}`);
    }
  }
  
  // Check all goals exist with correct owners
  for (const goal of DEMO_DATA.goals) {
    const owner = await prisma.user.findUnique({ where: { email: goal.ownerEmail } });
    if (!owner) {
        errors.push(`Owner ${goal.ownerEmail} not found for goal ${goal.title}`);
        continue;
    }
    const dbGoal = await prisma.goal.findFirst({ 
        where: { 
            title: goal.title, 
            employeeId: owner.id 
        } 
    });
    if (!dbGoal) errors.push(`Missing goal: ${goal.title} for ${goal.ownerEmail}`);
  }
  
  // Check email analytics
  const emailCount = await prisma.customerEmail.count();
  const seededEmailCount = DEMO_DATA.emails.length;
  if (emailCount < seededEmailCount) errors.push(`Email count mismatch: expected at least ${seededEmailCount}, got ${emailCount}`);
  
  // Check departments
  for (const dept of DEMO_DATA.departments) {
    const dbDept = await prisma.department.findUnique({ where: { name: dept.name } });
    if (!dbDept) errors.push(`Missing department: ${dept.name}`);
  }

  if (errors.length > 0) {
    console.error('❌ SEED VALIDATION FAILED:\n' + errors.join('\n'));
    process.exit(1);
  }
  console.log('✅ Seed validation passed');
}

validate()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
