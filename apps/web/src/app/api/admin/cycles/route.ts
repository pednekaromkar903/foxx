import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireRole } from "@/lib/auth";
import { prisma } from "@atomberg/database";

// GET/POST /api/admin/cycles
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const roleError = requireRole(session, ["ADMIN"]);
  if (roleError) return roleError;

  try {
    const cycles = await prisma.cycleWindow.findMany({ orderBy: [{ year: "desc" }, { quarter: "asc" }] });
    return NextResponse.json(cycles.map((c) => ({
      ...c,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate.toISOString(),
    })));
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const roleError = requireRole(session, ["ADMIN"]);
  if (roleError) return roleError;

  try {
    const body = await req.json();
    const { id, isActive } = body;

    if (id) {
      // Toggle existing cycle
      const updated = await prisma.cycleWindow.update({
        where: { id },
        data: { isActive },
      });
      return NextResponse.json({ ...updated, startDate: updated.startDate.toISOString(), endDate: updated.endDate.toISOString() });
    }

    // Create new cycle
    const { quarter, year, phase, startDate, endDate } = body;
    const cycle = await prisma.cycleWindow.create({
      data: { quarter, year, phase, startDate: new Date(startDate), endDate: new Date(endDate), isActive: true },
    });
    return NextResponse.json({ ...cycle, startDate: cycle.startDate.toISOString(), endDate: cycle.endDate.toISOString() });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
