import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@atomberg/database";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const events = await prisma.calendarEvent.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { userId: null } // System events
        ]
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(events.map(e => ({
      ...e,
      date: e.date.toISOString(),
    })));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { title, date, type, description } = body;

    if (!title || !date || !type) {
      return NextResponse.json({ error: "Title, date, and type are required" }, { status: 400 });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        date: new Date(date),
        type,
        description,
        userId: session.user.id
      }
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

  try {
    const event = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (event.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.calendarEvent.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
