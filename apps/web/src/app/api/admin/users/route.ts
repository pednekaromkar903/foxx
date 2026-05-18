import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireRole } from "@/lib/auth";
import { prisma } from "@atomberg/database";

// GET /api/admin/users
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const roleError = requireRole(session, ["ADMIN"]);
  if (roleError) return roleError;

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true,
        department: { select: { name: true } },
        manager: { select: { name: true } },
        _count: { select: { goals: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
