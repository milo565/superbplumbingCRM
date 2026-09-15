import { createProperty } from "@/actions/crm";
import { AddressMapPreview } from "@/components/address-map-preview";
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
          <AddressMapPreview />
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
          <Field label="Outdoor unit">
            <Input name="outdoorUnit" placeholder="Wall / roof / ground, make" />
          </Field>
          <Field label="Isolator location">
            <Input name="isolatorLocation" />
          </Field>
          <Field label="Indoor heads">
            <Input name="indoorHeads" placeholder="Count, rooms, cassette/split" />
          </Field>
          <Field label="Refrigerant">
            <Input name="refrigerantType" placeholder="R32 / R410A / reclaim notes" />
          </Field>
          <Field label="Mount notes">
            <Input name="mountNotes" placeholder="Roof / wall / slab, access" />
          </Field>
          <Field label="Model / serial">
            <Input name="modelSerial" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Filter / service dates">
              <Input name="filterDates" placeholder="Last filter clean, next due" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Compliance / warranty">
              <Textarea name="complianceNotes" placeholder="ARC, electrical isolator, warranty" />
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
