import { addDays, startOfMonth, startOfWeek, startOfYear, subMonths } from "date-fns";
import {
  InvoiceStatus,
  JobStatus,
  QuoteStatus,
} from "@prisma/client";
import { PageHeader, SectionTitle, StatCard, Card } from "@/components/ui";
import { JobList } from "@/components/lists";
import { CATEGORY_LABELS, TONE } from "@/lib/constants";
import { formatMoney, localDayRange } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { currentScope } from "@/lib/session";
import { isCompletedWork } from "@/lib/workflow";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { user, assignedOnly } = await currentScope();
  const jobScope = assignedOnly ? { assignedToId: user.id } : {};
  const { start: todayStart, end: todayEnd } = localDayRange();
  const weekStart = startOfWeek(todayStart, { weekStartsOn: 1 });
  const monthStart = startOfMonth(todayStart);
  const yearStart = startOfYear(todayStart);
  const followWindowEnd = addDays(todayEnd, 21);
  const sixMonthsAgo = subMonths(todayStart, 6);
  const nineMonthsAgo = subMonths(todayStart, 9);
  const twelveMonthsAgo = subMonths(todayStart, 12);

  const [
    todayJobs,
    emergencies,
    awaitingAssign,
    quotesAwaiting,
    approvedReady,
    inProgress,
    awaitingInvoice,
    outstandingInvoices,
    followUpsToday,
    approachingFollow,
    maintenanceDue,
    paidInvoices,
    quotes,
    completedJobs,
    categoryJobs,
    technicianLoad,
  ] = await Promise.all([
    prisma.job.findMany({
      where: {
        ...jobScope,
        appointmentStart: { gte: todayStart, lt: todayEnd },
      },
      include: { customer: true, property: true, assignedTo: true },
      orderBy: { appointmentStart: "asc" },
    }),
    prisma.job.count({
      where: { ...jobScope, OR: [{ emergency: true }, { priority: "EMERGENCY" }], status: { notIn: ["PAID", "COMPLETED"] } },
    }),
    prisma.job.count({
      where: { ...jobScope, assignedToId: null, status: { in: ["APPROVED", "SCHEDULED", "NEW_ENQUIRY", "TRIAGE_REQUIRED"] } },
    }),
    prisma.quote.count({ where: { status: { in: [QuoteStatus.SENT, QuoteStatus.FOLLOW_UP] } } }),
    prisma.job.count({ where: { ...jobScope, status: JobStatus.APPROVED } }),
    prisma.job.count({
      where: { ...jobScope, status: { in: [JobStatus.IN_PROGRESS, JobStatus.ON_THE_WAY, JobStatus.AWAITING_PARTS] } },
    }),
    prisma.job.count({
      where: { ...jobScope, status: { in: [JobStatus.COMPLETED, JobStatus.CUSTOMER_SIGN_OFF, JobStatus.READY_TO_INVOICE] } },
    }),
    prisma.invoice.aggregate({
      where: { status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE] } },
      _sum: { totalIncGst: true },
      _count: true,
    }),
    prisma.followUp.count({
      where: {
        dueAt: { gte: todayStart, lt: todayEnd },
        status: { in: ["PENDING", "AWAITING_APPROVAL", "APPROVED"] },
      },
    }),
    prisma.customer.count({
      where: {
        nextFollowUpAt: { gte: todayStart, lte: followWindowEnd },
        marketingOptOut: false,
      },
    }),
    prisma.maintenancePlan.count({
      where: { active: true, nextDueAt: { lte: addDays(todayEnd, 14) } },
    }),
    prisma.invoice.findMany({
      where: { status: InvoiceStatus.PAID, paidAt: { gte: yearStart } },
      select: { totalIncGst: true, paidAt: true },
    }),
    prisma.quote.findMany({ select: { status: true } }),
    prisma.job.findMany({
      where: { status: { in: ["COMPLETED", "CUSTOMER_SIGN_OFF", "READY_TO_INVOICE", "INVOICED", "PAID", "MAINTENANCE_FOLLOW_UP_SCHEDULED"] } },
      select: { customerId: true, category: true, totalIncGst: true, status: true },
    }),
    prisma.job.groupBy({
      by: ["category"],
      _count: true,
      _sum: { totalIncGst: true },
    }),
    prisma.user.findMany({
      where: { role: { in: ["PLUMBER", "SUPERVISOR", "OWNER"] }, active: true },
      include: {
        assignedJobs: {
          where: { status: { in: ["SCHEDULED", "PLUMBER_ASSIGNED", "ON_THE_WAY", "IN_PROGRESS", "AWAITING_PARTS"] } },
          select: { id: true },
        },
      },
    }),
  ]);

  const revenue = {
    week: paidInvoices
      .filter((i) => i.paidAt && i.paidAt >= weekStart)
      .reduce((s, i) => s + i.totalIncGst, 0),
    month: paidInvoices
      .filter((i) => i.paidAt && i.paidAt >= monthStart)
      .reduce((s, i) => s + i.totalIncGst, 0),
    year: paidInvoices.reduce((s, i) => s + i.totalIncGst, 0),
  };

  const converted = quotes.filter((q) => q.status === "CONVERTED" || q.status === "APPROVED").length;
  const conversion = quotes.length ? Math.round((converted / quotes.length) * 100) : 0;
  const uniqueCustomers = new Set(completedJobs.map((j) => j.customerId));
  const repeat = [...uniqueCustomers].filter(
    (id) => completedJobs.filter((j) => j.customerId === id).length > 1,
  ).length;
  const repeatRate = uniqueCustomers.size ? Math.round((repeat / uniqueCustomers.size) * 100) : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Today"
        title="Today's board."
        description={`${TONE.nextStep} ${assignedOnly ? "Showing jobs assigned to you." : "Whole crew view."}`}
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <StatCard href="/calendar" label="Today's scheduled jobs" value={todayJobs.length} tone="blue" hint="Open the day board" />
        <StatCard href="/jobs?filter=emergency" label="Emergency jobs" value={emergencies} tone="orange" hint="Safety first" />
        <StatCard href="/jobs?filter=unassigned" label="Awaiting assignment" value={awaitingAssign} tone="navy" />
        <StatCard href="/quotes?status=SENT" label="Quotes awaiting approval" value={quotesAwaiting} tone="white" />
        <StatCard href="/jobs?status=APPROVED" label="Approved, ready to schedule" value={approvedReady} tone="white" />
        <StatCard href="/jobs?filter=active" label="Jobs in progress" value={inProgress} tone="blue" />
        <StatCard href="/jobs?filter=invoice" label="Awaiting invoicing" value={awaitingInvoice} tone="navy" />
        <StatCard
          href="/invoices?status=outstanding"
          label="Outstanding invoices"
          value={outstandingInvoices._count}
          hint={formatMoney(outstandingInvoices._sum.totalIncGst ?? 0)}
          tone="orange"
        />
        <StatCard href="/follow-ups?due=today" label="Follow-ups due today" value={followUpsToday} tone="orange" />
        <StatCard href="/follow-ups?window=approaching" label="6 / 9 / 12-month follow-ups" value={approachingFollow} tone="white" hint="Customers coming due" />
        <StatCard href="/maintenance?due=soon" label="Recurring maintenance due" value={maintenanceDue} tone="white" />
        <StatCard href="/reports" label="Quote conversion" value={`${conversion}%`} tone="navy" hint={`Repeat customers ${repeatRate}%`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <SectionTitle>On the tools today</SectionTitle>
          <JobList jobs={todayJobs} />
        </Card>
        <Card className="bg-navy text-white border-0">
          <p className="text-sm text-white/70">Revenue (paid)</p>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#9cb4c4]">This week</p>
              <p className="font-heading text-4xl">{formatMoney(revenue.week)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[#9cb4c4]">This month</p>
              <p className="font-heading text-3xl">{formatMoney(revenue.month)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[#9cb4c4]">This year</p>
              <p className="font-heading text-3xl">{formatMoney(revenue.year)}</p>
            </div>
          </div>
          <p className="mt-6 text-sm text-[#c5d6e2]">GST inclusive. {TONE.holdsUp}</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <SectionTitle>Work by service</SectionTitle>
          <div className="space-y-3">
            {categoryJobs.map((row) => (
              <div key={row.category} className="flex items-center justify-between text-sm">
                <span>{CATEGORY_LABELS[row.category]}</span>
                <span className="font-semibold text-navy">
                  {row._count} jobs · {formatMoney(row._sum.totalIncGst ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle>Workload by technician</SectionTitle>
          <div className="space-y-3">
            {technicianLoad.map((person) => (
              <div key={person.id} className="flex items-center justify-between text-sm">
                <span>{person.name}</span>
                <span className="font-semibold text-navy">
                  {person.assignedJobs.length} active
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <p className="sr-only">
        Reference windows {sixMonthsAgo.toISOString()} {nineMonthsAgo.toISOString()}{" "}
        {twelveMonthsAgo.toISOString()} {isCompletedWork("PAID")}
      </p>
    </div>
  );
}
