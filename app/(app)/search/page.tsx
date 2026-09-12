import Link from "next/link";
import { searchRecords } from "@/actions/crm";
import { Card, PageHeader } from "@/components/ui";
import { formatAddress } from "@/lib/format";

export const metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = await searchRecords(q);

  return (
    <div>
      <PageHeader eyebrow="Find it" title={q ? `Results for “${q}”` : "Search"} />
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-heading text-xl uppercase text-navy mb-2">Customers</h2>
          {results.customers.map((c) => (
            <p key={c.id}>
              <Link className="text-blue font-medium" href={`/customers/${c.id}`}>
                {c.customerNumber} · {c.name}
              </Link>
            </p>
          ))}
        </Card>
        <Card>
          <h2 className="font-heading text-xl uppercase text-navy mb-2">Jobs</h2>
          {results.jobs.map((j) => (
            <p key={j.id}>
              <Link className="text-blue font-medium" href={`/jobs/${j.id}`}>
                {j.jobNumber} · {j.title}
              </Link>
            </p>
          ))}
        </Card>
        <Card>
          <h2 className="font-heading text-xl uppercase text-navy mb-2">Sites</h2>
          {results.properties.map((p) => (
            <p key={p.id}>
              <Link className="text-blue font-medium" href={`/properties/${p.id}`}>
                {formatAddress(p)} · {p.customer.name}
              </Link>
            </p>
          ))}
        </Card>
        <Card>
          <h2 className="font-heading text-xl uppercase text-navy mb-2">Quotes</h2>
          {results.quotes.map((qte) => (
            <p key={qte.id}>
              <Link className="text-blue font-medium" href={`/quotes/${qte.id}`}>
                {qte.quoteNumber} · {qte.title}
              </Link>
            </p>
          ))}
        </Card>
      </div>
    </div>
  );
}
