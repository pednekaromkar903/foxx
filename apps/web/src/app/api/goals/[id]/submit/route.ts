import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@atomberg/database";
import { validateWeightages } from "@/lib/progress";
import { createAuditLog } from "@/lib/audit";

// POST /api/goals/:id/submit
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const goal = await prisma.goal.findUnique({ where: { id: id } });
    if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (goal.employeeId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (goal.status !== "DRAFT" && goal.status !== "RETURNED_FOR_REWORK") {
      return NextResponse.json({ error: "Goal cannot be submitted in its current state." }, { status: 400 });
    }

    // Validate: incomplete goal check
    if (!goal.title?.trim() || !goal.uomType || !goal.target) {
      return NextResponse.json({ error: "Cannot submit incomplete goal. Fill all fields." }, { status: 400 });
    }

    // Validate all goals' total weightage = 100%
    const allGoals = await prisma.goal.findMany({ where: { employeeId: session.user.id } });
    const { valid, errors } = validateWeightages(allGoals.map((g) => g.weightage));
    if (!valid) return NextResponse.json({ error: errors.join(" ") }, { status: 400 });

    const updated = await prisma.goal.update({
      where: { id: id },
      data: { status: "SUBMITTED_TO_MANAGER" },
    });

    await createAuditLog({
      entityType: "GOAL", entityId: id,
      fieldName: "status", oldValue: goal.status, newValue: "SUBMITTED_TO_MANAGER",
      changedById: session.user.id,
    });

    return NextResponse.json({ ...updated, deadline: updated.deadline?.toISOString() ?? null });
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
