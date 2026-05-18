import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@atomberg/database";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const totalComplaints = await prisma.complaintEmail.count();
    const resolvedComplaints = await prisma.complaintEmail.count({ where: { isResolved: true } });
    const categories = await prisma.complaintEmail.groupBy({
      by: ['category'],
      _count: { id: true },
    });

    return NextResponse.json({
      total: totalComplaints,
      resolved: resolvedComplaints,
      pending: totalComplaints - resolvedComplaints,
      categories: categories.map(c => ({ name: c.category || "Uncategorized", count: c._count.id })),
      growth: 12.5 // Mock growth
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
