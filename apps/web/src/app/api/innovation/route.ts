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
    const innovations = await prisma.innovation.findMany({
      include: {
        submittedBy: { select: { name: true, email: true } },
        reviewedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const serialized = innovations.map(i => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, category, impact } = body;

    const innovation = await prisma.innovation.create({
      data: {
        title,
        description,
        category,
        impact,
        submittedById: session.user.id,
      },
    });

    return NextResponse.json({ ...innovation, createdAt: innovation.createdAt.toISOString() });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !["MANAGER", "ADMIN"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;

    const innovation = await prisma.innovation.update({
      where: { id },
      data: {
        status,
        reviewedById: session.user.id,
      },
    });

    return NextResponse.json(innovation);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
