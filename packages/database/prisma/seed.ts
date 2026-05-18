import { PrismaClient, Role, GoalStatus, UoMType, Quarter, UpdateStatus, ApprovalAction, InnovationStatus, TechQuadrant, TechRing } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with Enterprise Data...');

  // Clear existing data in reverse order of dependencies
  await prisma.auditLog.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.quarterlyUpdate.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.innovation.deleteMany();
  await prisma.techRadarItem.deleteMany();
  await prisma.marketInsight.deleteMany();
  await prisma.salesTrend.deleteMany();
  await prisma.complaintInsight.deleteMany();
  await prisma.complaintEmail.deleteMany();
  await prisma.emailIntegration.deleteMany();
  await prisma.product.deleteMany();
  await prisma.competitor.deleteMany();
  await prisma.technologyTrend.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.sharedGoal.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.cycleWindow.deleteMany();

  // Create Departments
  const deptEng = await prisma.department.create({ data: { id: 'dept_eng', name: 'Engineering' } });
  const deptDes = await prisma.department.create({ data: { id: 'dept_des', name: 'Design' } });
  const deptMkt = await prisma.department.create({ data: { id: 'dept_mkt', name: 'Marketing' } });
  const deptHR = await prisma.department.create({ data: { id: 'dept_hr', name: 'Human Resources' } });

  // Users
  const adminPwd = await bcrypt.hash('Admin@123', 10);
  const managerPwd = await bcrypt.hash('Manager@123', 10);
  const employeePwd = await bcrypt.hash('Employee@123', 10);
  const commonPwd = await bcrypt.hash('password123', 10);

  const admin1 = await prisma.user.create({ data: { id: 'admin1', email: 'admin@atomberg.com', name: 'Ravi Kumar', role: Role.ADMIN, departmentId: 'dept_eng', password: adminPwd } });
  const hr1 = await prisma.user.create({ data: { id: 'hr1', email: 'hr@atomberg.com', name: 'Sonal Verma', role: Role.HR, departmentId: 'dept_hr', password: commonPwd } });
  const mgr1 = await prisma.user.create({ data: { id: 'mgr1', email: 'manager@atomberg.com', name: 'Priya Singh', role: Role.MANAGER, departmentId: 'dept_eng', password: managerPwd } });
  const mgr2 = await prisma.user.create({ data: { id: 'mgr2', email: 'neha@atomberg.com', name: 'Neha Gupta', role: Role.MANAGER, departmentId: 'dept_des', password: commonPwd } });
  
  // Set managers
  const emp1 = await prisma.user.create({ data: { id: 'emp1', email: 'amit@atomberg.com', name: 'Amit Sharma', role: Role.EMPLOYEE, departmentId: 'dept_eng', managerId: 'mgr1', password: employeePwd } });
  const emp2 = await prisma.user.create({ data: { id: 'emp2', email: 'sneha@atomberg.com', name: 'Sneha Rao', role: Role.EMPLOYEE, departmentId: 'dept_des', managerId: 'mgr1', password: commonPwd } });
  const emp3 = await prisma.user.create({ data: { id: 'emp3', email: 'rahul@atomberg.com', name: 'Rahul Verma', role: Role.EMPLOYEE, departmentId: 'dept_eng', managerId: 'mgr1', password: commonPwd } });
  const emp4 = await prisma.user.create({ data: { id: 'emp4', email: 'tina@atomberg.com', name: 'Tina Das', role: Role.EMPLOYEE, departmentId: 'dept_mkt', managerId: 'mgr2', password: commonPwd } });

  // Cycle Window
  await prisma.cycleWindow.create({
    data: { id: 'cw1', quarter: Quarter.Q2, year: 2026, phase: 'EXECUTION', startDate: new Date('2026-04-01T00:00:00Z'), endDate: new Date('2026-06-30T23:59:59Z'), isActive: true }
  });

  // Goals
  const goals = [
    { id: "g1", employeeId: "emp1", title: "Reduce API P99 latency", thrustArea: "Performance", uomType: UoMType.NUMERIC_MAX, target: 20, weightage: 15, status: GoalStatus.MANAGER_APPROVED, quarter: Quarter.Q2, year: 2026, deadline: new Date("2026-06-30T23:59:59Z") },
    { id: "g2", employeeId: "emp1", title: "Zero production incidents", thrustArea: "Reliability", uomType: UoMType.ZERO_BASED, target: 1, weightage: 15, status: GoalStatus.ADMIN_APPROVED, quarter: Quarter.Q2, year: 2026, deadline: new Date("2026-06-15T23:59:59Z") },
    { id: "g3", employeeId: "emp1", title: "Code review coverage", thrustArea: "Quality", uomType: UoMType.PERCENTAGE, target: 95, weightage: 20, status: GoalStatus.SUBMITTED_TO_MANAGER, quarter: Quarter.Q2, year: 2026, deadline: new Date("2026-05-20T23:59:59Z") },
    { id: "g4", employeeId: "emp1", title: "Database query optimization", thrustArea: "Performance", uomType: UoMType.NUMERIC_MAX, target: 100, weightage: 20, status: GoalStatus.DRAFT, quarter: Quarter.Q2, year: 2026, deadline: new Date("2026-05-10T23:59:59Z") },
    { id: "g5", employeeId: "emp2", title: "Design system components", thrustArea: "Design", uomType: UoMType.NUMERIC_MIN, target: 40, weightage: 30, status: GoalStatus.HR_APPROVED, quarter: Quarter.Q2, year: 2026, deadline: new Date("2026-06-15T23:59:59Z") },
    { id: "g6", employeeId: "emp2", title: "User research interviews", thrustArea: "Research", uomType: UoMType.NUMERIC_MIN, target: 30, weightage: 30, status: GoalStatus.SENT_TO_ADMIN, quarter: Quarter.Q2, year: 2026, deadline: new Date("2026-05-30T23:59:59Z") },
    { id: "g7", employeeId: "emp2", title: "Consistency score", thrustArea: "Quality", uomType: UoMType.NUMERIC_MAX, target: 10, weightage: 20, status: GoalStatus.RETURNED_FOR_REWORK, quarter: Quarter.Q2, year: 2026, deadline: new Date("2026-05-15T23:59:59Z"), returnReason: "Please explain the MAX logic" },
    { id: "g8", employeeId: "emp3", title: "Unit test coverage", thrustArea: "Quality", uomType: UoMType.PERCENTAGE, target: 100, weightage: 50, status: GoalStatus.COMPLETED, quarter: Quarter.Q2, year: 2026, deadline: new Date("2026-06-30T23:59:59Z") },
    { id: "g9", employeeId: "emp3", title: "Security vulnerabilities", thrustArea: "Security", uomType: UoMType.ZERO_BASED, target: 1, weightage: 50, status: GoalStatus.SENT_TO_HR, quarter: Quarter.Q2, year: 2026, deadline: new Date("2026-05-31T23:59:59Z") }
  ];

  await prisma.goal.createMany({ data: goals });

  // Tech Radar Data
  const competitors = [
    { id: "comp1", name: "Havells", marketPosition: "Market Leader", smartFeatures: ["Voice Control", "IoT App", "Energy Save"], marketImpact: 9.2 },
    { id: "comp2", name: "Crompton", marketPosition: "Strong Challenger", smartFeatures: ["Silent BLDC", "Anti-Dust"], marketImpact: 8.5 },
    { id: "comp3", name: "Dyson", marketPosition: "Premium Tech", smartFeatures: ["HEPA Filter", "Air Multiplier"], marketImpact: 9.8 },
    { id: "comp4", name: "Xiaomi", marketPosition: "Eco-system Play", smartFeatures: ["Mi Home Integrations", "AI Scenes"], marketImpact: 8.0 }
  ];

  for (const comp of competitors) {
    await prisma.competitor.create({ data: comp });
  }

  const products = [
    { name: "Havells Stealth Air", competitorId: "comp1", category: "Ceiling Fan", monthlySales: 15000, marketShare: 12.5, demandTrend: "UP", smartFeatures: ["Remote Control", "Silent Operation"] },
    { name: "Crompton Energion", competitorId: "comp2", category: "BLDC Fan", monthlySales: 12000, marketShare: 10.2, demandTrend: "UP", smartFeatures: ["BLDC Motor", "Energy Efficient"] },
    { name: "Dyson Pure Cool", competitorId: "comp3", category: "Air Purifier", monthlySales: 5000, marketShare: 4.5, demandTrend: "STABLE", smartFeatures: ["Air Quality Monitoring", "Night Mode"] },
    { name: "Atomberg Renesa+", competitorId: "comp1", category: "BLDC Fan", monthlySales: 18000, marketShare: 14.2, demandTrend: "UP", smartFeatures: ["AtomSENSE", "LED Speed Display"] }
  ];

  for (const prod of products) {
    await prisma.product.create({ data: prod });
  }

  const trends = [
    { name: "Matter Protocol", category: "IoT", adoptionRate: 15.5, growthTrajectory: "UP", regions: ["Global", "India"], impactScore: 9.5, difficulty: "HIGH" },
    { name: "Edge AI", category: "Intelligence", adoptionRate: 8.2, growthTrajectory: "UP", regions: ["North America", "Asia"], impactScore: 8.8, difficulty: "MEDIUM" },
    { name: "Silent BLDC", category: "Motor Tech", adoptionRate: 45.0, growthTrajectory: "STABLE", regions: ["India", "SE Asia"], impactScore: 9.0, difficulty: "LOW" }
  ];

  for (const trend of trends) {
    await prisma.technologyTrend.create({ data: trend });
  }

  await prisma.marketInsight.createMany({
    data: [
      { title: "Competitor X is rapidly gaining market share", description: "Havells is launching 3 new BLDC models next month.", type: "COMPETITOR", severity: "HIGH" },
      { title: "Voice-enabled smart fans are trending", description: "35% YoY growth in voice-controlled appliance searches.", type: "TREND", severity: "MEDIUM" },
      { title: "Energy-saving appliances growth", description: "BEE ratings are becoming a primary filter for online shoppers.", type: "TREND", severity: "MEDIUM" }
    ]
  });

  // Complaint Intelligence Data
  const integration = await prisma.emailIntegration.create({
    data: { userId: "admin1", provider: "gmail", email: "support@atomberg.com", accessToken: "mock_token" }
  });

  const complaints = [
    { integrationId: integration.id, messageId: "msg1", subject: "Fan making noise", sender: "cust1@gmail.com", recipient: "support@atomberg.com", body: "My Renesa fan is making a clicking noise at speed 3.", sentAt: new Date(), category: "Noise Issue", sentiment: "negative", severity: 3, region: "Mumbai" },
    { integrationId: integration.id, messageId: "msg2", subject: "Remote not working", sender: "cust2@yahoo.com", recipient: "support@atomberg.com", body: "The remote stopped responding after 2 days of use.", sentAt: new Date(), category: "Remote Issue", sentiment: "negative", severity: 2, region: "Delhi" },
    { integrationId: integration.id, messageId: "msg3", subject: "WiFi pairing failed", sender: "cust3@outlook.com", recipient: "support@atomberg.com", body: "Cannot connect my fan to the Atomberg app. Stuck at pairing step.", sentAt: new Date(), category: "WiFi Pairing", sentiment: "negative", severity: 4, region: "Bangalore" }
  ];

  for (const complaint of complaints) {
    await prisma.complaintEmail.create({ data: complaint });
  }

  console.log('✅ Seeds completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });