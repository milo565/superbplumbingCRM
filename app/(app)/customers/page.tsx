import Link from "next/link";
import { Button, Card, PageHeader, StatusBadge } from "@/components/ui";
import { CustomerList } from "@/components/lists";
import { prisma } from "@/lib/prisma";
import { customerScopeWhere } from "@/actions/shared";
import { can } from "@/lib/rbac";
import type { CustomerType } from "@prisma/client";

export const metadata = { title: "Customers" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string }>;
}) {
  const { type, q } = await searchParams;
  const { user, where } = await customerScopeWhere();
  const customers = await prisma.customer.findMany({
    where: {
      AND: [
        where,
        type ? { type: type as CustomerType } : {},
        q
          ? {
              OR: [
                { name: { contains: q } },
                { phone: { contains: q } },
                { email: { contains: q } },
                { customerNumber: { contains: q } },
              ],
            }
          : {},
      ],
    },
    include: { accountManager: true, _count: { select: { properties: true, jobs: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="People"
        title="Customers"
        description="Who we look after — homes, shops, sites and property managers."
        actions={
          can(user.role, "customers:write") ? (
            <Button href="/customers/new">New customer</Button>
          ) : null
        }
      />
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          ["", "All"],
          ["RESIDENTIAL", "Residential"],
          ["COMMERCIAL", "Commercial"],
          ["INDUSTRIAL", "Industrial"],
        ].map(([value, label]) => (
          <Link
            key={label}
            href={value ? `/customers?type=${value}` : "/customers"}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              (type ?? "") === value ? "bg-navy text-white" : "bg-white text-ink border border-[#d5dde3]"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
      <Card>
        {customers.length ? (
          <CustomerList customers={customers} />
        ) : (
          <p className="text-[#5b6b78]">No customers match that filter.</p>
        )}
      </Card>
      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge label="Tip" tone="pale" />
        <p className="text-sm text-[#4b5c69]">
          Duplicate checks run on name, phone and email when you add someone new.
        </p>
      </div>
    </div>
  );
}
