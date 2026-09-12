import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";

function csv(rows: Record<string, string | number | null | undefined>[]) {
  if (!rows.length) return "empty\n";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const value = String(row[h] ?? "");
          return `"${value.replaceAll('"', '""')}"`;
        })
        .join(","),
    ),
  ];
  return lines.join("\n");
}

export async function GET(request: Request) {
  await requirePermission("reports:read");
  const type = new URL(request.url).searchParams.get("type") ?? "jobs";

  let body = "";
  if (type === "customers") {
    const rows = await prisma.customer.findMany();
    body = csv(
      rows.map((c) => ({
        number: c.customerNumber,
        name: c.name,
        type: c.type,
        phone: c.phone,
        email: c.email,
        suburb: c.billingSuburb,
        optOut: c.marketingOptOut ? "yes" : "no",
      })),
    );
  } else if (type === "invoices") {
    const rows = await prisma.invoice.findMany({ include: { customer: true } });
    body = csv(
      rows.map((i) => ({
        number: i.invoiceNumber,
        customer: i.customer.name,
        status: i.status,
        total: i.totalIncGst,
        paid: i.amountPaid,
        due: i.dueAt.toISOString(),
      })),
    );
  } else if (type === "followups") {
    const rows = await prisma.followUp.findMany({ include: { customer: true } });
    body = csv(
      rows.map((f) => ({
        title: f.title,
        customer: f.customer.name,
        status: f.status,
        channel: f.channel,
        due: f.dueAt.toISOString(),
      })),
    );
  } else {
    const rows = await prisma.job.findMany({ include: { customer: true, property: true } });
    body = csv(
      rows.map((j) => ({
        number: j.jobNumber,
        title: j.title,
        status: j.status,
        customer: j.customer.name,
        suburb: j.property.suburb,
        total: j.totalIncGst,
        emergency: j.emergency ? "yes" : "no",
      })),
    );
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="superbflow-${type}.csv"`,
    },
  });
}
