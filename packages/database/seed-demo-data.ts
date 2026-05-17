import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 10);

  // Create departments
  const opsDept = await prisma.department.upsert({
    where: { name: 'Operations' },
    update: {},
    create: { name: 'Operations', thrustArea: 'Enterprise Operations' }
  });

  const mfgDept = await prisma.department.upsert({
    where: { name: 'Manufacturing' },
    update: {},
    create: { name: 'Manufacturing', thrustArea: 'Production Excellence' }
  });

  const b2bDept = await prisma.department.upsert({
    where: { name: 'B2B Sales' },
    update: {},
    create: { name: 'B2B Sales', thrustArea: 'Revenue Growth' }
  });

  const rndDept = await prisma.department.upsert({
    where: { name: 'R&D' },
    update: {},
    create: { name: 'R&D', thrustArea: 'Product Innovation' }
  });

  // Create users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@atomberg.com' },
    update: {},
    create: { 
      email: 'admin@atomberg.com', 
      name: 'Admin User', 
      role: 'ADMIN', 
      departmentId: opsDept.id,
      passwordHash: hash
    }
  });

  const managerMfg = await prisma.user.upsert({
    where: { email: 'manager1@atomberg.com' },
    update: {},
    create: { 
      email: 'manager1@atomberg.com', 
      name: 'Rajesh Kumar', 
      role: 'MANAGER', 
      departmentId: mfgDept.id,
      passwordHash: hash
    }
  });

  const managerB2B = await prisma.user.upsert({
    where: { email: 'manager2@atomberg.com' },
    update: {},
    create: { 
      email: 'manager2@atomberg.com', 
      name: 'Priya Sharma', 
      role: 'MANAGER', 
      departmentId: b2bDept.id,
      passwordHash: hash
    }
  });

  const employeeRnD = await prisma.user.upsert({
    where: { email: 'employee1@atomberg.com' },
    update: {},
    create: { 
      email: 'employee1@atomberg.com', 
      name: 'Arjun Patel', 
      role: 'EMPLOYEE', 
      departmentId: rndDept.id,
      passwordHash: hash
    }
  });

  // Create goal cycle
  const cycle = await prisma.goalCycle.upsert({
    where: { id: 'cycle-q2-2026' },
    update: {},
    create: { 
      id: 'cycle-q2-2026', 
      name: 'Q2 2026', 
      phase: 'Q2',
      startDate: new Date('2026-04-01'), 
      endDate: new Date('2026-06-30'), 
      status: 'ACTIVE' 
    }
  });

  // Create goals with ALL required fields
  await prisma.goal.create({
    data: {
      title: 'SAP Integration',
      description: 'SAP S/4HANA integration with real-time inventory sync',
      status: 'ON_TRACK',
      thrustArea: 'Digital Transformation',
      uomType: 'MIN',
      weightage: 25,
      targetValue: 100,
      actualValue: 65,
      categoryType: 'OPERATIONS',
      employeeId: admin.id,
      cycleId: cycle.id
    }
  });

  await prisma.goal.create({
    data: {
      title: 'BLDC Production +25%',
      description: 'Scale Mumbai plant to 62,500 units/month',
      status: 'ON_TRACK',
      thrustArea: 'Operational Excellence',
      uomType: 'MAX',
      weightage: 30,
      targetValue: 62500,
      actualValue: 45000,
      categoryType: 'MANUFACTURING',
      employeeId: managerMfg.id,
      cycleId: cycle.id
    }
  });

  await prisma.goal.create({
    data: {
      title: '15 Enterprise Clients',
      description: 'Close 15 new B2B corporate clients',
      status: 'ON_TRACK',
      thrustArea: 'Revenue Growth',
      uomType: 'MAX',
      weightage: 20,
      targetValue: 15,
      actualValue: 7,
      categoryType: 'SALES',
      employeeId: managerB2B.id,
      cycleId: cycle.id
    }
  });

  await prisma.goal.create({
    data: {
      title: 'IoT Motor Controller',
      description: 'v3.0 PCB with Matter/Thread support',
      status: 'ON_TRACK',
      thrustArea: 'Product Innovation',
      uomType: 'TIMELINE',
      weightage: 25,
      targetValue: 100,
      actualValue: 45,
      categoryType: 'RND',
      employeeId: employeeRnD.id,
      cycleId: cycle.id
    }
  });

  // Create email integration first
  const integration = await prisma.emailIntegration.upsert({
    where: { id: 'default-integration' },
    update: {},
    create: {
      id: 'default-integration',
      userId: admin.id,
      email: 'support@atomberg.com',
      provider: 'GMAIL'
    }
  });

  // Create customer emails
  await prisma.customerEmail.createMany({
    data: [
      {
        subject: 'Urgent: 500-unit order delay',
        sender: 'procurement@wework.in',
        body: 'Order #B2B-2847 delayed. Please escalate immediately.',
        priority: 'HIGH',
        sentiment: 'ANGRY',
        category: 'DELIVERY',
        receivedAt: new Date('2026-05-17T09:30:00'),
        integrationId: integration.id,
        isComplaint: true
      },
      {
        subject: 'Bulk pricing inquiry',
        sender: 'sourcing@smartworks.com',
        body: 'Need 2,000 units pricing for Hyderabad expansion.',
        priority: 'HIGH',
        sentiment: 'SATISFIED',
        category: 'OTHER',
        receivedAt: new Date('2026-05-16T14:20:00'),
        integrationId: integration.id
      },
    ]
  });

  // Create calendar events
  await prisma.calendarEvent.createMany({
    data: [
      { title: 'SAP Integration Go-Live', date: new Date('2026-06-15'), type: 'goal', notes: 'Final UAT sign-off' },
      { title: 'Weekly Mfg Standup', date: new Date('2026-05-19'), type: 'checkin', notes: 'Review Line A/B output' },
      { title: 'Q2 2026 Cycle Review', date: new Date('2026-06-25'), type: 'cycle', notes: 'All-hands strategic review' },
      { title: 'Factory Audit', date: new Date('2026-05-28'), type: 'manual', notes: 'TÜV Rheinland audit' },
    ]
  });

  // Create check-ins
  await prisma.checkIn.createMany({
    data: [
      { goalId: (await prisma.goal.findFirst({ where: { title: 'SAP Integration' } }))!.id, quarter: 'Q2', plannedValue: 100, actualValue: 65, status: 'ON_TRACK', managerComment: 'Good progress on API mapping' },
      { goalId: (await prisma.goal.findFirst({ where: { title: 'BLDC Production +25%' } }))!.id, quarter: 'Q2', plannedValue: 62500, actualValue: 45000, status: 'ON_TRACK', managerComment: 'Magnet supply issue resolved' },
    ]
  });

  console.log('✅ Demo data seeded successfully!');
  console.log('🔑 Login credentials (password: password123):');
  console.log('   admin@atomberg.com');
  console.log('   manager1@atomberg.com');
  console.log('   manager2@atomberg.com');
  console.log('   employee1@atomberg.com');
}

main()
  .catch(e => { 
    console.error('❌ Seed failed:', e); 
    process.exit(1); 
  })
  .finally(async () => { 
    await prisma.$disconnect(); 
  });