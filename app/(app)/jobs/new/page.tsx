import { createJob } from "@/actions/crm";
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
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
    include: { properties: true },
    orderBy: { name: "asc" },
  });
  const plumbers = await prisma.user.findMany({
    where: { active: true, role: { in: ["PLUMBER", "SUPERVISOR", "OWNER"] } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Jobs"
        title={enquiry ? "Log a new enquiry" : "Raise a job"}
        description="Capture enough to arrive ready. The rest can wait."
      />
      <Card>
        <form action={createJob} className="grid md:grid-cols-2 gap-4">
          <input type="hidden" name="status" value={enquiry ? "NEW_ENQUIRY" : "TRIAGE_REQUIRED"} />
          <Field label="Customer">
            <Select name="customerId" defaultValue={customerId} required>
              <option value="">Select</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customerNumber} · {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Property">
            <Select name="propertyId" defaultValue={propertyId} required>
              <option value="">Select site</option>
              {customers.flatMap((c) =>
                c.properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {c.name} — {p.street}, {p.suburb}
                  </option>
                )),
              )}
            </Select>
          </Field>
          <Field label="Title">
            <Input name="title" required placeholder="Burst pipe — kitchen supply" />
          </Field>
          <Field label="Category">
            <Select name="category" defaultValue="GENERAL_PLUMBING">
              <option value="GENERAL_PLUMBING">General plumbing</option>
              <option value="GAS_FITTING">Gas fitting</option>
              <option value="DRAINAGE">Drainage</option>
              <option value="ROOFING">Roofing</option>
              <option value="MAINTENANCE">Maintenance</option>
            </Select>
          </Field>
          <Field label="Priority">
            <Select name="priority" defaultValue="NORMAL">
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
              <option value="EMERGENCY">Emergency</option>
            </Select>
          </Field>
          <Field label="Assign plumber">
            <Select name="assignedToId">
              <option value="">Unassigned</option>
              {plumbers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Appointment">
            <Input name="appointmentStart" type="datetime-local" />
          </Field>
          <Field label="Window label">
            <Input name="windowLabel" placeholder="08:00–10:00" />
          </Field>
          <div className="md:col-span-2">
            <Field label="What's happening">
              <Textarea name="description" required />
            </Field>
          </div>
          <Field label="Labour hours">
            <Input name="labourHours" type="number" step="0.25" defaultValue="2" />
          </Field>
          <Field label="Labour rate (ex GST)">
            <Input name="labourRate" type="number" step="1" defaultValue="120" />
          </Field>
          <Field label="Materials (ex GST)">
            <Input name="materialsCost" type="number" step="0.01" defaultValue="0" />
          </Field>
          <label className="flex items-center gap-2 text-sm mt-8">
            <input type="checkbox" name="emergency" /> Emergency
          </label>
          <div className="md:col-span-2">
            <Button type="submit" variant="orange">
              Save job
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
