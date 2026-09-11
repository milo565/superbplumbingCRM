import Link from "next/link";
import { notFound } from "next/navigation";
import { updateProperty } from "@/actions/crm";
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { JobList, Meta } from "@/components/lists";
import { formatAddress, mapsHref, telHref } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Property" };

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("properties:read");
  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      customer: true,
      jobs: { include: { customer: true, property: true, assignedTo: true }, orderBy: { createdAt: "desc" } },
      documents: true,
      maintenancePlans: true,
    },
  });
  if (!property) notFound();

  return (
    <div>
      <PageHeader
        eyebrow={property.customer.name}
        title={property.label || property.street}
        description={formatAddress(property)}
        actions={
          <>
            <Button href={mapsHref(formatAddress(property))} variant="ghost">
              Maps
            </Button>
            <Button href={`/jobs/new?customerId=${property.customerId}&propertyId=${property.id}`}>
              Job at this site
            </Button>
          </>
        }
      />
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <h2 className="font-heading text-2xl uppercase tracking-wide text-navy mb-3">Work history</h2>
            <JobList jobs={property.jobs} />
          </Card>
          <Card>
            <h2 className="font-heading text-2xl uppercase tracking-wide text-navy mb-3">Site record</h2>
            <form action={updateProperty} className="grid md:grid-cols-2 gap-3">
              <input type="hidden" name="id" value={property.id} />
              <Field label="Label">
                <Input name="label" defaultValue={property.label ?? ""} />
              </Field>
              <Field label="Type">
                <Select name="type" defaultValue={property.type}>
                  <option value="RESIDENTIAL">Residential</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="INDUSTRIAL">Industrial</option>
                </Select>
              </Field>
              <Field label="Street">
                <Input name="street" defaultValue={property.street} />
              </Field>
              <Field label="Suburb">
                <Input name="suburb" defaultValue={property.suburb} />
              </Field>
              <Field label="Postcode">
                <Input name="postcode" defaultValue={property.postcode} />
              </Field>
              <Field label="Site contact">
                <Input name="siteContactName" defaultValue={property.siteContactName ?? ""} />
              </Field>
              <Field label="Site phone">
                <Input name="siteContactPhone" defaultValue={property.siteContactPhone ?? ""} />
              </Field>
              <Field label="Property manager">
                <Input name="propertyManager" defaultValue={property.propertyManager ?? ""} />
              </Field>
              <Field label="Keys / lockbox">
                <Input name="keysLockbox" defaultValue={property.keysLockbox ?? ""} />
              </Field>
              <Field label="Water meter">
                <Input name="waterMeter" defaultValue={property.waterMeter ?? ""} />
              </Field>
              <Field label="Shut-off">
                <Input name="shutOffLocation" defaultValue={property.shutOffLocation ?? ""} />
              </Field>
              <Field label="Hot water">
                <Input name="hotWaterSystem" defaultValue={property.hotWaterSystem ?? ""} />
              </Field>
              <Field label="Gas">
                <Input name="gasNotes" defaultValue={property.gasNotes ?? ""} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Access">
                  <Textarea name="accessNotes" defaultValue={property.accessNotes ?? ""} />
                </Field>
              </div>
              <Field label="Parking">
                <Textarea name="parkingNotes" defaultValue={property.parkingNotes ?? ""} />
              </Field>
              <Field label="Pets / hazards">
                <Textarea name="petsHazards" defaultValue={property.petsHazards ?? ""} />
              </Field>
              <Field label="Roofing / drainage">
                <Textarea name="roofingDrainage" defaultValue={property.roofingDrainage ?? ""} />
              </Field>
              <Field label="Fixtures">
                <Textarea name="fixtures" defaultValue={property.fixtures ?? ""} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Compliance">
                  <Textarea name="complianceNotes" defaultValue={property.complianceNotes ?? ""} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Recommendations">
                  <Textarea name="recommendations" defaultValue={property.recommendations ?? ""} />
                </Field>
              </div>
              <Button type="submit">Save site</Button>
            </form>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="bg-pale-2">
            <Meta
              label="Customer"
              value={<Link href={`/customers/${property.customerId}`}>{property.customer.name}</Link>}
            />
            <div className="mt-3">
              <Meta
                label="Call site"
                value={
                  property.siteContactPhone ? (
                    <a href={telHref(property.siteContactPhone)}>{property.siteContactPhone}</a>
                  ) : (
                    "—"
                  )
                }
              />
            </div>
          </Card>
          <Card>
            <h3 className="font-heading text-xl uppercase text-navy">Maintenance</h3>
            <ul className="mt-2 text-sm space-y-2">
              {property.maintenancePlans.map((plan) => (
                <li key={plan.id}>
                  <Link href={`/maintenance/${plan.id}`}>{plan.name}</Link>
                </li>
              ))}
              {!property.maintenancePlans.length ? <li>No plan on this site yet.</li> : null}
            </ul>
          </Card>
          <Card>
            <h3 className="font-heading text-xl uppercase text-navy">Photos & docs</h3>
            <ul className="mt-2 text-sm">
              {property.documents.map((d) => (
                <li key={d.id}>{d.name} (placeholder)</li>
              ))}
              {!property.documents.length ? <li>Upload stubs live on the job record.</li> : null}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
