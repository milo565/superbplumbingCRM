import Link from "next/link";
import { Button, Card, PageHeader, StatusBadge } from "@/components/ui";
import { QUOTE_STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { can } from "@/lib/rbac";
import type { QuoteStatus } from "@prisma/client";

export const metadata = { title: "Quotes" };

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requirePermission("quotes:read");
  const { status } = await searchParams;
  const quotes = await prisma.quote.findMany({
    where: status ? { status: status as QuoteStatus } : undefined,
    include: { customer: true, property: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Pricing"
        title="Quotes"
        description="Clear numbers, GST included, ready to convert when they say go."
        actions={can(user.role, "quotes:write") ? <Button href="/quotes/new">New quote</Button> : null}
      />
      <Card>
        <div className="space-y-4">
          {quotes.map((quote) => (
            <Link key={quote.id} href={`/quotes/${quote.id}`} className="block border-b border-[#f0f3f5] pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-navy">
                  {quote.quoteNumber} · {quote.title}
                </p>
                <StatusBadge
                  label={QUOTE_STATUS_LABELS[quote.status]}
                  tone={quote.status === "APPROVED" || quote.status === "CONVERTED" ? "green" : "pale"}
                />
              </div>
              <p className="text-sm text-[#4b5c69]">
                {quote.customer.name} · {quote.property.suburb} · {formatMoney(quote.totalIncGst)} · valid{" "}
                {formatDate(quote.validUntil)}
              </p>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
