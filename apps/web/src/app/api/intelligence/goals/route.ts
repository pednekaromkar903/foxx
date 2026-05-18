import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Atomberg Legacy DB Sample Data
  const legacyGoals = [
    {
      id: "legacy_1",
      title: "SAP Integration",
      quarter: "Q2",
      actual: 65,
      target: 100,
      uomType: "NUMERIC_MIN",
      employee: {
        name: "Admin User",
        department: "Operations"
      }
    },
    {
      id: "legacy_2",
      title: "BLDC Production +25%",
      quarter: "Q2",
      actual: 45000,
      target: 62500,
      uomType: "NUMERIC_MIN",
      employee: {
        name: "Rajesh Kumar",
        department: "Manufacturing"
      }
    },
    {
      id: "legacy_3",
      title: "15 Enterprise Clients",
      quarter: "Q2",
      actual: 7,
      target: 15,
      uomType: "NUMERIC_MIN",
      employee: {
        name: "Priya Sharma",
        department: "B2B Sales"
      }
    },
    {
      id: "legacy_4",
      title: "IoT Motor Controller",
      quarter: "Q2",
      actual: 45,
      target: 100,
      uomType: "NUMERIC_MIN",
      employee: {
        name: "Arjun Patel",
        department: "R&D"
      }
    }
  ];

  return NextResponse.json({ goals: legacyGoals });
}
