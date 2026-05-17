import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  console.log(await prisma.goal.create({
    data: {
      id: "goal-test-1", title: "Test",
      status: "BEHIND", thrustArea: "Test", uomType: "MIN",
      weightage: 10, targetValue: 10, actualValue: 5,
      categoryType: "RND", cycleId: "test-cycle",
      employeeId: "user-admin"
    }
  }));
}
main().catch(console.error);
