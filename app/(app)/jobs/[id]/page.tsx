import Link from "next/link";
import { notFound } from "next/navigation";
import {
  checkInJob,
  checkOutJob,
  completeJobWithFollowUp,
  convertJobToInvoice,
  updateJobStatus,
} from "@/actions/crm";
import { Button, Card, Field, Input, PageHeader, Select, StatusBadge, Textarea } from "@/components/ui";
import { Meta, MoneyLine } from "@/components/lists";
import {
  CATEGORY_LABELS,
  JOB_STATUS_LABELS,
  PRIORITY_LABELS,
  SUGGESTED_FOLLOW_UP_MONTHS,
} from "@/lib/constants";
import { formatAddress, formatDateTime, formatMoney, formatPhone, mapsHref, telHref } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/rbac";
import { nextStatuses, statusTone } from "@/lib/workflow";

export const metadata = { title: "Job" };

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      customer: true,
      property: true,
      assignedTo: true,
      quote: true,
      invoices: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
      documents: true,
      timeEntries: { include: { user: true } },
    },
  });
  if (!job) notFound();
  const plumbers = await prisma.user.findMany({
    where: { active: true, role: { in: ["PLUMBER", "SUPERVISOR", "OWNER"] } },
  });
  const next = nextStatuses(job.status);

  return (
    <div>
      <PageHeader
        eyebrow={job.jobNumber}
        title={job.title}
        description={`${job.customer.name} · ${formatAddress(job.property)}`}
        actions={
          <>
            {telHref(job.customer.phone) ? (
              <Button href={telHref(job.customer.phone)!} variant="ghost">
                Call {formatPhone(job.customer.phone)}
              </Button>
            ) : null}
            <Button href={mapsHref(formatAddress(job.property))} variant="ghost">
              Maps
            </Button>
          </>
        }
      />
      <div className="flex flex-wrap gap-2 mb-5">
        <StatusBadge label={JOB_STATUS_LABELS[job.status]} tone={statusTone(job.status)} />
        <StatusBadge label={PRIORITY_LABELS[job.priority]} tone={job.emergency ? "orange" : "neutral"} />
        <StatusBadge label={CATEGORY_LABELS[job.category]} tone="pale" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <p className="text-[15px] leading-relaxed">{job.description}</p>
            {job.internalNotes ? (
              <p className="mt-3 text-sm bg-pale-2 rounded-xl p-3">Internal: {job.internalNotes}</p>
            ) : null}
          </Card>

          {can(user.role, "jobs:write") ? (
            <Card>
              <h2 className="font-heading text-2xl uppercase tracking-wide text-navy mb-3">
                Next sensible step
              </h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {next.map((status) => (
                  <form key={status} action={updateJobStatus}>
                    <input type="hidden" name="id" value={job.id} />
                    <input type="hidden" name="status" value={status} />
                    <Button type="submit" variant={status === "COMPLETED" ? "orange" : "primary"}>
                      {JOB_STATUS_LABELS[status]}
                    </Button>
                  </form>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={checkInJob}>
                  <input type="hidden" name="id" value={job.id} />
                  <Button type="submit" variant="navy">
                    Check in
                  </Button>
                </form>
                <form action={checkOutJob}>
                  <input type="hidden" name="id" value={job.id} />
                  <Button type="submit" variant="ghost">
                    Check out
                  </Button>
                </form>
                {["COMPLETED", "CUSTOMER_SIGN_OFF", "READY_TO_INVOICE"].includes(job.status) &&
                can(user.role, "invoices:write") ? (
                  <form action={convertJobToInvoice}>
                    <input type="hidden" name="id" value={job.id} />
                    <Button type="submit" variant="orange">
                      Raise invoice
                    </Button>
                  </form>
                ) : null}
              </div>
            </Card>
          ) : null}

          {job.status !== "COMPLETED" && can(user.role, "jobs:write") ? (
            <Card className="bg-pale">
              <h2 className="font-heading text-2xl uppercase tracking-wide text-navy mb-2">
                Complete the job
              </h2>
              <p className="text-sm text-[#3c4d5a] mb-4">
                A completed job needs a follow-up interval or a maintenance plan. Suggested for{" "}
                {CATEGORY_LABELS[job.category]}: {SUGGESTED_FOLLOW_UP_MONTHS[job.category]} months.
              </p>
              <form action={completeJobWithFollowUp} className="grid md:grid-cols-2 gap-3">
                <input type="hidden" name="id" value={job.id} />
                <Field label="After notes">
                  <Textarea name="afterNotes" defaultValue={job.afterNotes ?? ""} />
                </Field>
                <Field label="Recommendations">
                  <Textarea name="recommendations" defaultValue={job.recommendations ?? ""} />
                </Field>
                <Field label="Customer sign-off name">
                  <Input name="signatureName" placeholder="Print name (signature stub)" />
                </Field>
                <Field label="Follow-up months">
                  <Input
                    name="followMonths"
                    type="number"
                    defaultValue={SUGGESTED_FOLLOW_UP_MONTHS[job.category]}
                  />
                </Field>
                <Field label="After complete">
                  <Select name="followMode" defaultValue="sequence">
                    <option value="sequence">Start 30/14/due/7/21 follow-up sequence</option>
                    <option value="plan">Add to a maintenance plan</option>
                  </Select>
                </Field>
                <Field label="Plan name (if used)">
                  <Input name="planName" defaultValue={`${CATEGORY_LABELS[job.category]} plan`} />
                </Field>
                <div className="md:col-span-2">
                  <Button type="submit" variant="orange">
                    Mark completed
                  </Button>
                </div>
              </form>
            </Card>
          ) : null}

          <Card>
            <h2 className="font-heading text-2xl uppercase tracking-wide text-navy mb-3">Job record</h2>
            <form action={updateJobStatus} className="grid md:grid-cols-2 gap-3">
              <input type="hidden" name="id" value={job.id} />
              <input type="hidden" name="status" value={job.status} />
              <Field label="Title">
                <Input name="title" defaultValue={job.title} />
              </Field>
              <Field label="Priority">
                <Select name="priority" defaultValue={job.priority}>
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Plumber">
                <Select name="assignedToId" defaultValue={job.assignedToId ?? ""}>
                  <option value="">Unassigned</option>
                  {plumbers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Appointment">
                <Input
                  name="appointmentStart"
                  type="datetime-local"
                  defaultValue={
                    job.appointmentStart ? job.appointmentStart.toISOString().slice(0, 16) : ""
                  }
                />
              </Field>
              <Field label="Window">
                <Input name="windowLabel" defaultValue={job.windowLabel ?? ""} />
              </Field>
              <Field label="Labour hours">
                <Input name="labourHours" type="number" step="0.25" defaultValue={job.labourHours} />
              </Field>
              <Field label="Labour rate">
                <Input name="labourRate" type="number" defaultValue={job.labourRate} />
              </Field>
              <Field label="Materials">
                <Input name="materialsCost" type="number" step="0.01" defaultValue={job.materialsCost} />
              </Field>
              <Field label="Warranty (months)">
                <Input name="warrantyMonths" type="number" defaultValue={job.warrantyMonths ?? ""} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Description">
                  <Textarea name="description" defaultValue={job.description} />
                </Field>
              </div>
              <Field label="Before notes">
                <Textarea name="beforeNotes" defaultValue={job.beforeNotes ?? ""} />
              </Field>
              <Field label="After notes">
                <Textarea name="afterNotes" defaultValue={job.afterNotes ?? ""} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Compliance">
                  <Textarea name="complianceNotes" defaultValue={job.complianceNotes ?? ""} />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="emergency" defaultChecked={job.emergency} /> Emergency
              </label>
              <Button type="submit">Save job</Button>
            </form>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-navy text-white border-0">
            <MoneyLine label="Labour" value={job.labourHours * job.labourRate} />
            <MoneyLine label="Materials" value={job.materialsCost} />
            <MoneyLine label="GST 10%" value={job.gstAmount} />
            <div className="text-white [&_span]:text-white">
              <p className="flex justify-between mt-2 font-heading text-2xl uppercase">
                <span>Total inc GST</span>
                <span>{formatMoney(job.totalIncGst)}</span>
              </p>
            </div>
            {job.marginPercent ? (
              <p className="text-xs text-white/70 mt-2">Indicative margin {job.marginPercent}%</p>
            ) : null}
          </Card>
          <Card>
            <Meta
              label="Customer"
              value={<Link href={`/customers/${job.customerId}`}>{job.customer.name}</Link>}
            />
            <div className="mt-3">
              <Meta
                label="Property"
                value={<Link href={`/properties/${job.propertyId}`}>{formatAddress(job.property)}</Link>}
              />
            </div>
            <div className="mt-3">
              <Meta label="When" value={formatDateTime(job.appointmentStart)} />
            </div>
            <div className="mt-3">
              <Meta label="Plumber" value={job.assignedTo?.name} />
            </div>
            <div className="mt-3">
              <Meta label="Checked in" value={formatDateTime(job.checkedInAt)} />
            </div>
            <div className="mt-3">
              <Meta
                label="Sign-off"
                value={job.signatureName ? `${job.signatureName} (stub)` : "—"}
              />
            </div>
          </Card>
          <Card>
            <h3 className="font-heading text-xl uppercase text-navy mb-2">Workflow</h3>
            <ol className="space-y-2 text-sm">
              {job.statusHistory.map((h) => (
                <li key={h.id}>
                  {h.from ? `${JOB_STATUS_LABELS[h.from]} → ` : ""}
                  {JOB_STATUS_LABELS[h.to]}
                  <span className="block text-[#5b6b78]">{formatDateTime(h.createdAt)}</span>
                </li>
              ))}
            </ol>
          </Card>
          <Card>
            <h3 className="font-heading text-xl uppercase text-navy mb-2">Media & certificates</h3>
            <ul className="text-sm">
              {job.documents.map((d) => (
                <li key={d.id}>{d.name} (placeholder)</li>
              ))}
              {!job.documents.length ? <li>Photo / PDF stubs attach here in production.</li> : null}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
