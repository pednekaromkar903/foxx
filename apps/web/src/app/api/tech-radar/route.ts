import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@atomberg/database";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !["MANAGER", "ADMIN"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await prisma.techRadarItem.findMany({
      include: {
        addedBy: { select: { name: true } },
      },
    });

    const serialized = items.map(i => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tech radar items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !["MANAGER", "ADMIN"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, quadrant, ring, description } = body;

    const item = await prisma.techRadarItem.create({
      data: {
        name,
        quadrant,
        ring,
        description,
        addedById: session.user.id,
      },
    });

    return NextResponse.json({ ...item, createdAt: item.createdAt.toISOString() });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
