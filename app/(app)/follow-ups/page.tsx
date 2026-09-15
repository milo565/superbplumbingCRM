import { addDays } from "date-fns";
import {
  approveFollowUp,
  completeFollowUp,
  createFollowUp,
  sendFollowUp,
  snoozeFollowUp,
} from "@/actions/crm";
import { Button, Card, Field, Input, PageHeader, Select, StatusBadge, Textarea } from "@/components/ui";
import { CHANNEL_LABELS, FOLLOW_UP_STATUS_LABELS } from "@/lib/constants";
import { formatDateTime, localDayRange } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { can } from "@/lib/rbac";

export const metadata = { title: "Follow-ups" };

export default async function FollowUpsPage({
  searchParams,
}: {
  searchParams: Promise<{ due?: string; window?: string }>;
}) {
  const user = await requirePermission("followups:read");
  const { due, window } = await searchParams;
  const { start, end } = localDayRange();
  const followUps = await prisma.followUp.findMany({
    where:
      due === "today"
        ? { dueAt: { gte: start, lt: end } }
        : window === "approaching"
          ? { dueAt: { gte: start, lte: addDays(end, 21) }, customer: { marketingOptOut: false } }
          : undefined,
    include: { customer: true, job: true, assignedTo: true },
    orderBy: { dueAt: "asc" },
  });
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });
  const templates = await prisma.template.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader
        eyebrow="Keep in touch"
        title="Follow-ups"
        description="6 and 12-month filter / service reminders, then a call if they go quiet. Opt-outs are never contacted."
      />
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {followUps.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-semibold text-navy">{item.title}</p>
                  <p className="text-sm text-[#4b5c69]">
                    {item.customer.name} · {formatDateTime(item.dueAt)} · {CHANNEL_LABELS[item.channel]}
                  </p>
                </div>
                <StatusBadge
                  label={FOLLOW_UP_STATUS_LABELS[item.status]}
                  tone={
                    item.status === "BLOCKED_OPT_OUT"
                      ? "red"
                      : item.status === "AWAITING_APPROVAL"
                        ? "orange"
                        : item.status === "COMPLETED"
                          ? "green"
                          : "pale"
                  }
                />
              </div>
              <p className="text-sm mt-2 whitespace-pre-wrap">{item.body}</p>
              {item.customer.marketingOptOut ? (
                <p className="text-sm text-[#B42318] mt-2">This customer has opted out of marketing.</p>
              ) : null}
              <div className="flex flex-wrap gap-2 mt-3">
                {item.status === "AWAITING_APPROVAL" && can(user.role, "followups:approve") ? (
                  <form action={approveFollowUp}>
                    <input type="hidden" name="id" value={item.id} />
                    <Button type="submit">Approve</Button>
                  </form>
                ) : null}
                {can(user.role, "followups:write") ? (
                  <>
                    <form action={sendFollowUp}>
                      <input type="hidden" name="id" value={item.id} />
                      <Button type="submit" variant="navy">
                        {item.channel === "CALL" ? "Log call" : "Send (stub)"}
                      </Button>
                    </form>
                    <form action={snoozeFollowUp} className="flex gap-2">
                      <input type="hidden" name="id" value={item.id} />
                      <Input name="until" type="date" />
                      <Button type="submit" variant="ghost">
                        Snooze
                      </Button>
                    </form>
                    <form action={completeFollowUp}>
                      <input type="hidden" name="id" value={item.id} />
                      <Button type="submit" variant="ghost">
                        Done
                      </Button>
                    </form>
                  </>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
        <Card>
          <h2 className="font-heading text-xl uppercase text-navy mb-3">Create follow-up</h2>
          <form action={createFollowUp} className="space-y-3">
            <Field label="Customer">
              <Select name="customerId" required>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.marketingOptOut ? " (opt-out)" : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Title">
              <Input name="title" required />
            </Field>
            <Field label="Channel">
              <Select name="channel" defaultValue="CALL">
                <option value="INTERNAL">Internal</option>
                <option value="SMS">SMS</option>
                <option value="EMAIL">Email</option>
                <option value="CALL">Call</option>
              </Select>
            </Field>
            <Field label="Due">
              <Input name="dueAt" type="datetime-local" required />
            </Field>
            <Field label="Message">
              <Textarea name="body" required defaultValue={templates[0]?.body} />
            </Field>
            <Button type="submit">Add follow-up</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
