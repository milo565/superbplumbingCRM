"use client";

import { useState } from "react";
import { MapPanel } from "@/components/map-panel";
import { Field, Input } from "@/components/ui";

export function AddressMapPreview({
  defaults,
}: {
  defaults?: {
    street?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
    label?: string;
  };
}) {
  const [street, setStreet] = useState(defaults?.street ?? "");
  const [suburb, setSuburb] = useState(defaults?.suburb ?? "");
  const [state, setState] = useState(defaults?.state ?? "QLD");
  const [postcode, setPostcode] = useState(defaults?.postcode ?? "");
  const ready = street.trim().length > 3 && suburb.trim().length > 1 && postcode.trim().length >= 3;

  return (
    <div className="space-y-4 md:col-span-2">
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Street">
          <Input name="street" required value={street} onChange={(e) => setStreet(e.target.value)} />
        </Field>
        <Field label="Suburb">
          <Input name="suburb" required value={suburb} onChange={(e) => setSuburb(e.target.value)} />
        </Field>
        <Field label="State">
          <Input name="state" value={state} onChange={(e) => setState(e.target.value)} />
        </Field>
        <Field label="Postcode">
          <Input name="postcode" required value={postcode} onChange={(e) => setPostcode(e.target.value)} />
        </Field>
      </div>
      {ready ? (
        <MapPanel
          address={{ street, suburb, state, postcode }}
          label={defaults?.label || suburb}
        />
      ) : (
        <p className="text-sm text-[#4b5c69]">
          Type the street, suburb and postcode and the map will pin the site.
        </p>
      )}
    </div>
  );
}
