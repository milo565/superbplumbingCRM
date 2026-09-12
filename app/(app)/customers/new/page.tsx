import { createCustomer } from "@/actions/crm";
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "New customer" };

export default async function NewCustomerPage() {
  await requirePermission("customers:write");
  const managers = await prisma.user.findMany({
    where: { active: true, role: { in: ["OWNER", "SALES", "OFFICE_ADMIN", "SUPERVISOR"] } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Customers"
        title="Add a customer"
        description="A few useful bits so the next visit starts ready."
      />
      <Card>
        <form action={createCustomer} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="confirmDuplicate" value="yes" />
          <Field label="Customer / business name">
            <Input name="name" required placeholder="Elena Papadopoulos" />
          </Field>
          <Field label="Primary contact">
            <Input name="contactName" placeholder="Same as above if residential" />
          </Field>
          <Field label="Phone">
            <Input name="phone" required placeholder="0412 000 000" />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" />
          </Field>
          <Field label="Type">
            <Select name="type" defaultValue="RESIDENTIAL">
              <option value="RESIDENTIAL">Residential</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="INDUSTRIAL">Industrial</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue="ACTIVE">
              <option value="ACTIVE">Active</option>
              <option value="PROSPECT">Prospect</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </Field>
          <Field label="Billing street">
            <Input name="billingStreet" required />
          </Field>
          <Field label="Suburb">
            <Input name="billingSuburb" required />
          </Field>
          <Field label="State">
            <Input name="billingState" defaultValue="VIC" />
          </Field>
          <Field label="Postcode">
            <Input name="billingPostcode" required />
          </Field>
          <Field label="Preferred contact">
            <Select name="preferredContact" defaultValue="phone">
              <option value="phone">Phone</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
            </Select>
          </Field>
          <Field label="Source">
            <Input name="source" placeholder="Google, referral, repeat…" />
          </Field>
          <Field label="Account manager">
            <Select name="accountManagerId">
              <option value="">Unassigned</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Preferred appointment times">
            <Input name="preferredTimes" placeholder="Mornings before 11" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Access instructions">
              <Textarea name="accessInstructions" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Notes">
              <Textarea name="notes" />
            </Field>
          </div>
          <label className="md:col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="marketingOptOut" />
            Marketing opt-out — never send follow-up SMS/email
          </label>
          <div className="md:col-span-2">
            <p className="text-sm font-semibold text-navy mb-2">Primary site (optional)</p>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Site street">
                <Input name="siteStreet" />
              </Field>
              <Field label="Site suburb">
                <Input name="siteSuburb" />
              </Field>
            </div>
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Save customer</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
