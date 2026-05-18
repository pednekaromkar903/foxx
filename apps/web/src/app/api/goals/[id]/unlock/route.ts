import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@atomberg/database";
import { createAuditLog } from "@/lib/audit";

// POST /api/goals/:id/unlock  — ADMIN only
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const goal = await prisma.goal.findUnique({ where: { id: id } });
    if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const { reason } = body;

    const updated = await prisma.goal.update({
      where: { id: id },
      data: { status: ('ADMIN_UNLOCKED' as unknown as GoalStatus) },
    });

    await Promise.all([
      prisma.approval.create({
        data: { goalId: id, managerId: session.user.id, action: "UNLOCKED", comment: reason },
      }),
      createAuditLog({
        entityType: "GOAL", entityId: id,
        fieldName: "status", oldValue: goal.status, newValue: "ADMIN_UNLOCKED",
        changedById: session.user.id,
      }),
    ]);

    return NextResponse.json({ ...updated, deadline: updated.deadline?.toISOString() ?? null });
  } catch (error) {
    return NextResponse.json({ error: "Failed to unlock" }, { status: 500 });
  }
}
