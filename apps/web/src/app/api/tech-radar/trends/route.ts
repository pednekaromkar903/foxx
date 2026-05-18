import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@atomberg/database";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const trends = await prisma.technologyTrend.findMany({
      orderBy: { impactScore: "desc" }
    });
    return NextResponse.json(trends);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch trends" }, { status: 500 });
  }
}
