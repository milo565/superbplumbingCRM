import { createProperty } from "@/actions/crm";
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "New site" };

export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  await requirePermission("properties:write");
  const { customerId } = await searchParams;
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader eyebrow="Sites" title="Add a property" description="Capture the bits that save a wasted trip." />
      <Card>
        <form action={createProperty} className="grid md:grid-cols-2 gap-4">
          <Field label="Customer">
            <Select name="customerId" defaultValue={customerId} required>
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customerNumber} · {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Site label">
            <Input name="label" placeholder="Primary home, Tenancy B12…" />
          </Field>
          <Field label="Street">
            <Input name="street" required />
          </Field>
          <Field label="Suburb">
            <Input name="suburb" required />
          </Field>
          <Field label="Postcode">
            <Input name="postcode" required />
          </Field>
          <Field label="Type">
            <Select name="type" defaultValue="RESIDENTIAL">
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="INDUSTRIAL">Industrial</option>
            </Select>
          </Field>
          <Field label="Site contact">
            <Input name="siteContactName" />
          </Field>
          <Field label="Site phone">
            <Input name="siteContactPhone" />
          </Field>
          <Field label="Property manager">
            <Input name="propertyManager" />
          </Field>
          <Field label="Keys / lockbox">
            <Input name="keysLockbox" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Access">
              <Textarea name="accessNotes" />
            </Field>
          </div>
          <Field label="Parking">
            <Textarea name="parkingNotes" />
          </Field>
          <Field label="Pets / hazards">
            <Textarea name="petsHazards" />
          </Field>
          <Field label="Water meter">
            <Input name="waterMeter" />
          </Field>
          <Field label="Shut-off">
            <Input name="shutOffLocation" />
          </Field>
          <Field label="Hot water">
            <Input name="hotWaterSystem" />
          </Field>
          <Field label="Gas">
            <Input name="gasNotes" />
          </Field>
          <Field label="Roofing / drainage">
            <Input name="roofingDrainage" />
          </Field>
          <Field label="Fixtures">
            <Input name="fixtures" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Compliance">
              <Textarea name="complianceNotes" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Recommendations">
              <Textarea name="recommendations" />
            </Field>
          </div>
          <div>
            <Button type="submit">Save site</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
