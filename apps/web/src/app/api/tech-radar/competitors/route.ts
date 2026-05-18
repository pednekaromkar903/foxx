import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@atomberg/database";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const competitors = await prisma.competitor.findMany({
      include: { products: true },
      orderBy: { marketImpact: "desc" }
    });
    return NextResponse.json(competitors);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch competitors" }, { status: 500 });
  }
}
