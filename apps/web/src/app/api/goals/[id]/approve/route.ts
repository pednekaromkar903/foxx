import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@atomberg/database";
import { createAuditLog } from "@/lib/audit";

// POST /api/goals/:id/approve
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

    if (role === "MANAGER") {
      if (goal.status !== "SUBMITTED_TO_MANAGER") return NextResponse.json({ error: "Goal not in manager pending state" }, { status: 400 });
      nextStatus = "MANAGER_APPROVED";
    } else if (role === "ADMIN") {
      if (!["MANAGER_APPROVED", "SENT_TO_ADMIN"].includes(goal.status)) return NextResponse.json({ error: "Goal not in admin pending state" }, { status: 400 });
      nextStatus = "ADMIN_APPROVED";
    } else if (role === "HR") {
      if (!["ADMIN_APPROVED", "SENT_TO_HR"].includes(goal.status)) return NextResponse.json({ error: "Goal not in HR pending state" }, { status: 400 });
      nextStatus = "HR_APPROVED";
    } else {
      return NextResponse.json({ error: "Invalid role for approval" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { comment } = body;

    const [updated] = await Promise.all([
      prisma.goal.update({ where: { id: id }, data: { status: nextStatus as any } }),
      prisma.approval.create({
        data: { goalId: id, managerId: session.user.id, action: "APPROVED", comment },
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
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }
}
