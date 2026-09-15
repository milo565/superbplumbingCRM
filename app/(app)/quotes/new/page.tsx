import { createQuote } from "@/actions/crm";
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { CATEGORY_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "New quote" };

export default async function NewQuotePage() {
  await requirePermission("quotes:write");
  const customers = await prisma.customer.findMany({
    include: { properties: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader eyebrow="Quotes" title="Prepare a quote" description="GST is added at 10% on labour and materials." />
      <Card>
        <form action={createQuote} className="grid md:grid-cols-2 gap-4">
          <Field label="Customer">
            <Select name="customerId" required>
              <option value="">Select</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Property">
            <Select name="propertyId" required>
              <option value="">Select</option>
              {customers.flatMap((c) =>
                c.properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {c.name} — {p.suburb}
                  </option>
                )),
              )}
            </Select>
          </Field>
          <Field label="Title">
            <Input name="title" required />
          </Field>
          <Field label="Category">
            <Select name="category" defaultValue="SPLIT_INSTALL">
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Introduction">
              <Textarea name="introduction" />
            </Field>
          </div>
          <Field label="Labour hours">
            <Input name="labourHours" type="number" step="0.25" defaultValue="2" />
          </Field>
          <Field label="Labour rate">
            <Input name="labourRate" type="number" defaultValue="120" />
          </Field>
          <Field label="Materials">
            <Input name="materialsCost" type="number" step="0.01" defaultValue="0" />
          </Field>
          <Field label="Valid until">
            <Input name="validUntil" type="date" />
          </Field>
          <div className="md:col-span-2">
            <Button type="submit">Save draft quote</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
