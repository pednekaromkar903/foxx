import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, GoalStatus } from "@atomberg/database";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userId = session.user.id;
    const role = session.user.role as string;
    const notifications = [];

    // 1. Returned Goals (for Employee)
    if (role === "EMPLOYEE") {
      const returnedGoals = await prisma.goal.findMany({
        where: { employeeId: userId, status: GoalStatus.RETURNED_FOR_REWORK },
        select: { id: true, title: true, updatedAt: true }
      });
      for (const g of returnedGoals) {
        notifications.push({
          id: `goal-returned-${g.id}`,
          title: "Goal Returned",
          description: `Your goal "${g.title}" was returned for rework.`,
          timestamp: g.updatedAt.toISOString(),
          type: "goal",
          read: false
        });
      }
    }

    // 2. Pending Approvals (for Manager)
    if (role === "MANAGER" || role === "ADMIN") {
      const pendingGoals = await prisma.goal.findMany({
        where: { 
          status: GoalStatus.SUBMITTED_TO_MANAGER,
          employee: {
            OR: [
              { managerId: userId },
              { departmentId: session.user.departmentId }
            ]
          }
        },
        select: { id: true, title: true, employee: { select: { name: true } } }
      });
      for (const g of pendingGoals) {
        notifications.push({
          id: `goal-pending-${g.id}`,
          title: "Pending Approval",
          description: `${g.employee.name} submitted "${g.title}" for approval.`,
          timestamp: new Date().toISOString(),
          type: "approval",
          read: false
        });
      }
    }

    // 3. Goals due in 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const upcomingGoals = await prisma.goal.findMany({
      where: {
        employeeId: userId,
        deadline: {
          lte: sevenDaysFromNow,
          gte: new Date()
        },
        status: { not: GoalStatus.COMPLETED }
      },
      select: { id: true, title: true, deadline: true }
    });
    for (const g of upcomingGoals) {
      notifications.push({
        id: `goal-due-${g.id}`,
        title: "Goal Deadline Approaching",
        description: `Your goal "${g.title}" is due on ${g.deadline?.toLocaleDateString()}.`,
        timestamp: new Date().toISOString(),
        type: "system",
        read: false
      });
    }

    // 4. Upcoming calendar events (next 24h)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const events = await prisma.calendarEvent.findMany({
      where: {
        userId: userId,
        date: {
          lte: tomorrow,
          gte: new Date()
        }
      }
    });
    for (const e of events) {
      notifications.push({
        id: `event-${e.id}`,
        title: "Upcoming Event",
        description: `${e.title} at ${e.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        timestamp: e.date.toISOString(),
        type: "calendar",
        read: false
      });
    }

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
