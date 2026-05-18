import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireRole } from "@/lib/auth";
import { prisma } from "@atomberg/database";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const roleError = requireRole(session, ["MANAGER", "ADMIN"]);
  if (roleError) return roleError;

  try {
    const whereCondition: any = session?.user?.role === "MANAGER" ? { managerId: session.user.id } : { role: "EMPLOYEE" };
    const members = await prisma.user.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        goals: true,
      },
    });

    const serialized = members.map(m => ({
      ...m,
      goals: m.goals.map(g => ({
        ...g,
        deadline: g.deadline?.toISOString() ?? null
      }))
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Team fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch team data" }, { status: 500 });
  }
}
