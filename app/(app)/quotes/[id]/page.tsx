import { notFound } from "next/navigation";
import { convertQuoteToJob, updateQuoteStatus } from "@/actions/crm";
import { Button, Card, PageHeader, StatusBadge } from "@/components/ui";
import { MoneyLine } from "@/components/lists";
import { COMPANY, QUOTE_STATUS_LABELS } from "@/lib/constants";
import { formatAddress, formatDate, formatMoney } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { can } from "@/lib/rbac";

export const metadata = { title: "Quote" };

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("quotes:read");
  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { customer: true, property: true, lineItems: true, jobs: true },
  });
  if (!quote) notFound();

  return (
    <div>
      <PageHeader
        eyebrow={quote.quoteNumber}
        title={quote.title}
        description={`${quote.customer.name} · ${formatAddress(quote.property)}`}
        actions={
          can(user.role, "jobs:write") ? (
            <form action={convertQuoteToJob}>
              <input type="hidden" name="id" value={quote.id} />
              <Button type="submit" variant="orange">
                Convert to job
              </Button>
            </form>
          ) : null
        }
      />
      <StatusBadge label={QUOTE_STATUS_LABELS[quote.status]} tone="pale" />

      <div className="grid lg:grid-cols-3 gap-4 mt-5">
        <Card className="lg:col-span-2 print:shadow-none">
          <div className="flex justify-between gap-4 mb-6">
            <div>
              <p className="font-heading text-3xl uppercase text-navy">{COMPANY.name}</p>
              <p className="text-sm text-[#4b5c69]">ABN {COMPANY.abn} · GST included at 10%</p>
            </div>
            <div className="text-right text-sm">
              <p>Valid to {formatDate(quote.validUntil)}</p>
              <p>{COMPANY.phonePrimary}</p>
            </div>
          </div>
          <p className="text-[15px] mb-4">{quote.introduction}</p>
          <MoneyLine label="Labour" value={quote.labourHours * quote.labourRate} />
          <MoneyLine label="Materials" value={quote.materialsCost} />
          <MoneyLine label="GST 10%" value={quote.gstAmount} />
          <MoneyLine label="Total inc GST" value={quote.totalIncGst} strong />
          {quote.notes ? <p className="mt-4 text-sm">{quote.notes}</p> : null}
          <p className="mt-6 text-xs text-[#5b6b78]">Print this page for a PDF stub. Xero / MYOB export is a placeholder.</p>
        </Card>
        <Card>
          <div className="space-y-2">
            {(["SENT", "FOLLOW_UP", "APPROVED", "DECLINED"] as const).map((status) => (
              <form key={status} action={updateQuoteStatus}>
                <input type="hidden" name="id" value={quote.id} />
                <input type="hidden" name="status" value={status} />
                <Button type="submit" variant="ghost" className="w-full">
                  Mark {QUOTE_STATUS_LABELS[status].toLowerCase()}
                </Button>
              </form>
            ))}
          </div>
          {quote.jobs.length ? (
            <p className="text-sm mt-4">
              Converted: {quote.jobs.map((j) => j.jobNumber).join(", ")} · {formatMoney(quote.totalIncGst)}
            </p>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
