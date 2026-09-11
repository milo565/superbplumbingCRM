import Link from "next/link";
import type { JobStatus, Prisma } from "@prisma/client";
import { Button, Card, PageHeader, StatusBadge } from "@/components/ui";
import { JobList } from "@/components/lists";
import { JOB_STATUS_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { jobScopeWhere } from "@/actions/shared";
import { can } from "@/lib/rbac";
import { statusTone } from "@/lib/workflow";

export const metadata = { title: "Jobs" };

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; filter?: string; q?: string }>;
}) {
  const { status, filter, q } = await searchParams;
  const { user, where } = await jobScopeWhere();

  const extra: Prisma.JobWhereInput = {};
  if (status) extra.status = status as JobStatus;
  if (filter === "emergency") extra.OR = [{ emergency: true }, { priority: "EMERGENCY" }];
  if (filter === "unassigned") extra.assignedToId = null;
  if (filter === "active") extra.status = { in: ["SCHEDULED", "PLUMBER_ASSIGNED", "ON_THE_WAY", "IN_PROGRESS", "AWAITING_PARTS"] };
  if (filter === "invoice") extra.status = { in: ["COMPLETED", "CUSTOMER_SIGN_OFF", "READY_TO_INVOICE"] };
  if (q) extra.OR = [{ jobNumber: { contains: q } }, { title: { contains: q } }, { customer: { name: { contains: q } } }];

  const jobs = await prisma.job.findMany({
    where: { AND: [where, extra] },
    include: { customer: true, property: true, assignedTo: true },
    orderBy: [{ emergency: "desc" }, { appointmentStart: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <PageHeader
        eyebrow="Workflow"
        title="Jobs"
        description="From first call to paid and booked for the next look-over."
        actions={can(user.role, "jobs:write") ? <Button href="/jobs/new">New job</Button> : null}
      />
      <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
        {[
          ["/jobs", "All"],
          ["/jobs?filter=emergency", "Emergency"],
          ["/jobs?filter=unassigned", "Unassigned"],
          ["/jobs?filter=active", "On the tools"],
          ["/jobs?status=APPROVED", "Approved"],
          ["/jobs?filter=invoice", "Invoice"],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="shrink-0 rounded-full bg-white border border-[#d5dde3] px-3 py-1.5 text-sm">
            {label}
          </Link>
        ))}
      </div>
      <Card>
        <JobList jobs={jobs} />
      </Card>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["ON_THE_WAY", "COMPLETED", "INVOICED", "PAID", "CUSTOMER_FOLLOW_UP"] as JobStatus[]).map((s) => (
          <StatusBadge key={s} label={JOB_STATUS_LABELS[s]} tone={statusTone(s)} />
        ))}
      </div>
    </div>
  );
}
