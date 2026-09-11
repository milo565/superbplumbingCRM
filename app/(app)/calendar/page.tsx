import Link from "next/link";
import { addDays, addWeeks, eachDayOfInterval, endOfMonth, format, startOfMonth, startOfWeek } from "date-fns";
import { Button, Card, PageHeader, StatusBadge } from "@/components/ui";
import { JOB_STATUS_LABELS } from "@/lib/constants";
import { formatTime, melbourneDayRange } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { jobScopeWhere } from "@/actions/shared";
import { statusTone } from "@/lib/workflow";

export const metadata = { title: "Calendar and scheduling" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const { view = "week", date } = await searchParams;
  const { where } = await jobScopeWhere();
  const anchor = date ? new Date(date) : new Date();
  const { start: todayStart } = melbourneDayRange(anchor);

  const rangeStart =
    view === "day"
      ? todayStart
      : view === "month"
        ? startOfMonth(anchor)
        : startOfWeek(anchor, { weekStartsOn: 1 });
  const rangeEnd =
    view === "day"
      ? addDays(rangeStart, 1)
      : view === "month"
        ? addDays(endOfMonth(anchor), 1)
        : addWeeks(rangeStart, 1);

  const jobs = await prisma.job.findMany({
    where: {
      AND: [where, { appointmentStart: { gte: rangeStart, lt: rangeEnd } }],
    },
    include: { customer: true, property: true, assignedTo: true },
    orderBy: { appointmentStart: "asc" },
  });

  const days = eachDayOfInterval({ start: rangeStart, end: addDays(rangeEnd, -1) });

  return (
    <div>
      <PageHeader
        eyebrow="Roster"
        title="Calendar and scheduling"
        description="Day, week or month. Tap a job to check in or move it."
        actions={
          <>
            <Button href="/calendar?view=day" variant={view === "day" ? "primary" : "ghost"}>
              Day
            </Button>
            <Button href="/calendar?view=week" variant={view === "week" ? "primary" : "ghost"}>
              Week
            </Button>
            <Button href="/calendar?view=month" variant={view === "month" ? "primary" : "ghost"}>
              Month
            </Button>
          </>
        }
      />
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayJobs = jobs.filter(
            (j) => j.appointmentStart && format(j.appointmentStart, "yyyy-MM-dd") === key,
          );
          return (
            <Card key={key} className={dayJobs.some((j) => j.emergency) ? "border-orange/40" : ""}>
              <p className="font-heading text-xl uppercase text-navy">{format(day, "EEE d MMM")}</p>
              <div className="mt-3 space-y-3">
                {dayJobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="block">
                    <p className="text-sm font-semibold">
                      {job.appointmentStart ? formatTime(job.appointmentStart) : "TBC"} · {job.title}
                    </p>
                    <p className="text-xs text-[#4b5c69]">
                      {job.customer.name} · {job.property.suburb}
                      {job.assignedTo ? ` · ${job.assignedTo.name}` : ""}
                    </p>
                    <StatusBadge label={JOB_STATUS_LABELS[job.status]} tone={statusTone(job.status)} />
                  </Link>
                ))}
                {!dayJobs.length ? <p className="text-sm text-[#5b6b78]">Clear day.</p> : null}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
