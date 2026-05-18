import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@atomberg/database";
import { validateWeightages } from "@/lib/progress";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const role = session.user.role;

    if (role === "ADMIN") {
      const goals = await prisma.goal.findMany({ include: { employee: { select: { id: true, name: true, email: true } } } });
      return NextResponse.json(goals.map(g => ({ ...g, deadline: g.deadline?.toISOString() ?? null, createdAt: g.createdAt.toISOString(), updatedAt: g.updatedAt.toISOString() })));
    }

    if (role === "MANAGER") {
      const team = await prisma.user.findMany({ where: { managerId: session.user.id }, select: { id: true } });
      const ids = team.map(t => t.id);
      const goals = await prisma.goal.findMany({ where: { employeeId: { in: ids } }, include: { employee: { select: { id: true, name: true, email: true } } } });
      return NextResponse.json(goals.map(g => ({ ...g, deadline: g.deadline?.toISOString() ?? null, createdAt: g.createdAt.toISOString(), updatedAt: g.updatedAt.toISOString() })));
    }

    // EMPLOYEE
    const goals = await prisma.goal.findMany({ where: { employeeId: session.user.id }, include: { employee: { select: { id: true, name: true, email: true } } } });
    return NextResponse.json(goals.map(g => ({ ...g, deadline: g.deadline?.toISOString() ?? null, createdAt: g.createdAt.toISOString(), updatedAt: g.updatedAt.toISOString() })));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { title, description, thrustArea, uomType, target, weightage, quarter, year, deadline, employeeId } = body;

    if (!title || !uomType || target === undefined || weightage === undefined || !quarter) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ownerId = session.user.role === "ADMIN" && employeeId ? employeeId : session.user.id;

    const created = await prisma.goal.create({
      data: {
        employeeId: ownerId,
        title,
        description,
        thrustArea,
        uomType,
        target: Number(target),
        weightage: Number(weightage),
        quarter,
        year: year ?? new Date().getFullYear(),
        deadline: deadline ? new Date(deadline) : undefined,
      },
    });

    return NextResponse.json({ ...created, deadline: created.deadline?.toISOString() ?? null });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();

    // Accept either an array of updates or a single update object
    if (Array.isArray(body)) {
      const weightages = body.map((g: any) => Number(g.weightage ?? 0));
      const { valid, errors } = validateWeightages(weightages);
      if (!valid) return NextResponse.json({ error: errors.join(" ") }, { status: 400 });

      const updated = await prisma.$transaction(
        body.map((g: any) => prisma.goal.update({ where: { id: g.id }, data: { weightage: Number(g.weightage) } }))
      );
      return NextResponse.json(updated);
    }

    // single update
    const { id, title, description, thrustArea, uomType, target, weightage, deadline, status } = body as any;
    if (!id) return NextResponse.json({ error: "Missing id for update" }, { status: 400 });

    const existing = await prisma.goal.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    // Basic RBAC: employees can only edit their own
    if (session.user.role === "EMPLOYEE" && existing.employeeId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (thrustArea !== undefined) data.thrustArea = thrustArea;
    if (uomType !== undefined) data.uomType = uomType;
    if (target !== undefined) data.target = Number(target);
    if (weightage !== undefined) data.weightage = Number(weightage);
    if (deadline !== undefined) data.deadline = deadline ? new Date(deadline) : null;
    if (status !== undefined) data.status = status;

    const updated = await prisma.goal.update({ where: { id }, data });
    return NextResponse.json({ ...updated, deadline: updated.deadline?.toISOString() ?? null });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update goals" }, { status: 500 });
  }
}
