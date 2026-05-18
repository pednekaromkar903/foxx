import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@atomberg/database";
import { createAuditLog } from "@/lib/audit";

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
    
    // All roles can return a goal from most states, but not from final states
    const invalidStatuses = ["MANAGER_REJECTED", "ADMIN_REJECTED", "HR_REJECTED", "COMPLETED"];
    if (invalidStatuses.includes(goal.status)) {
      return NextResponse.json({ error: "Goal cannot be returned in its current state" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { comment, reason } = body;
    const finalReason = reason || comment || "No reason provided";

    const [updated] = await Promise.all([
      prisma.goal.update({ 
        where: { id: id }, 
        data: { 
          status: "RETURNED_FOR_REWORK",
          returnReason: finalReason
        } 
      }),
      prisma.approval.create({
        data: { goalId: id, managerId: session.user.id, action: "RETURNED", comment: finalReason },
      }),
    ]);

    await createAuditLog({
      entityType: "GOAL", entityId: id,
      fieldName: "status", oldValue: goal.status, newValue: "RETURNED_FOR_REWORK",
      changedById: session.user.id,
    });

    return NextResponse.json({ ...updated, deadline: updated.deadline?.toISOString() ?? null });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to return goal" }, { status: 500 });
  }
}
