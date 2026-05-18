import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireRole } from "@/lib/auth";
import { prisma } from "@atomberg/database";
import * as xlsx from "xlsx";

// GET /api/reports/export?format=csv
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "csv";
  const quarter = searchParams.get("quarter");

  try {
    const role = session.user.role as string;
    const where: any = {};
    if (quarter) where.quarter = quarter;

    if (role === "EMPLOYEE") {
      where.employeeId = session.user.id;
    } else if (role === "MANAGER") {
      where.employee = {
        OR: [
          { managerId: session.user.id },
          { departmentId: session.user.departmentId }
        ]
      };
    }
    // ADMIN sees all

    const goals = await prisma.goal.findMany({
      where,
      include: {
        employee: { select: { name: true, email: true, department: { select: { name: true } } } },
        updates: { orderBy: { updatedAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Goal Title", "Employee Name", "Department", "Quarter", "Status", "Progress %",
      "Target Value", "Actual Value", "Unit of Measurement", "Due Date", "Created At"
    ];

    const dataRows = goals.map((g) => {
      const update = g.updates[0];
      return [
        g.title,
        g.employee.name,
        g.employee.department?.name ?? "—",
        g.quarter,
        g.status.replace(/_/g, " "),
        `${update?.progressScore ?? 0}%`,
        g.target,
        update?.achievement ?? 0,
        g.uomType.replace(/_/g, " "),
        g.deadline ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(g.deadline)) : "—",
        new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(g.createdAt)),
      ];
    });

    const rows = [headers, ...dataRows];

    if (format === "csv") {
      const csv = rows.map((r) => r.map((cell) => {
        const val = String(cell);
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(",")).join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="performx-report-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    if (format === "xlsx" || format === "excel") {
      const worksheet = xlsx.utils.aoa_to_sheet(rows);
      
      // Basic styling if using xlsx (though xlsx limited in style)
      // If we need rich styling, exceljs is better, but xlsx is already here.
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Goals Report");
      const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
      
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="performx-report-${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      });
    }

    // JSON response for chart data
    return NextResponse.json({
      goals: dataRows.map((row, i) => ({
        title: row[0],
        employee: row[1],
        department: row[2],
        quarter: row[3],
        status: row[4],
        progress: parseInt(row[5] as string),
        target: row[6],
        achievement: row[7]
      })),
      data: goals.map(g => ({
        title: g.title,
        employee: g.employee.name,
        department: g.employee.department?.name,
        quarter: g.quarter,
        status: g.status,
        progress: g.updates[0]?.progressScore || 0
      }))
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
