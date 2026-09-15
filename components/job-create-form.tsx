"use client";

import { useMemo, useState } from "react";
import { createJob } from "@/actions/crm";
import { MapPanel } from "@/components/map-panel";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { CATEGORY_LABELS } from "@/lib/constants";

export type JobFormCustomer = {
  id: string;
  customerNumber: string;
  name: string;
  phone: string;
  properties: {
    id: string;
    customerId: string;
    label: string | null;
    street: string;
    suburb: string;
    state: string;
    postcode: string;
    siteContactPhone: string | null;
  }[];
};

export function JobCreateForm({
  customers,
  plumbers,
  defaultCustomerId,
  defaultPropertyId,
  enquiry,
}: {
  customers: JobFormCustomer[];
  plumbers: { id: string; name: string }[];
  defaultCustomerId?: string;
  defaultPropertyId?: string;
  enquiry?: boolean;
}) {
  const [customerId, setCustomerId] = useState(defaultCustomerId ?? "");
  const [propertyId, setPropertyId] = useState(defaultPropertyId ?? "");
  const [confirmed, setConfirmed] = useState(false);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const sites = useMemo(
    () => (selectedCustomer ? selectedCustomer.properties : customers.flatMap((c) => c.properties)),
    [customers, selectedCustomer],
  );
  const selectedSite = sites.find((p) => p.id === propertyId);

  function onCustomerChange(value: string) {
    setCustomerId(value);
    setConfirmed(false);
    const next = customers.find((c) => c.id === value);
    if (next?.properties.length === 1) {
      setPropertyId(next.properties[0].id);
      return;
    }
    if (!next?.properties.some((p) => p.id === propertyId)) {
      setPropertyId("");
    }
  }

  return (
    <form action={createJob} className="space-y-4">
      <Card>
        <div className="grid md:grid-cols-2 gap-4">
          <input type="hidden" name="status" value={enquiry ? "NEW_ENQUIRY" : "TRIAGE_REQUIRED"} />
          <Field label="Customer">
            <Select
              name="customerId"
              value={customerId}
              required
              onChange={(event) => onCustomerChange(event.target.value)}
            >
              <option value="">Select</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customerNumber} · {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Property">
            <Select
              name="propertyId"
              value={propertyId}
              required
              onChange={(event) => {
                setPropertyId(event.target.value);
                setConfirmed(false);
              }}
            >
              <option value="">Select site</option>
              {sites.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.street}, {p.suburb}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Title">
            <Input name="title" required placeholder="Split system install — living room" />
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
          <Field label="Priority">
            <Select name="priority" defaultValue="NORMAL">
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
              <option value="EMERGENCY">Emergency</option>
            </Select>
          </Field>
          <Field label="Assign technician">
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
        </div>
      </Card>

      {selectedSite ? (
        <MapPanel
          address={selectedSite}
          label={selectedSite.label || selectedSite.street}
          phone={selectedSite.siteContactPhone || selectedCustomer?.phone}
          confirmName="locationConfirmed"
          confirmed={confirmed}
          onConfirmChange={setConfirmed}
        />
      ) : (
        <Card className="bg-pale-2">
          <p className="font-heading text-xl uppercase tracking-wide text-navy">
            Pick the site first
          </p>
          <p className="text-sm text-[#3c4d5a] mt-1">
            Choose a customer and property and we will pin it on Google Maps and Apple Maps
            before the job is raised.
          </p>
        </Card>
      )}

      <Button type="submit" variant="orange" className="w-full sm:w-auto">
        {enquiry ? "Log enquiry" : "Save job"}
      </Button>
    </form>
  );
}
