import Link from "next/link";
import { addDays } from "date-fns";
import { Button, Card, PageHeader, StatusBadge } from "@/components/ui";
import { PLAN_TYPE_LABELS } from "@/lib/constants";
import { formatDate, melbourneDayRange } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { can } from "@/lib/rbac";

export const metadata = { title: "Maintenance plans" };

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ due?: string }>;
}) {
  const user = await requirePermission("maintenance:read");
  const { due } = await searchParams;
  const { end } = melbourneDayRange();
  const plans = await prisma.maintenancePlan.findMany({
    where: due === "soon" ? { nextDueAt: { lte: addDays(end, 14) }, active: true } : undefined,
    include: { customer: true, property: true },
    orderBy: { nextDueAt: "asc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Keep it holding up"
        title="Maintenance plans"
        description="Six-monthly, annual, commercial, PM portfolio or custom."
        actions={can(user.role, "maintenance:write") ? <Button href="/maintenance/new">New plan</Button> : null}
      />
      <div className="grid md:grid-cols-2 gap-3">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <Link href={`/maintenance/${plan.id}`}>
              <StatusBadge label={PLAN_TYPE_LABELS[plan.type]} tone="pale" />
              <p className="font-heading text-2xl uppercase text-navy mt-2">{plan.name}</p>
              <p className="text-sm text-[#3c4d5a]">
                {plan.customer.name} · {plan.property.suburb}
              </p>
              <p className="text-sm mt-2">
                Next due {formatDate(plan.nextDueAt)} · every {plan.intervalMonths} months
              </p>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
