import Link from "next/link";
import {
  CATEGORY_LABELS,
  CUSTOMER_TYPE_LABELS,
  JOB_STATUS_LABELS,
  PRIORITY_LABELS,
} from "@/lib/constants";
import { formatAddress, formatDate, formatMoney, formatPhone } from "@/lib/format";
import { statusTone } from "@/lib/workflow";
import { StatusBadge } from "@/components/ui";
import type { Customer, Job, JobPriority, Property, User } from "@prisma/client";

type JobRow = Job & {
  customer: Pick<Customer, "id" | "name" | "phone">;
  property: Pick<Property, "street" | "suburb" | "state" | "postcode">;
  assignedTo?: Pick<User, "name"> | null;
};

export function JobList({ jobs }: { jobs: JobRow[] }) {
  if (!jobs.length) {
    return <p className="text-sm text-[#5b6b78] px-1">Nothing in this list right now.</p>;
  }
  return (
    <div className="divide-y divide-[#e6ecef]">
      {jobs.map((job) => (
        <Link
          key={job.id}
          href={`/jobs/${job.id}`}
          className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3.5 first:pt-0 last:pb-0"
        >
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-navy">
              {job.jobNumber} · {job.title}
            </p>
            <p className="text-sm text-[#4b5c69] truncate">
              {job.customer.name} · {formatAddress(job.property)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <StatusBadge label={JOB_STATUS_LABELS[job.status]} tone={statusTone(job.status)} />
            {job.emergency || job.priority === ("EMERGENCY" as JobPriority) ? (
              <StatusBadge label="Emergency" tone="orange" />
            ) : null}
            <span className="text-[#5b6b78]">
              {job.appointmentStart ? formatDate(job.appointmentStart) : "Unscheduled"}
              {job.assignedTo ? ` · ${job.assignedTo.name}` : ""}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function CustomerList({
  customers,
}: {
  customers: Array<
    Customer & {
      accountManager?: Pick<User, "name"> | null;
      _count?: { properties: number; jobs: number };
    }
  >;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[#5b6b78] border-b border-[#e6ecef]">
            <th className="py-2 pr-3 font-medium">Customer</th>
            <th className="py-2 pr-3 font-medium hidden md:table-cell">Type</th>
            <th className="py-2 pr-3 font-medium">Phone</th>
            <th className="py-2 pr-3 font-medium hidden lg:table-cell">Last job</th>
            <th className="py-2 font-medium hidden sm:table-cell">Sites</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="border-b border-[#f0f3f5]">
              <td className="py-3 pr-3">
                <Link href={`/customers/${customer.id}`} className="font-semibold text-navy hover:text-blue">
                  {customer.customerNumber} · {customer.name}
                </Link>
                <p className="text-xs text-[#5b6b78]">{customer.billingSuburb}</p>
              </td>
              <td className="py-3 pr-3 hidden md:table-cell">
                {CUSTOMER_TYPE_LABELS[customer.type]}
              </td>
              <td className="py-3 pr-3">
                <a href={`tel:${customer.phone}`} className="text-blue font-medium">
                  {formatPhone(customer.phone)}
                </a>
              </td>
              <td className="py-3 pr-3 hidden lg:table-cell">{formatDate(customer.lastJobAt)}</td>
              <td className="py-3 hidden sm:table-cell">{customer._count?.properties ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MoneyLine({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 text-sm py-1">
      <span className="text-[#4b5c69]">{label}</span>
      <span className={strong ? "font-semibold text-navy" : ""}>{formatMoney(value)}</span>
    </div>
  );
}

export function Meta({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-[#6b7c88] font-semibold">{label}</p>
      <p className="mt-0.5 text-[15px] text-ink">{value || "—"}</p>
    </div>
  );
}

export { PRIORITY_LABELS, CATEGORY_LABELS };
