import Link from "next/link";
import { Button, Card, PageHeader } from "@/components/ui";
import { CUSTOMER_TYPE_LABELS } from "@/lib/constants";
import { formatAddress } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { can } from "@/lib/rbac";

export const metadata = { title: "Properties and sites" };

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requirePermission("properties:read");
  const { q } = await searchParams;
  const properties = await prisma.property.findMany({
    where: q
      ? {
          OR: [
            { street: { contains: q } },
            { suburb: { contains: q } },
            { label: { contains: q } },
            { customer: { name: { contains: q } } },
          ],
        }
      : undefined,
    include: { customer: true, _count: { select: { jobs: true } } },
    orderBy: [{ suburb: "asc" }, { street: "asc" }],
  });

  return (
    <div>
      <PageHeader
        eyebrow="Sites"
        title="Properties and sites"
        description="Outdoor unit, indoor heads, isolator, filters and what the last visit found."
        actions={
          can(user.role, "properties:write") ? <Button href="/properties/new">Add site</Button> : null
        }
      />
      <div className="grid md:grid-cols-2 gap-3">
        {properties.map((property) => (
          <Card key={property.id}>
            <Link href={`/properties/${property.id}`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue">
                {CUSTOMER_TYPE_LABELS[property.type]}
              </p>
              <p className="font-heading text-2xl uppercase tracking-wide text-navy mt-1">
                {property.label || property.street}
              </p>
              <p className="text-sm text-[#3c4d5a] mt-1">{formatAddress(property)}</p>
              <p className="text-sm mt-2">
                {property.customer.name} · {property._count.jobs} jobs
              </p>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
