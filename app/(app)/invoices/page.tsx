import Link from "next/link";
import { Card, PageHeader, StatusBadge } from "@/components/ui";
import { INVOICE_STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import type { InvoiceStatus } from "@prisma/client";

export const metadata = { title: "Invoices and payments" };

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePermission("invoices:read");
  const { status } = await searchParams;
  const where =
    status === "outstanding"
      ? { status: { in: ["SENT", "PARTIAL", "OVERDUE"] as InvoiceStatus[] } }
      : status
        ? { status: status as InvoiceStatus }
        : undefined;
  const invoices = await prisma.invoice.findMany({
    where,
    include: { customer: true, job: true },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Accounts"
        title="Invoices and payments"
        description="GST-inclusive tax invoices. Xero and MYOB stay disconnected until you plug them in."
      />
      <Card>
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <Link key={invoice.id} href={`/invoices/${invoice.id}`} className="block border-b border-[#f0f3f5] pb-3">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-semibold text-navy">
                  {invoice.invoiceNumber} · {invoice.customer.name}
                </p>
                <StatusBadge
                  label={INVOICE_STATUS_LABELS[invoice.status]}
                  tone={
                    invoice.status === "PAID"
                      ? "green"
                      : invoice.status === "OVERDUE"
                        ? "red"
                        : "orange"
                  }
                />
              </div>
              <p className="text-sm text-[#4b5c69]">
                {formatMoney(invoice.totalIncGst)} · due {formatDate(invoice.dueAt)} · paid{" "}
                {formatMoney(invoice.amountPaid)}
              </p>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
