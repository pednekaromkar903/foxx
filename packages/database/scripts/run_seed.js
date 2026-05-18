const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Seeding via packages/database script...');
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

    const deptEng = await prisma.department.create({ data: { id: 'dept_eng', name: 'Engineering' } });
    const deptDes = await prisma.department.create({ data: { id: 'dept_des', name: 'Design' } });
    const deptMkt = await prisma.department.create({ data: { id: 'dept_mkt', name: 'Marketing' } });

    const pwd = await bcrypt.hash('password123', 10);
    await prisma.user.create({ data: { id: 'admin1', email: 'admin@atomberg.com', name: 'Ravi Kumar', role: 'ADMIN', departmentId: 'dept_eng', password: pwd } });
    await prisma.user.create({ data: { id: 'mgr1', email: 'manager@atomberg.com', name: 'Priya Singh', role: 'MANAGER', departmentId: 'dept_eng', password: pwd } });
    await prisma.user.create({ data: { id: 'mgr2', email: 'neha@atomberg.com', name: 'Neha Gupta', role: 'MANAGER', departmentId: 'dept_des', password: pwd } });

    await prisma.user.create({ data: { id: 'emp1', email: 'amit@atomberg.com', name: 'Amit Sharma', role: 'EMPLOYEE', departmentId: 'dept_eng', managerId: 'mgr1', password: pwd } });
    await prisma.user.create({ data: { id: 'emp2', email: 'sneha@atomberg.com', name: 'Sneha Rao', role: 'EMPLOYEE', departmentId: 'dept_des', managerId: 'mgr1', password: pwd } });
    await prisma.user.create({ data: { id: 'emp3', email: 'rahul@atomberg.com', name: 'Rahul Verma', role: 'EMPLOYEE', departmentId: 'dept_eng', managerId: 'mgr1', password: pwd } });
    await prisma.user.create({ data: { id: 'emp4', email: 'tina@atomberg.com', name: 'Tina Das', role: 'EMPLOYEE', departmentId: 'dept_mkt', managerId: 'mgr2', password: pwd } });

    await prisma.cycleWindow.create({ data: { id: 'cw1', quarter: 'Q2', year: 2026, phase: 'EXECUTION', startDate: new Date('2026-04-01T00:00:00Z'), endDate: new Date('2026-06-30T23:59:59Z'), isActive: true } });

    const goals = [
      { id: "g1", employeeId: "emp1", title: "Reduce API P99 latency", description: "Lower from 20ms to target", thrustArea: "Performance", uomType: 'NUMERIC_MIN', target: 20, weightage: 15, status: 'APPROVED_LOCKED', quarter: 'Q2', year: 2026, deadline: new Date("2026-06-30T23:59:59Z") },
      { id: "g2", employeeId: "emp1", title: "Zero production incidents", description: "Zero critical bugs in prod", thrustArea: "Reliability", uomType: 'ZERO_BASED', target: 1, weightage: 15, status: 'APPROVED_LOCKED', quarter: 'Q2', year: 2026, deadline: new Date("2026-06-15T23:59:59Z") },
      { id: "g3", employeeId: "emp1", title: "Code review coverage", description: "PR review coverage percentage", thrustArea: "Quality", uomType: 'PERCENTAGE', target: 95, weightage: 20, status: 'SUBMITTED', quarter: 'Q2', year: 2026, deadline: new Date("2026-05-20T23:59:59Z") },
      { id: "g4", employeeId: "emp1", title: "Database query optimization", description: "Reduce max query time", thrustArea: "Performance", uomType: 'NUMERIC_MAX', target: 100, weightage: 20, status: 'DRAFT', quarter: 'Q2', year: 2026, deadline: new Date("2026-05-10T23:59:59Z") },
      { id: "g5", employeeId: "emp1", title: "Migrate to new auth system", description: "Timeline-based migration", thrustArea: "Security", uomType: 'TIMELINE', target: 1, weightage: 15, status: 'DRAFT', quarter: 'Q2', year: 2026, deadline: new Date("2026-04-30T23:59:59Z") },
      { id: "g6", employeeId: "emp1", title: "Team documentation", description: "Write technical docs", thrustArea: "Knowledge", uomType: 'NUMERIC_MIN', target: 50, weightage: 15, status: 'DRAFT', quarter: 'Q2', year: 2026, deadline: new Date("2026-06-01T23:59:59Z") },
      { id: "g7", employeeId: "emp2", title: "Design system components", description: "Build reusable UI kit", thrustArea: "Design", uomType: 'NUMERIC_MIN', target: 40, weightage: 30, status: 'APPROVED_LOCKED', quarter: 'Q2', year: 2026, deadline: new Date("2026-06-15T23:59:59Z") },
      { id: "g8", employeeId: "emp2", title: "User research interviews", description: "Conduct interviews", thrustArea: "Research", uomType: 'NUMERIC_MIN', target: 30, weightage: 30, status: 'APPROVED_LOCKED', quarter: 'Q2', year: 2026, deadline: new Date("2026-05-30T23:59:59Z") },
      { id: "g9", employeeId: "emp2", title: "Maximize design consistency", description: "Consistency score (higher is worse)", thrustArea: "Quality", uomType: 'NUMERIC_MAX', target: 10, weightage: 20, status: 'SUBMITTED', quarter: 'Q2', year: 2026, deadline: new Date("2026-05-15T23:59:59Z") },
      { id: "g10", employeeId: "emp2", title: "Brand guidelines rollout", description: "Timeline for rollout", thrustArea: "Branding", uomType: 'TIMELINE', target: 1, weightage: 20, status: 'DRAFT', quarter: 'Q2', year: 2026, deadline: new Date("2026-04-15T23:59:59Z") },
      { id: "g11", employeeId: "emp3", title: "Unit test coverage", description: "Coverage percentage", thrustArea: "Quality", uomType: 'PERCENTAGE', target: 100, weightage: 50, status: 'APPROVED_LOCKED', quarter: 'Q2', year: 2026, deadline: new Date("2026-06-30T23:59:59Z") },
      { id: "g12", employeeId: "emp3", title: "Security vulnerabilities", description: "Zero vulns found", thrustArea: "Security", uomType: 'ZERO_BASED', target: 1, weightage: 50, status: 'APPROVED_LOCKED', quarter: 'Q2', year: 2026, deadline: new Date("2026-05-31T23:59:59Z") },
      { id: "g13", employeeId: "emp4", title: "Social media engagement rate", description: "Engagement percentage", thrustArea: "Growth", uomType: 'NUMERIC_MIN', target: 8.5, weightage: 100, status: 'APPROVED_LOCKED', quarter: 'Q2', year: 2026, deadline: new Date("2026-06-30T23:59:59Z") }
    ];

    await prisma.goal.createMany({ data: goals });

    const updates = [
      { id: "u1", goalId: "g1", quarter: 'Q2', achievement: 15, status: 'ON_TRACK', comment: "Optimized caching layer" },
      { id: "u2", goalId: "g2", quarter: 'Q2', achievement: 0, status: 'COMPLETED', comment: "Zero incidents this quarter" },
      { id: "u3", goalId: "g3", quarter: 'Q2', achievement: 87, status: 'ON_TRACK', comment: "Most PRs reviewed" },
      { id: "u4", goalId: "g7", quarter: 'Q2', achievement: 28, status: 'ON_TRACK', comment: "28 components built" },
      { id: "u5", goalId: "g8", quarter: 'Q2', achievement: 32, status: 'COMPLETED', comment: "Exceeded target" },
      { id: "u6", goalId: "g9", quarter: 'Q2', achievement: 25, status: 'AT_RISK', comment: "Inconsistency score worsened" },
      { id: "u7", goalId: "g11", quarter: 'Q2', achievement: 100, status: 'COMPLETED', comment: "Full coverage achieved" },
      { id: "u8", goalId: "g12", quarter: 'Q2', achievement: 3, status: 'BLOCKED', comment: "3 vulns found in audit" },
      { id: "u9", goalId: "g13", quarter: 'Q2', achievement: 7.2, status: 'ON_TRACK', comment: "7.2% engagement rate" }
    ];

    await prisma.quarterlyUpdate.createMany({ data: updates });

    const approvals = [
      { id: "a1", goalId: "g1", managerId: "mgr1", action: 'APPROVED', comment: "Target achievable", timestamp: new Date("2026-04-10T10:00:00Z") },
      { id: "a2", goalId: "g2", managerId: "mgr1", action: 'APPROVED', comment: "Zero is clear target", timestamp: new Date("2026-04-12T14:00:00Z") },
      { id: "a3", goalId: "g3", managerId: "mgr1", action: 'EDITED', comment: "Increased target to 95", timestamp: new Date("2026-04-15T09:00:00Z") },
      { id: "a4", goalId: "g7", managerId: "mgr1", action: 'APPROVED', comment: "Good scope", timestamp: new Date("2026-04-05T11:00:00Z") },
      { id: "a5", goalId: "g8", managerId: "mgr1", action: 'APPROVED', comment: "30 interviews is solid", timestamp: new Date("2026-04-08T16:00:00Z") },
      { id: "a6", goalId: "g9", managerId: "mgr1", action: 'RETURNED', comment: "Clarify the MAX logic", timestamp: new Date("2026-04-20T10:00:00Z") },
      { id: "a7", goalId: "g11", managerId: "mgr1", action: 'APPROVED', comment: "100% coverage is ambitious", timestamp: new Date("2026-04-02T08:00:00Z") },
      { id: "a8", goalId: "g12", managerId: "mgr1", action: 'APPROVED', comment: "Zero vulns expected", timestamp: new Date("2026-04-03T13:00:00Z") },
      { id: "a9", goalId: "g13", managerId: "mgr2", action: 'APPROVED', comment: "8.5% is industry standard", timestamp: new Date("2026-04-01T09:00:00Z") }
    ];

    await prisma.approval.createMany({ data: approvals });

    await prisma.sharedGoal.create({ data: { id: "sg1", departmentId: "dept_eng", title: "Security compliance audit", description: "Annual security review", thrustArea: "Security", uomType: 'ZERO_BASED', target: 1, createdById: "mgr1" } });

    await prisma.calendarEvent.createMany({ data: [ { id: "c1", title: "Q2 Goal Review", date: new Date("2026-05-15T10:00:00Z"), type: "GOAL_REVIEW", relatedId: "g1", description: "Review API latency progress" }, { id: "c2", title: "Innovation Pitch Day", date: new Date("2026-05-20T14:00:00Z"), type: "INNOVATION_REVIEW", relatedId: null, description: "Team innovation presentations" }, { id: "c3", title: "Sprint Retrospective", date: new Date("2026-05-10T09:00:00Z"), type: "MEETING", relatedId: null, description: "Bi-weekly retro" }, { id: "c4", title: "Security Audit Deadline", date: new Date("2026-05-25T23:59:00Z"), type: "GOAL_REVIEW", relatedId: "sg1", description: "Shared goal deadline" } ] });

    console.log('✅ Seeds completed successfully!');
  } catch (e) {
    console.error('Seeding failed', e);
  } finally {
    await prisma.$disconnect();
  }
}

main().then(()=>process.exit(0)).catch(e=>{console.error('Unhandled seed error', e); process.exit(1);});
