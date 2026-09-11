import Link from "next/link";
import { notFound } from "next/navigation";
import { addCommunication, updateCustomer } from "@/actions/crm";
import { Button, Card, Field, Input, PageHeader, Select, StatusBadge, Textarea } from "@/components/ui";
import { JobList, Meta } from "@/components/lists";
import {
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_TYPE_LABELS,
  JOB_STATUS_LABELS,
} from "@/lib/constants";
import { formatAddress, formatDate, formatMoney, formatPhone, mapsHref, telHref } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/rbac";
import { statusTone } from "@/lib/workflow";

export const metadata = { title: "Customer" };

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      accountManager: true,
      properties: { orderBy: { suburb: "asc" } },
      jobs: {
        include: { customer: true, property: true, assignedTo: true },
        orderBy: { createdAt: "desc" },
      },
      quotes: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { issuedAt: "desc" } },
      communications: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 12 },
      followUps: { orderBy: { dueAt: "desc" }, take: 8 },
      documents: true,
    },
  });
  if (!customer) notFound();

  const totals = customer.invoices.reduce((s, i) => s + i.totalIncGst, 0);
  const lastCompleted = customer.jobs.find((j) => j.completedAt);
  const managers = await prisma.user.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow={customer.customerNumber}
        title={customer.name}
        description={`${CUSTOMER_TYPE_LABELS[customer.type]} · ${customer.billingSuburb}`}
        actions={
          <>
            {telHref(customer.phone) ? (
              <Button href={telHref(customer.phone)!} variant="orange">
                Call {formatPhone(customer.phone)}
              </Button>
            ) : null}
            <Button href={`/jobs/new?customerId=${customer.id}`} variant="navy">
              New job
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2 mb-5">
        <StatusBadge label={CUSTOMER_STATUS_LABELS[customer.status]} tone="blue" />
        {customer.marketingOptOut ? (
          <StatusBadge label="Opted out of marketing" tone="red" />
        ) : (
          <StatusBadge label="Consent on file" tone="green" />
        )}
        {customer.properties.length > 1 ? (
          <StatusBadge label={`${customer.properties.length} sites`} tone="pale" />
        ) : null}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <h2 className="font-heading text-2xl uppercase tracking-wide text-navy mb-3">
              Previous work
            </h2>
            <JobList jobs={customer.jobs} />
            {lastCompleted ? (
              <div className="mt-4">
                <Button href={`/jobs/new?customerId=${customer.id}&followUpOf=${lastCompleted.id}`}>
                  Create follow-up job
                </Button>
              </div>
            ) : null}
          </Card>

          <Card>
            <h2 className="font-heading text-2xl uppercase tracking-wide text-navy mb-3">
              Communication history
            </h2>
            <div className="space-y-3 mb-5">
              {customer.communications.map((item) => (
                <div key={item.id} className="border-b border-[#f0f3f5] pb-3">
                  <p className="text-sm font-semibold">
                    {item.type} · {item.direction} · {formatDate(item.createdAt)}
                  </p>
                  <p className="text-sm text-[#3c4d5a]">{item.body}</p>
                </div>
              ))}
              {!customer.communications.length ? (
                <p className="text-sm text-[#5b6b78]">No notes yet.</p>
              ) : null}
            </div>
            <form action={addCommunication} className="grid gap-3">
              <input type="hidden" name="customerId" value={customer.id} />
              <div className="grid sm:grid-cols-2 gap-3">
                <Select name="type" defaultValue="NOTE">
                  <option value="NOTE">Note</option>
                  <option value="PHONE">Phone</option>
                  <option value="SMS">SMS</option>
                  <option value="EMAIL">Email</option>
                  <option value="SITE_VISIT">Site visit</option>
                </Select>
                <Input name="subject" placeholder="Subject" />
              </div>
              <Textarea name="body" required placeholder="What was said or decided" />
              <Button type="submit" variant="ghost">
                Add to history
              </Button>
            </form>
          </Card>

          {can(user.role, "customers:write") ? (
            <Card>
              <h2 className="font-heading text-2xl uppercase tracking-wide text-navy mb-3">
                Edit details
              </h2>
              <form action={updateCustomer} className="grid md:grid-cols-2 gap-3">
                <input type="hidden" name="id" value={customer.id} />
                <Field label="Name">
                  <Input name="name" defaultValue={customer.name} required />
                </Field>
                <Field label="Contact">
                  <Input name="contactName" defaultValue={customer.contactName ?? ""} />
                </Field>
                <Field label="Phone">
                  <Input name="phone" defaultValue={customer.phone} required />
                </Field>
                <Field label="Email">
                  <Input name="email" defaultValue={customer.email ?? ""} />
                </Field>
                <Field label="Type">
                  <Select name="type" defaultValue={customer.type}>
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="INDUSTRIAL">Industrial</option>
                  </Select>
                </Field>
                <Field label="Status">
                  <Select name="status" defaultValue={customer.status}>
                    <option value="ACTIVE">Active</option>
                    <option value="PROSPECT">Prospect</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ARCHIVED">Archived</option>
                  </Select>
                </Field>
                <Field label="Billing street">
                  <Input name="billingStreet" defaultValue={customer.billingStreet} />
                </Field>
                <Field label="Suburb">
                  <Input name="billingSuburb" defaultValue={customer.billingSuburb} />
                </Field>
                <Field label="State">
                  <Input name="billingState" defaultValue={customer.billingState} />
                </Field>
                <Field label="Postcode">
                  <Input name="billingPostcode" defaultValue={customer.billingPostcode} />
                </Field>
                <Field label="Preferred contact">
                  <Select name="preferredContact" defaultValue={customer.preferredContact}>
                    <option value="phone">Phone</option>
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                  </Select>
                </Field>
                <Field label="Source">
                  <Input name="source" defaultValue={customer.source ?? ""} />
                </Field>
                <Field label="Account manager">
                  <Select name="accountManagerId" defaultValue={customer.accountManagerId ?? ""}>
                    <option value="">Unassigned</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Preferred times">
                  <Input name="preferredTimes" defaultValue={customer.preferredTimes ?? ""} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Access">
                    <Textarea name="accessInstructions" defaultValue={customer.accessInstructions ?? ""} />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Notes">
                    <Textarea name="notes" defaultValue={customer.notes ?? ""} />
                  </Field>
                </div>
                <label className="md:col-span-2 flex items-center gap-2 text-sm">
                  <input type="checkbox" name="marketingOptOut" defaultChecked={customer.marketingOptOut} />
                  Marketing opt-out
                </label>
                <div>
                  <Button type="submit">Save changes</Button>
                </div>
              </form>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card className="bg-navy-2 text-white border-0">
            <div className="space-y-3">
              <Meta label="Phone" value={<a className="text-blue" href={telHref(customer.phone)}>{formatPhone(customer.phone)}</a>} />
              <Meta label="Email" value={customer.email} />
              <Meta
                label="Billing"
                value={
                  <a
                    className="underline decoration-white/30"
                    href={mapsHref(
                      formatAddress({
                        street: customer.billingStreet,
                        suburb: customer.billingSuburb,
                        state: customer.billingState,
                        postcode: customer.billingPostcode,
                      }),
                    )}
                  >
                    {formatAddress({
                      street: customer.billingStreet,
                      suburb: customer.billingSuburb,
                      state: customer.billingState,
                      postcode: customer.billingPostcode,
                    })}
                  </a>
                }
              />
              <Meta label="Account manager" value={customer.accountManager?.name} />
              <Meta label="Last job" value={formatDate(customer.lastJobAt)} />
              <Meta label="Next follow-up" value={formatDate(customer.nextFollowUpAt)} />
              <Meta label="Invoiced to date" value={formatMoney(totals)} />
            </div>
          </Card>

          <Card>
            <h2 className="font-heading text-xl uppercase tracking-wide text-navy mb-3">Sites</h2>
            <div className="space-y-3">
              {customer.properties.map((property) => (
                <Link key={property.id} href={`/properties/${property.id}`} className="block">
                  <p className="font-semibold text-navy">{property.label || property.street}</p>
                  <p className="text-sm text-[#4b5c69]">{formatAddress(property)}</p>
                </Link>
              ))}
            </div>
            <Button href={`/properties/new?customerId=${customer.id}`} variant="ghost" className="mt-3">
              Add site
            </Button>
          </Card>

          <Card>
            <h2 className="font-heading text-xl uppercase tracking-wide text-navy mb-3">Quotes & invoices</h2>
            <ul className="text-sm space-y-2">
              {customer.quotes.map((q) => (
                <li key={q.id}>
                  <Link href={`/quotes/${q.id}`} className="text-blue font-medium">
                    {q.quoteNumber}
                  </Link>{" "}
                  {q.title} · {formatMoney(q.totalIncGst)}
                </li>
              ))}
              {customer.invoices.map((inv) => (
                <li key={inv.id}>
                  <Link href={`/invoices/${inv.id}`} className="text-blue font-medium">
                    {inv.invoiceNumber}
                  </Link>{" "}
                  {formatMoney(inv.totalIncGst)}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="font-heading text-xl uppercase tracking-wide text-navy mb-3">Documents</h2>
            <ul className="text-sm space-y-1">
              {customer.documents.map((doc) => (
                <li key={doc.id}>
                  {doc.name} {doc.placeholder ? "(placeholder)" : ""}
                </li>
              ))}
              {!customer.documents.length ? <li className="text-[#5b6b78]">No files stored yet.</li> : null}
            </ul>
          </Card>

          <Card className="bg-pale">
            <h2 className="font-heading text-xl uppercase tracking-wide text-navy mb-2">Follow-ups</h2>
            <ul className="text-sm space-y-2">
              {customer.followUps.map((f) => (
                <li key={f.id}>
                  <Link href="/follow-ups" className="font-medium">
                    {f.title}
                  </Link>
                  <span className="block text-[#4b5c69]">
                    {formatDate(f.dueAt)} · {f.status}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
      <p className="hidden">{JOB_STATUS_LABELS.PAID}{statusTone("PAID")}</p>
    </div>
  );
}
