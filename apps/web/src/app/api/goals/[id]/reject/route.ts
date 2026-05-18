import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@atomberg/database";
import { createAuditLog } from "@/lib/audit";

// POST /api/goals/:id/reject
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || !["MANAGER", "ADMIN", "HR"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const goal = await prisma.goal.findUnique({ where: { id: id } });
    if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const role = session.user.role;
    let nextStatus: string;
    let validStatuses: string[];

    if (role === "MANAGER") {
      // Manager can only reject goals in pending state
      validStatuses = ["SUBMITTED_TO_MANAGER"];
      if (!validStatuses.includes(goal.status)) {
        return NextResponse.json({ error: "Goal cannot be rejected in its current state" }, { status: 400 });
      }
      nextStatus = "MANAGER_REJECTED";
    } else if (role === "ADMIN") {
      // Admin can reject goals in their pending states
      validStatuses = ["MANAGER_APPROVED", "SENT_TO_ADMIN"];
      if (!validStatuses.includes(goal.status)) {
        return NextResponse.json({ error: "Goal cannot be rejected in its current state" }, { status: 400 });
      }
      nextStatus = "ADMIN_REJECTED";
    } else if (role === "HR") {
      // HR can reject goals in their pending states
      validStatuses = ["ADMIN_APPROVED", "SENT_TO_HR"];
      if (!validStatuses.includes(goal.status)) {
        return NextResponse.json({ error: "Goal cannot be rejected in its current state" }, { status: 400 });
      }
      nextStatus = "HR_REJECTED";
    } else {
      return NextResponse.json({ error: "Invalid role for rejection" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { comment, reason } = body;
    const finalReason = reason || comment || "No reason provided";

    const [updated] = await Promise.all([
      prisma.goal.update({ 
        where: { id: id }, 
        data: { 
          status: nextStatus as any,
          returnReason: finalReason
        } 
      }),
      prisma.approval.create({
        data: { goalId: id, managerId: session.user.id, action: "REJECTED", comment: finalReason },
      }),
    ]);

    await createAuditLog({
      entityType: "GOAL", entityId: id,
      fieldName: "status", oldValue: goal.status, newValue: nextStatus,
      changedById: session.user.id,
    });

    return NextResponse.json({ ...updated, deadline: updated.deadline?.toISOString() ?? null });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to reject goal" }, { status: 500 });
  }
}
