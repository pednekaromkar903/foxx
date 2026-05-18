import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireRole } from "@/lib/auth";
import { prisma } from "@atomberg/database";

// GET /api/manager/pending — Approval queue
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const roleError = requireRole(session, ["MANAGER", "ADMIN", "HR"]);
  if (roleError) return roleError;

  try {
    const role = session.user.role as string;
    let where: any = {};

    if (role === "MANAGER") {
      // Managers see all goals of their direct reports + department members
      // But we return all statuses here and let frontend filter by column
      where = {
        AND: [
          {
            employee: {
              OR: [
                { managerId: session.user.id },
                { departmentId: session.user.departmentId }
              ]
            }
          },
          { employeeId: { not: session.user.id } }
        ]
      };
    } else if (role === "ADMIN") {
      // Admin sees goals that have been forwarded to them (SENT_TO_ADMIN) 
      // or need approval (MANAGER_APPROVED)
      where = {
        status: {
          in: ["MANAGER_APPROVED", "SENT_TO_ADMIN"]
        }
      };
    } else if (role === "HR") {
      // HR sees goals that have been forwarded to them (SENT_TO_HR)
      // or need approval (ADMIN_APPROVED)
      where = {
        status: {
          in: ["ADMIN_APPROVED", "SENT_TO_HR"]
        }
      };
    }

    const goals = await prisma.goal.findMany({
      where,
      include: {
        employee: { 
          select: { 
            name: true, 
            email: true, 
            department: { select: { name: true } } 
          } 
        },
        approvals: { 
          orderBy: { timestamp: "desc" }, 
          include: { manager: { select: { name: true } } } 
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(goals.map((g) => ({
      ...g,
      deadline: g.deadline?.toISOString() ?? null,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
      approvals: g.approvals.map((a) => ({ ...a, timestamp: a.timestamp.toISOString() })),
    })));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch pending goals" }, { status: 500 });
  }
}
