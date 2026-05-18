import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireRole } from "@/lib/auth";
import { prisma, GoalStatus } from "@atomberg/database";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const roleError = requireRole(session, ["ADMIN"]);
  if (roleError) return roleError;

  try {
    const [totalGoals, submittedGoals, approvedGoals, completedGoals] = await Promise.all([
      prisma.goal.count(),
      prisma.goal.count({ where: { status: "SUBMITTED_TO_MANAGER" } }),
      prisma.goal.count({ where: { status: "MANAGER_APPROVED" } }),
      prisma.goal.count({ where: { status: "COMPLETED" } }),
    ]);

    const submissionRate = totalGoals > 0 ? Math.round((submittedGoals / totalGoals) * 100) : 0;
    const approvalRate = submittedGoals > 0 ? Math.round((approvedGoals / submittedGoals) * 100) : 0;
    
    const checkinRate = await prisma.quarterlyUpdate.count(); // Simplified for now

    const managers = await prisma.user.findMany({
      where: { role: "MANAGER" },
      include: {
        approvals: {
          where: { action: "APPROVED" },
          select: { id: true, timestamp: true, goal: { select: { updatedAt: true } } }
        }
      }
    });

    const managerScores = managers.map(m => {
      const approvedCount = m.approvals.length;
      return {
        id: m.id,
        name: m.name,
        approvedCount,
        avgHours: 24 // Mock for now as complex calculation needed
      };
    });

    return NextResponse.json({
      submissionRate,
      approvalRate,
      checkinRate: 65, // Mocking checkin rate for now
      managerScores
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
