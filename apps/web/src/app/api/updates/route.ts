import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@atomberg/database";
import { calculateProgress } from "@/lib/progress";
import { createAuditLog } from "@/lib/audit";

// GET + POST quarterly updates
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const goalId = searchParams.get("goalId");
  const quarter = searchParams.get("quarter");

  try {
    const where: Record<string, unknown> = {};
    if (goalId) where.goalId = goalId;
    if (quarter) where.quarter = quarter;

    const updates = await prisma.quarterlyUpdate.findMany({
      where,
      include: { goal: { select: { title: true, uomType: true, target: true, deadline: true } } },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(updates.map((u) => ({
      ...u,
      updatedAt: u.updatedAt.toISOString(),
    })));
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch updates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { goalId, quarter, achievement, status, comment } = body;

    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    // Cycle Window Enforcement
    if (session.user.role === "EMPLOYEE") {
      const window = await prisma.cycleWindow.findFirst({ where: { quarter: quarter || goal.quarter, isActive: true } });
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

    // Employee can only update their own goals
    if (session.user.role === "EMPLOYEE" && goal.employeeId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Calculate progress score
    const progressScore = calculateProgress(
      goal.uomType as "NUMERIC_MIN" | "NUMERIC_MAX" | "PERCENTAGE" | "TIMELINE" | "ZERO_BASED",
      goal.target,
      Number(achievement ?? 0),
      goal.deadline ?? undefined
    );

    // Upsert the update
    const update = await prisma.quarterlyUpdate.upsert({
      where: { goalId_quarter: { goalId, quarter } } as never,
      create: { goalId, quarter, achievement: Number(achievement), status, comment, progressScore },
      update: { achievement: Number(achievement), status, comment, progressScore, updatedAt: new Date() },
    });

    // Propagate if shared
    if (goal.sharedGoalId) {
      const sharedRef = await prisma.sharedGoal.findUnique({ where: { id: goal.sharedGoalId } });
      if (sharedRef && (sharedRef.createdById === session.user.id || session.user.role === "MANAGER" || session.user.role === "ADMIN")) {
        const linkedGoals = await prisma.goal.findMany({ where: { sharedGoalId: goal.sharedGoalId } });
        await Promise.all(linkedGoals.map(lg => {
          if (lg.id === goal.id) return Promise.resolve();
          return prisma.quarterlyUpdate.upsert({
            where: { goalId_quarter: { goalId: lg.id, quarter } } as never,
            create: { goalId: lg.id, quarter, achievement: Number(achievement), status, comment, progressScore },
            update: { achievement: Number(achievement), status, comment, progressScore, updatedAt: new Date() },
          });
        }));
      }
    }

    await createAuditLog({
      entityType: "QUARTERLY_UPDATE", entityId: update.id,
      fieldName: "achievement", oldValue: undefined, newValue: String(achievement),
      changedById: session.user.id,
    });

    return NextResponse.json({ ...update, updatedAt: update.updatedAt.toISOString() });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save update" }, { status: 500 });
  }
}
