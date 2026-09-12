import { notFound } from "next/navigation";
import { recordPayment } from "@/actions/crm";
import { Button, Card, Field, Input, PageHeader, Select, StatusBadge } from "@/components/ui";
import { MoneyLine } from "@/components/lists";
import { COMPANY, INVOICE_STATUS_LABELS } from "@/lib/constants";
import { formatAddress, formatDate, formatMoney } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Invoice" };

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("invoices:read");
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { customer: true, property: true, job: true, payments: true },
  });
  if (!invoice) notFound();

  return (
    <div>
      <PageHeader
        eyebrow={invoice.invoiceNumber}
        title={invoice.customer.name}
        description={`Tax invoice · ABN ${COMPANY.abn} · GST 10%`}
      />
      <StatusBadge
        label={INVOICE_STATUS_LABELS[invoice.status]}
        tone={invoice.status === "PAID" ? "green" : invoice.status === "OVERDUE" ? "red" : "orange"}
      />
      <div className="grid lg:grid-cols-3 gap-4 mt-5">
        <Card className="lg:col-span-2">
          <p className="font-heading text-3xl uppercase text-navy">{COMPANY.name}</p>
          <p className="text-sm text-[#4b5c69] mb-4">
            {formatAddress(invoice.property)} · issued {formatDate(invoice.issuedAt)} · due{" "}
            {formatDate(invoice.dueAt)}
          </p>
          {invoice.job ? <p className="mb-3">Job {invoice.job.jobNumber} — {invoice.job.title}</p> : null}
          <MoneyLine label="Labour" value={invoice.labourHours * invoice.labourRate} />
          <MoneyLine label="Materials" value={invoice.materialsCost} />
          <MoneyLine label="GST 10%" value={invoice.gstAmount} />
          <MoneyLine label="Total inc GST" value={invoice.totalIncGst} strong />
          <MoneyLine label="Paid" value={invoice.amountPaid} />
          <p className="text-xs text-[#5b6b78] mt-6">
            Print / Save as PDF for a paper copy. Xero ref: {invoice.xeroRef ?? "not connected"} · MYOB:{" "}
            {invoice.myobRef ?? "not connected"}
          </p>
        </Card>
        <Card>
          <h2 className="font-heading text-xl uppercase text-navy mb-3">Record payment</h2>
          <form action={recordPayment} className="space-y-3">
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <Field label="Amount">
              <Input
                name="amount"
                type="number"
                step="0.01"
                defaultValue={Math.max(invoice.totalIncGst - invoice.amountPaid, 0)}
              />
            </Field>
            <Field label="Method">
              <Select name="method" defaultValue="Bank transfer">
                <option>Bank transfer</option>
                <option>Card</option>
                <option>Cash</option>
              </Select>
            </Field>
            <Field label="Reference">
              <Input name="reference" />
            </Field>
            <Button type="submit">Add payment</Button>
          </form>
          <ul className="mt-4 text-sm space-y-1">
            {invoice.payments.map((p) => (
              <li key={p.id}>
                {formatMoney(p.amount)} · {p.method} · {formatDate(p.receivedAt)}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
