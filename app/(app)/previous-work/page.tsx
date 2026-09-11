import Link from "next/link";
import { Button, Card, PageHeader, StatusBadge } from "@/components/ui";
import { CATEGORY_LABELS, JOB_STATUS_LABELS } from "@/lib/constants";
import { formatAddress, formatDate, formatMoney } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { jobScopeWhere } from "@/actions/shared";
import { isCompletedWork, statusTone } from "@/lib/workflow";
import type { ServiceCategory } from "@prisma/client";

export const metadata = { title: "Previous work" };

export default async function PreviousWorkPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const { where } = await jobScopeWhere();
  const jobs = await prisma.job.findMany({
    where: {
      AND: [
        where,
        {
          status: {
            in: [
              "COMPLETED",
              "CUSTOMER_SIGN_OFF",
              "READY_TO_INVOICE",
              "INVOICED",
              "PAID",
              "MAINTENANCE_FOLLOW_UP_SCHEDULED",
            ],
          },
        },
        category ? { category: category as ServiceCategory } : {},
        q
          ? {
              OR: [
                { title: { contains: q } },
                { jobNumber: { contains: q } },
                { customer: { name: { contains: q } } },
                { property: { suburb: { contains: q } } },
              ],
            }
          : {},
      ],
    },
    include: { customer: true, property: true, assignedTo: true },
    orderBy: { completedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="History"
        title="Previous work"
        description="What was done, what we recommended, and the next sensible follow-up."
      />
      <form className="mb-4 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search completed jobs"
          className="rounded-xl border border-[#cfd8de] px-3 py-2.5 min-w-[220px]"
        />
        <select name="category" defaultValue={category} className="rounded-xl border border-[#cfd8de] px-3 py-2.5">
          <option value="">All services</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <Button type="submit" variant="ghost">
          Filter
        </Button>
      </form>
      <div className="space-y-3">
        {jobs.map((job) => (
          <Card key={job.id}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-xs text-[#5b6b78]">{formatDate(job.completedAt)} · {job.jobNumber}</p>
                <Link href={`/jobs/${job.id}`} className="font-heading text-2xl uppercase text-navy">
                  {job.title}
                </Link>
                <p className="text-sm text-[#3c4d5a]">
                  <Link href={`/customers/${job.customerId}`} className="text-blue">
                    {job.customer.name}
                  </Link>{" "}
                  · {formatAddress(job.property)} · {formatMoney(job.totalIncGst)}
                </p>
                {job.recommendations ? (
                  <p className="text-sm mt-2">Recommended: {job.recommendations}</p>
                ) : null}
              </div>
              <div className="flex flex-col items-start md:items-end gap-2">
                <StatusBadge label={JOB_STATUS_LABELS[job.status]} tone={statusTone(job.status)} />
                <Button href={`/jobs/new?customerId=${job.customerId}&propertyId=${job.propertyId}`}>
                  Create follow-up job
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <p className="hidden">{String(isCompletedWork("PAID"))}</p>
    </div>
  );
}
