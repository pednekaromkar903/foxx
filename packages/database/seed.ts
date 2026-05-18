import { PrismaClient, Role, GoalStatus, UoMType, Quarter, UpdateStatus, ApprovalAction, InnovationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with Stress Test Data...');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.quarterlyUpdate.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.innovation.deleteMany();
  await prisma.techRadarItem.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.sharedGoal.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.cycleWindow.deleteMany();

  // Create Departments
  const deptEng = await prisma.department.create({ data: { id: 'dept_eng', name: 'Engineering' } });
  const deptDes = await prisma.department.create({ data: { id: 'dept_des', name: 'Design' } });
  const deptMkt = await prisma.department.create({ data: { id: 'dept_mkt', name: 'Marketing' } });

  // Users
  const adminPwd = await bcrypt.hash('Admin@123', 10);
  const managerPwd = await bcrypt.hash('Manager@123', 10);
  const employeePwd = await bcrypt.hash('Employee@123', 10);
  const commonPwd = await bcrypt.hash('password123', 10);

  const admin1 = await prisma.user.create({ data: { id: 'admin1', email: 'admin@atomberg.com', name: 'Ravi Kumar', role: Role.ADMIN, departmentId: 'dept_eng', password: adminPwd } });
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
    // Amit
    { id: "g1", employeeId: "emp1", title: "Reduce API P99 latency", description: "Lower from 20ms to target", thrustArea: "Performance", uomType: UoMType.NUMERIC_MAX, target: 20, weightage: 15, status: GoalStatus.APPROVED_LOCKED, quarter: Quarter.Q2, year: 2026, deadline: new Date("2026-06-30T23:59:59Z") },
    { id: "g2", employeeId: "emp1", title: "Zero production incidents", description: "Zero critical bugs in prod", thrustArea: "Reliability", uomType: UoMType.ZERO_BASED, target: 1, weightage: 15, status: GoalStatus.APPROVED_LOCKED, quarter: Quarter.Q2, year: 2026, deadline: new Date("2026-06-15T23:59:59Z") },
    { id: "g3", employeeId: "emp1", title: "Code review coverage", description: "PR review coverage percentage", thrustArea: "Quality", uomType: UoMType.PERCENTAGE, target: 95, weightage: 20, status: GoalStatus.SUBMITTED, quarter: Quarter.Q2, year: 2026, deadline: new Date("2026-05-20T23:59:59Z") },
    { id: "g4", employeeId: "emp1", title: "Database query optimization", description: "Reduce max query time", thrustArea: "Performance", uomType: UoMType.NUMERIC_MAX, target: 100, weightage: 20, status: GoalStatus.DRAFT, quarter: Quarter.Q2, year: 2026, deadline: new Date("2026-05-10T23:59:59Z") },
    { id: "g5", employeeId: "emp1", title: "Migrate to new auth system", description: "Timeline-based migration", thrustArea: "Security", uomType: UoMType.TIMELINE, target: 1, weightage: 15, status: GoalStatus.DRAFT, quarter: Quarter.Q2, year: 2026, deadline: new Date("2026-04-30T23:59:59Z") },
    { id: "g6", employeeId: "emp1", title: "Team documentation", description: "Write technical docs", thrustArea: "Knowledge", uomType: UoMType.NUMERIC_MIN, target: 50, weightage: 15, status: GoalStatus.DRAFT, quarter: Quarter.Q2, year: 2026, deadline: new Date("2026-06-01T23:59:59Z") },
    // Sneha
    { id: "g7", employeeId: "emp2", title: "Design system components", description: "Build reusable UI kit", thrustArea: "Design", uomType: UoMType.NUMERIC_MIN, target: 40, weightage: 30, status: GoalStatus.APPROVED_LOCKED, quarter: Quarter.Q2, year: 2026, deadline: new Date("2026-06-15T23:59:59Z") },
    { id: "g8", employeeId: "emp2", title: "User research interviews", description: "Conduct interviews", thrustArea: "Research", uomType: UoMType.NUMERIC_MIN, target: 30, weightage: 30, status: GoalStatus.APPROVED_LOCKED, quarter: Quarter.Q2, year: 2026, deadline: new Date("2026-05-30T23:59:59Z") },
    { id: "g9", employeeId: "emp2", title: "Maximize design consistency", description: "Consistency score (higher is worse)", thrustArea: "Quality", uomType: UoMType.NUMERIC_MAX, target: 10, weightage: 20, status: GoalStatus.SUBMITTED, quarter: Quarter.Q2, year: 2026, deadline: new Date("2026-05-15T23:59:59Z") },
    { id: "g10", employeeId: "emp2", title: "Brand guidelines rollout", description: "Timeline for rollout", thrustArea: "Branding", uomType: UoMType.TIMELINE, target: 1, weightage: 20, status: GoalStatus.DRAFT, quarter: Quarter.Q2, year: 2026, deadline: new Date("2026-04-15T23:59:59Z") },
    // Rahul
    { id: "g11", employeeId: "emp3", title: "Unit test coverage", description: "Coverage percentage", thrustArea: "Quality", uomType: UoMType.PERCENTAGE, target: 100, weightage: 50, status: GoalStatus.APPROVED_LOCKED, quarter: Quarter.Q2, year: 2026, deadline: new Date("2026-06-30T23:59:59Z") },
    { id: "g12", employeeId: "emp3", title: "Security vulnerabilities", description: "Zero vulns found", thrustArea: "Security", uomType: UoMType.ZERO_BASED, target: 1, weightage: 50, status: GoalStatus.APPROVED_LOCKED, quarter: Quarter.Q2, year: 2026, deadline: new Date("2026-05-31T23:59:59Z") },
    // Tina
    { id: "g13", employeeId: "emp4", title: "Social media engagement rate", description: "Engagement percentage", thrustArea: "Growth", uomType: UoMType.NUMERIC_MIN, target: 8.5, weightage: 100, status: GoalStatus.APPROVED_LOCKED, quarter: Quarter.Q2, year: 2026, deadline: new Date("2026-06-30T23:59:59Z") }
  ];

  await prisma.goal.createMany({ data: goals });

  // Quarterly Updates
  const updates = [
    { id: "u1", goalId: "g1", quarter: Quarter.Q2, achievement: 15, status: UpdateStatus.ON_TRACK, comment: "Optimized caching layer", progressScore: 100 },
    { id: "u2", goalId: "g2", quarter: Quarter.Q2, achievement: 0, status: UpdateStatus.COMPLETED, comment: "Zero incidents this quarter", progressScore: 100 },
    { id: "u3", goalId: "g3", quarter: Quarter.Q2, achievement: 87, status: UpdateStatus.ON_TRACK, comment: "Most PRs reviewed", progressScore: 87 },
    { id: "u4", goalId: "g7", quarter: Quarter.Q2, achievement: 28, status: UpdateStatus.ON_TRACK, comment: "28 components built", progressScore: 70 },
    { id: "u5", goalId: "g8", quarter: Quarter.Q2, achievement: 32, status: UpdateStatus.COMPLETED, comment: "Exceeded target", progressScore: 106.7 },
    { id: "u6", goalId: "g9", quarter: Quarter.Q2, achievement: 25, status: UpdateStatus.AT_RISK, comment: "Inconsistency score worsened", progressScore: 40 },
    { id: "u7", goalId: "g11", quarter: Quarter.Q2, achievement: 100, status: UpdateStatus.COMPLETED, comment: "Full coverage achieved", progressScore: 100 },
    { id: "u8", goalId: "g12", quarter: Quarter.Q2, achievement: 3, status: UpdateStatus.BLOCKED, comment: "3 vulns found in audit", progressScore: 0 },
    { id: "u9", goalId: "g13", quarter: Quarter.Q2, achievement: 7.2, status: UpdateStatus.ON_TRACK, comment: "7.2% engagement rate", progressScore: 84.7 }
  ];


  await prisma.quarterlyUpdate.createMany({ data: updates });

  // Approvals
  const approvals = [
    { id: "a1", goalId: "g1", managerId: "mgr1", action: ApprovalAction.APPROVED, comment: "Target achievable", timestamp: new Date("2026-04-10T10:00:00Z") },
    { id: "a2", goalId: "g2", managerId: "mgr1", action: ApprovalAction.APPROVED, comment: "Zero is clear target", timestamp: new Date("2026-04-12T14:00:00Z") },
    { id: "a3", goalId: "g3", managerId: "mgr1", action: ApprovalAction.EDITED, comment: "Increased target to 95", timestamp: new Date("2026-04-15T09:00:00Z") },
    { id: "a4", goalId: "g7", managerId: "mgr1", action: ApprovalAction.APPROVED, comment: "Good scope", timestamp: new Date("2026-04-05T11:00:00Z") },
    { id: "a5", goalId: "g8", managerId: "mgr1", action: ApprovalAction.APPROVED, comment: "30 interviews is solid", timestamp: new Date("2026-04-08T16:00:00Z") },
    { id: "a6", goalId: "g9", managerId: "mgr1", action: ApprovalAction.RETURNED, comment: "Clarify the MAX logic", timestamp: new Date("2026-04-20T10:00:00Z") },
    { id: "a7", goalId: "g11", managerId: "mgr1", action: ApprovalAction.APPROVED, comment: "100% coverage is ambitious", timestamp: new Date("2026-04-02T08:00:00Z") },
    { id: "a8", goalId: "g12", managerId: "mgr1", action: ApprovalAction.APPROVED, comment: "Zero vulns expected", timestamp: new Date("2026-04-03T13:00:00Z") },
    { id: "a9", goalId: "g13", managerId: "mgr2", action: ApprovalAction.APPROVED, comment: "8.5% is industry standard", timestamp: new Date("2026-04-01T09:00:00Z") }
  ];

  await prisma.approval.createMany({ data: approvals });
  
  // Shared Goal
  await prisma.sharedGoal.create({
    data: { id: "sg1", departmentId: "dept_eng", title: "Security compliance audit", description: "Annual security review", thrustArea: "Security", uomType: UoMType.ZERO_BASED, target: 1, createdById: "mgr1" }
  });

  // Calendar Events
  await prisma.calendarEvent.createMany({
    data: [
      { id: "c1", title: "Q2 Goal Review", date: new Date("2026-05-15T10:00:00Z"), type: "GOAL_REVIEW", relatedId: "g1", description: "Review API latency progress" },
      { id: "c2", title: "Innovation Pitch Day", date: new Date("2026-05-20T14:00:00Z"), type: "INNOVATION_REVIEW", relatedId: null, description: "Team innovation presentations" },
      { id: "c3", title: "Sprint Retrospective", date: new Date("2026-05-10T09:00:00Z"), type: "MEETING", relatedId: null, description: "Bi-weekly retro" },
      { id: "c4", title: "Security Audit Deadline", date: new Date("2026-05-25T23:59:00Z"), type: "GOAL_REVIEW", relatedId: "sg1", description: "Shared goal deadline" }
    ]
  });

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
