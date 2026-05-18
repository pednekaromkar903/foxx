import { prisma } from '../../apps/api/src/lib/prisma';
import * as GoalsController from '../../apps/api/src/modules/goals/goals.controller';

async function run() {
  console.log('Starting approval smoke tests');

  const admin = await prisma.user.findUnique({ where: { email: 'admin@atomberg.com' } });
  const manager = await prisma.user.findUnique({ where: { email: 'manager@atomberg.com' } });
  const employee = await prisma.user.findUnique({ where: { email: 'amit@atomberg.com' } });

  if (!admin || !manager || !employee) {
    console.error('Required seeded users not found. Ensure db:seed has run.');
    process.exit(1);
  }

  // Ensure employee has a single goal totalling 100% so submission succeeds
  const existing = await prisma.goal.findMany({ where: { employeeId: employee.id } });
  if (existing.length === 0) {
    console.log('Creating test goal for employee');
    await prisma.goal.create({
      data: {
        title: 'Smoke Test Goal',
        description: 'Auto-created goal for approval smoke tests',
        thrustArea: 'RND',
        uomType: 'TIMELINE',
        targetValue: 1,
        weightage: 100,
        categoryType: 'RND',
        employeeId: employee.id,
        status: 'NOT_STARTED'
      }
    });
  } else {
    // Overwrite first goal's weightage to 100
    await prisma.goal.update({ where: { id: existing[0].id }, data: { weightage: 100, status: 'NOT_STARTED' } });
  }

  const goal = await prisma.goal.findFirst({ where: { employeeId: employee.id }, orderBy: { createdAt: 'desc' } });
  if (!goal) {
    console.error('Failed to create/find test goal');
    process.exit(1);
  }

  // Helper to mock express req/res
  const makeReq = (user: any, params: any = {}, body: any = {}) => ({ params, user, body, ip: '127.0.0.1' });
  const makeRes = () => {
    return {
      status(code: number) {
        this._status = code; return this;
      },
      json(payload: any) {
        console.log('RES:', this._status || 200, JSON.stringify(payload));
        return payload;
      }
    } as any;
  };

  // Submit goal as employee
  console.log('\n--> SUBMIT GOAL as employee');
  try {
    const req = makeReq(employee, { id: goal.id }, {});
    const res = makeRes();
    await (GoalsController.submitGoal as any)(req, res, (e: any) => { throw e; });
  } catch (e) {
    console.error('Submit failed', e);
  }

  // Approve goal as manager
  console.log('\n--> APPROVE GOAL as manager');
  try {
    const req = makeReq(manager, { id: goal.id }, {});
    const res = makeRes();
    await (GoalsController.approveGoal as any)(req, res, (e: any) => { throw e; });
  } catch (e) {
    console.error('Approve failed', e);
  }

  // Check final state
  const final = await prisma.goal.findUnique({ where: { id: goal.id } });
  console.log('\nFinal goal state:', { id: final?.id, status: final?.status, approvedBy: final?.approvedBy, lockedAt: final?.lockedAt });

  // Test reject flow: create a second goal and reject
  console.log('\n--> REJECT FLOW');
  const g2 = await prisma.goal.create({
    data: {
      title: 'Reject Test Goal',
      description: 'For reject flow',
      thrustArea: 'RND',
      uomType: 'TIMELINE',
      targetValue: 1,
      weightage: 100,
      categoryType: 'RND',
      employeeId: employee.id,
      status: 'PENDING'
    }
  });

  try {
    const req = makeReq(manager, { id: g2.id }, { comment: 'Needs rework' });
    const res = makeRes();
    await (GoalsController.rejectGoal as any)(req, res, (e: any) => { throw e; });
  } catch (e) {
    console.error('Reject failed', e);
  }

  const afterReject = await prisma.goal.findUnique({ where: { id: g2.id } });
  console.log('After reject state:', { id: afterReject?.id, status: afterReject?.status });

  console.log('\nApproval smoke tests completed');
  process.exit(0);
}

run().catch(e => { console.error('Smoke tests error', e); process.exit(1); });
