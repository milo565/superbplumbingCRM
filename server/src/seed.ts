import { db, initSchema } from "./db.js";

/**
 * Seed the database with representative sample data.
 * Idempotent: only seeds when the customers table is empty, unless
 * CRM_FORCE_SEED=1 is set (which wipes and re-seeds).
 */
export function seed(): void {
  initSchema();

  const force = process.env.CRM_FORCE_SEED === "1";
  const count = db.prepare("SELECT COUNT(*) AS n FROM customers").get() as {
    n: number;
  };

  if (count.n > 0 && !force) {
    return;
  }

  if (force) {
    db.exec("DELETE FROM jobs; DELETE FROM customers;");
  }

  const insertCustomer = db.prepare(
    `INSERT INTO customers (name, email, phone, address, notes)
     VALUES (@name, @email, @phone, @address, @notes)`,
  );
  const insertJob = db.prepare(
    `INSERT INTO jobs (customer_id, title, description, status, priority, scheduled_for, price_cents)
     VALUES (@customer_id, @title, @description, @status, @priority, @scheduled_for, @price_cents)`,
  );

  const customers = [
    {
      name: "Acme Restaurant Group",
      email: "facilities@acmerg.com",
      phone: "555-0142",
      address: "18 Harbor St, Springfield",
      notes: "Commercial account, net-30 billing.",
    },
    {
      name: "Dana Whitfield",
      email: "dana.whitfield@example.com",
      phone: "555-0177",
      address: "441 Maple Ave, Springfield",
      notes: "Prefers morning appointments.",
    },
    {
      name: "Riverside Apartments",
      email: "manager@riversideapts.com",
      phone: "555-0193",
      address: "2200 River Rd, Springfield",
      notes: "12-unit building, on-site super is Marco.",
    },
  ];

  const seededJobs: Record<string, Array<Record<string, unknown>>> = {
    "Acme Restaurant Group": [
      {
        title: "Grease trap backup",
        description: "Kitchen grease trap overflowing during dinner service.",
        status: "in_progress",
        priority: "high",
        scheduled_for: "2026-09-12 09:00",
        price_cents: 48000,
      },
    ],
    "Dana Whitfield": [
      {
        title: "Water heater replacement",
        description: "Replace 15-year-old 40gal tank with new unit.",
        status: "scheduled",
        priority: "normal",
        scheduled_for: "2026-09-14 08:30",
        price_cents: 135000,
      },
      {
        title: "Leaky kitchen faucet",
        description: "Dripping from base of faucet; likely worn cartridge.",
        status: "completed",
        priority: "low",
        scheduled_for: "2026-09-05 10:00",
        price_cents: 22000,
      },
    ],
    "Riverside Apartments": [
      {
        title: "Burst pipe - Unit 4B",
        description: "Supply line burst under kitchen sink, water shut off.",
        status: "scheduled",
        priority: "emergency",
        scheduled_for: "2026-09-11 16:00",
        price_cents: 76000,
      },
    ],
  };

  const tx = db.transaction(() => {
    for (const c of customers) {
      const info = insertCustomer.run(c);
      const customerId = Number(info.lastInsertRowid);
      for (const j of seededJobs[c.name] ?? []) {
        insertJob.run({ customer_id: customerId, ...j });
      }
    }
  });

  tx();
}

// Allow running as a standalone script: `npm run seed`
const invokedPath = process.argv[1] ?? "";
if (invokedPath.endsWith("seed.ts") || invokedPath.endsWith("seed.js")) {
  seed();
  const c = db.prepare("SELECT COUNT(*) AS n FROM customers").get() as { n: number };
  const j = db.prepare("SELECT COUNT(*) AS n FROM jobs").get() as { n: number };
  console.log(`Seed complete: ${c.n} customers, ${j.n} jobs.`);
}
