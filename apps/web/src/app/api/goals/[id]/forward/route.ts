import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@atomberg/database";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || !["MANAGER", "ADMIN"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const goal = await prisma.goal.findUnique({ where: { id: id } });
    if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const role = session.user.role;
    let nextStatus: string;
    let validStatuses: string[];

    if (role === "MANAGER") {
      // Manager can forward from SUBMITTED_TO_MANAGER (escalate) or MANAGER_APPROVED (after approving)
      validStatuses = ["SUBMITTED_TO_MANAGER", "MANAGER_APPROVED"];
      if (!validStatuses.includes(goal.status)) {
        return NextResponse.json({ error: "Goal cannot be forwarded in its current state" }, { status: 400 });
      }
      nextStatus = "SENT_TO_ADMIN";
    } else if (role === "ADMIN") {
      // Admin can forward from MANAGER_APPROVED (not yet approved by admin) or ADMIN_APPROVED
      validStatuses = ["MANAGER_APPROVED", "SENT_TO_ADMIN", "ADMIN_APPROVED"];
      if (!validStatuses.includes(goal.status)) {
        return NextResponse.json({ error: "Goal cannot be forwarded in its current state" }, { status: 400 });
      }
      nextStatus = "SENT_TO_HR";
    } else {
      return NextResponse.json({ error: "Invalid role for forwarding" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { comment } = body;

    const [updated] = await Promise.all([
      prisma.goal.update({ where: { id: id }, data: { status: nextStatus as any } }),
      prisma.approval.create({
        data: { goalId: id, managerId: session.user.id, action: "FORWARDED", comment },
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
    return NextResponse.json({ error: "Failed to forward goal" }, { status: 500 });
  }
}
