import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, GoalStatus } from "@atomberg/database";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const goal = await prisma.goal.findUnique({
      where: { id: id },
      include: {
        employee: { select: { name: true, email: true } },
        updates: { orderBy: { updatedAt: "desc" } },
        approvals: { orderBy: { timestamp: "desc" }, include: { manager: { select: { name: true } } } },
      },
    });
    if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (session.user.role === "EMPLOYEE" && goal.employeeId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      ...goal,
      deadline: goal.deadline?.toISOString() ?? null,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
      updates: goal.updates.map((u) => ({ ...u, updatedAt: u.updatedAt.toISOString() })),
      approvals: goal.approvals.map((a) => ({ ...a, timestamp: a.timestamp.toISOString() })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const existing = await prisma.goal.findUnique({ where: { id: id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();

    if (session.user.role === "EMPLOYEE") {
      const window = await prisma.cycleWindow.findFirst({ where: { quarter: existing.quarter, isActive: true } });
      const override = req.headers.get("x-admin-override") === "true";
      if (!window && !override) {
        return NextResponse.json({ error: "Window closed for the requested quarter." }, { status: 400 });
      }
      if (override) {
        await createAuditLog({
          entityType: "SYSTEM", entityId: "WINDOW_OVERRIDE",
          fieldName: "override", oldValue: "false", newValue: "true",
          changedById: session.user.id,
        });
      }
    }

    if (existing.status === ('APPROVED_LOCKED' as GoalStatus)) {
      if (session.user.role === "ADMIN" && body.action === "unlock") {
        const updated = await prisma.goal.update({ where: { id: id }, data: { status: ('ADMIN_UNLOCKED' as unknown as GoalStatus) } });
        await createAuditLog({ entityType: "GOAL", entityId: id, fieldName: "status", oldValue: "APPROVED_LOCKED", newValue: "ADMIN_UNLOCKED", changedById: session.user.id });
        return NextResponse.json({ ...updated, deadline: updated.deadline?.toISOString() ?? null });
      } else {
        return NextResponse.json({ error: "Goal is locked and cannot be edited." }, { status: 403 });
      }
    }

    if (session.user.role === "EMPLOYEE" && existing.employeeId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, description, thrustArea, uomType, target, weightage, deadline } = body;

    if (weightage !== undefined) {
      if (Number(weightage) < 10) return NextResponse.json({ error: "Minimum weightage per goal is 10%." }, { status: 400 });
      const allGoals = await prisma.goal.findMany({ where: { employeeId: existing.employeeId } });
      const otherTotal = allGoals.filter(g => g.id !== id).reduce((sum, g) => sum + g.weightage, 0);
      if (otherTotal + Number(weightage) > 100) {
         return NextResponse.json({ error: "Total weightage cannot exceed 100%." }, { status: 400 });
      }
    }

    const changes: Record<string, [string, string]> = {};
    if (title && title !== existing.title) changes.title = [existing.title, title];
    if (target !== undefined && target !== existing.target) changes.target = [String(existing.target), String(target)];
    if (weightage !== undefined && weightage !== existing.weightage) changes.weightage = [String(existing.weightage), String(weightage)];

    const isManagerEdit = (session.user.role === "MANAGER" || session.user.role === "ADMIN") && existing.status === GoalStatus.SUBMITTED_TO_MANAGER;
    const statusChangedToRework = isManagerEdit && (changes.target || changes.weightage);
    if (statusChangedToRework) {
      changes.status = [GoalStatus.SUBMITTED_TO_MANAGER, GoalStatus.RETURNED_FOR_REWORK];
    } else if (existing.status === GoalStatus.RETURNED_FOR_REWORK && session.user.role === "EMPLOYEE") {
      changes.status = [GoalStatus.RETURNED_FOR_REWORK, GoalStatus.DRAFT];
    }

    const updated = await prisma.goal.update({
      where: { id: id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(thrustArea && { thrustArea }),
        ...(uomType && { uomType }),
        ...(target !== undefined && { target: Number(target) }),
        ...(weightage !== undefined && { weightage: Number(weightage) }),
        ...(deadline && { deadline: new Date(deadline) }),
        ...(statusChangedToRework ? { status: "RETURNED_FOR_REWORK" } : existing.status === "RETURNED_FOR_REWORK" && session.user.role === "EMPLOYEE" ? { status: "DRAFT" } : {}),
      },
    });

    for (const [field, [oldVal, newVal]] of Object.entries(changes)) {
      await createAuditLog({ entityType: "GOAL", entityId: id, fieldName: field, oldValue: oldVal, newValue: newVal, changedById: session.user.id });
    }

    return NextResponse.json({ ...updated, deadline: updated.deadline?.toISOString() ?? null });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const goal = await prisma.goal.findUnique({ where: { id: id } });
    if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (goal.status !== "DRAFT") {
      return NextResponse.json({ error: "Only DRAFT goals can be deleted." }, { status: 400 });
    }
    if (session.user.role === "EMPLOYEE" && goal.employeeId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.goal.delete({ where: { id: id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
