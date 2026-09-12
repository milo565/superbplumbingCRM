import { createMaintenancePlan } from "@/actions/crm";
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "New maintenance plan" };

export default async function NewMaintenancePage() {
  await requirePermission("maintenance:write");
  const customers = await prisma.customer.findMany({
    include: { properties: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader eyebrow="Maintenance" title="Start a plan" />
      <Card>
        <form action={createMaintenancePlan} className="grid md:grid-cols-2 gap-4">
          <Field label="Name">
            <Input name="name" required />
          </Field>
          <Field label="Type">
            <Select name="type" defaultValue="ANNUAL">
              <option value="SIX_MONTHLY">Six-monthly</option>
              <option value="ANNUAL">Annual</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="PM_PORTFOLIO">PM portfolio</option>
              <option value="CUSTOM">Custom</option>
            </Select>
          </Field>
          <Field label="Customer">
            <Select name="customerId" required>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Property">
            <Select name="propertyId" required>
              {customers.flatMap((c) =>
                c.properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {c.name} — {p.suburb}
                  </option>
                )),
              )}
            </Select>
          </Field>
          <Field label="Interval (months)">
            <Input name="intervalMonths" type="number" defaultValue="12" />
          </Field>
          <Field label="Next due">
            <Input name="nextDueAt" type="date" required />
          </Field>
          <div className="md:col-span-2">
            <Field label="Notes">
              <Textarea name="notes" />
            </Field>
          </div>
          <Button type="submit">Save plan</Button>
        </form>
      </Card>
    </div>
  );
}
