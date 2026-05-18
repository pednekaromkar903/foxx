import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireRole } from "@/lib/auth";
import { prisma } from "@atomberg/database";

// GET /api/admin/audit-logs
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const roleError = requireRole(session, ["ADMIN"]);
  if (roleError) return roleError;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const entityType = searchParams.get("entityType");

  try {
    const where: Record<string, unknown> = {};
    if (entityType) where.entityType = entityType;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { changedBy: { select: { name: true, email: true, role: true } } },
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs: logs.map((l) => ({ ...l, timestamp: l.timestamp.toISOString() })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
