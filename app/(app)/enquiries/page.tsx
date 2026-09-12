import { Button, Card, PageHeader } from "@/components/ui";
import { JobList } from "@/components/lists";
import { prisma } from "@/lib/prisma";
import { jobScopeWhere } from "@/actions/shared";

export const metadata = { title: "New enquiries" };

export default async function EnquiriesPage() {
  const { where } = await jobScopeWhere();
  const jobs = await prisma.job.findMany({
    where: {
      AND: [where, { status: { in: ["NEW_ENQUIRY", "TRIAGE_REQUIRED", "SITE_VISIT_REQUIRED"] } }],
    },
    include: { customer: true, property: true, assignedTo: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Front door"
        title="New enquiries"
        description="First calls and quote-form jobs that still need a sensible plan."
        actions={<Button href="/jobs/new?enquiry=1">Log enquiry</Button>}
      />
      <Card>
        <JobList jobs={jobs} />
      </Card>
    </div>
  );
}
