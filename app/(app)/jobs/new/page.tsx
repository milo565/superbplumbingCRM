import { JobCreateForm } from "@/components/job-create-form";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "New job" };

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string; propertyId?: string; enquiry?: string }>;
}) {
  await requirePermission("jobs:write");
  const { customerId, propertyId, enquiry } = await searchParams;
  const customers = await prisma.customer.findMany({
    include: {
      properties: {
        select: {
          id: true,
          customerId: true,
          label: true,
          street: true,
          suburb: true,
          state: true,
          postcode: true,
          siteContactPhone: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
  const technicians = await prisma.user.findMany({
    where: { active: true, role: { in: ["PLUMBER", "SUPERVISOR", "OWNER"] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Jobs"
        title={enquiry ? "Log a new enquiry" : "Raise a job"}
        description="Pick the site, check the pin, then capture enough to arrive ready."
      />
      <JobCreateForm
        customers={customers}
        technicians={technicians}
        defaultCustomerId={customerId}
        defaultPropertyId={propertyId}
        enquiry={Boolean(enquiry)}
      />
    </div>
  );
}
