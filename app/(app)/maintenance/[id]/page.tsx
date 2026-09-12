import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Card, PageHeader } from "@/components/ui";
import { PLAN_TYPE_LABELS } from "@/lib/constants";
import { formatAddress, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Maintenance plan" };

export default async function MaintenanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("maintenance:read");
  const { id } = await params;
  const plan = await prisma.maintenancePlan.findUnique({
    where: { id },
    include: { customer: true, property: true },
  });
  if (!plan) notFound();

  return (
    <div>
      <PageHeader eyebrow={PLAN_TYPE_LABELS[plan.type]} title={plan.name} />
      <Card>
        <p>
          <Link className="text-blue font-semibold" href={`/customers/${plan.customerId}`}>
            {plan.customer.name}
          </Link>
        </p>
        <p className="mt-1">{formatAddress(plan.property)}</p>
        <p className="mt-4">Every {plan.intervalMonths} months</p>
        <p>Last done {formatDate(plan.lastDoneAt)}</p>
        <p>Next due {formatDate(plan.nextDueAt)}</p>
        {plan.notes ? <p className="mt-3">{plan.notes}</p> : null}
        <Button
          href={`/jobs/new?customerId=${plan.customerId}&propertyId=${plan.propertyId}`}
          className="mt-5"
        >
          Raise maintenance job
        </Button>
      </Card>
    </div>
  );
}
