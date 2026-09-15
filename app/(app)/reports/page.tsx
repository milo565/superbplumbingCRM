import { startOfMonth, startOfWeek, startOfYear } from "date-fns";
import { Button, Card, PageHeader, SectionTitle } from "@/components/ui";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatMoney, localDayRange } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  await requirePermission("reports:read");
  const { start } = localDayRange();
  const [jobs, invoices, quotes, customers] = await Promise.all([
    prisma.job.findMany({ include: { assignedTo: true } }),
    prisma.invoice.findMany(),
    prisma.quote.findMany(),
    prisma.customer.findMany({ select: { id: true, lastJobAt: true } }),
  ]);

  const paid = invoices.filter((i) => i.status === "PAID");
  const week = startOfWeek(start, { weekStartsOn: 1 });
  const month = startOfMonth(start);
  const year = startOfYear(start);
  const revenue = (from: Date) =>
    paid.filter((i) => i.paidAt && i.paidAt >= from).reduce((s, i) => s + i.totalIncGst, 0);

  const byCategory = Object.keys(CATEGORY_LABELS).map((category) => {
    const rows = jobs.filter((j) => j.category === category);
    return {
      category,
      count: rows.length,
      revenue: rows.reduce((s, j) => s + j.totalIncGst, 0),
    };
  });

  const converted = quotes.filter((q) => q.status === "CONVERTED" || q.status === "APPROVED").length;
  const repeat = customers.filter((c) => jobs.filter((j) => j.customerId === c.id && j.completedAt).length > 1).length;

  return (
    <div>
      <PageHeader
        eyebrow="Numbers"
        title="Reports"
        description="GST-inclusive totals. Export a CSV for the accountant."
        actions={<Button href="/api/export?type=jobs">Export jobs CSV</Button>}
      />
      <div className="grid md:grid-cols-3 gap-3 mb-5">
        <Card>
          <p className="text-sm text-[#5b6b78]">Week</p>
          <p className="font-heading text-4xl text-navy">{formatMoney(revenue(week))}</p>
        </Card>
        <Card>
          <p className="text-sm text-[#5b6b78]">Month</p>
          <p className="font-heading text-4xl text-navy">{formatMoney(revenue(month))}</p>
        </Card>
        <Card>
          <p className="text-sm text-[#5b6b78]">Year</p>
          <p className="font-heading text-4xl text-navy">{formatMoney(revenue(year))}</p>
        </Card>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <SectionTitle>Service mix</SectionTitle>
          {byCategory.map((row) => (
            <p key={row.category} className="flex justify-between text-sm py-1">
              <span>{CATEGORY_LABELS[row.category as keyof typeof CATEGORY_LABELS]}</span>
              <span>
                {row.count} · {formatMoney(row.revenue)}
              </span>
            </p>
          ))}
        </Card>
        <Card>
          <SectionTitle>Conversion & repeat</SectionTitle>
          <p className="text-sm">
            Quote conversion {quotes.length ? Math.round((converted / quotes.length) * 100) : 0}%
          </p>
          <p className="text-sm mt-2">
            Repeat customers {customers.length ? Math.round((repeat / customers.length) * 100) : 0}%
          </p>
          <p className="text-sm mt-2">Outstanding invoices {invoices.filter((i) => ["SENT", "PARTIAL", "OVERDUE"].includes(i.status)).length}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button href="/api/export?type=invoices" variant="ghost">
              Invoices CSV
            </Button>
            <Button href="/api/export?type=customers" variant="ghost">
              Customers CSV
            </Button>
            <Button href="/api/export?type=followups" variant="ghost">
              Follow-ups CSV
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
