import cors from "cors";
import express from "express";
import {
  JOB_PRIORITIES,
  JOB_STATUSES,
  type JobPriority,
  type JobStatus,
  db,
  initSchema,
} from "./db.js";
import { seed } from "./seed.js";

initSchema();
seed();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT ?? 4000);

function isJobStatus(v: unknown): v is JobStatus {
  return typeof v === "string" && (JOB_STATUSES as readonly string[]).includes(v);
}
function isJobPriority(v: unknown): v is JobPriority {
  return typeof v === "string" && (JOB_PRIORITIES as readonly string[]).includes(v);
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ---- Customers ----
app.get("/api/customers", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM jobs j WHERE j.customer_id = c.id) AS job_count
       FROM customers c
       ORDER BY c.created_at DESC, c.id DESC`,
    )
    .all();
  res.json(rows);
});

app.get("/api/customers/:id", (req, res) => {
  const customer = db
    .prepare("SELECT * FROM customers WHERE id = ?")
    .get(req.params.id);
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  const jobs = db
    .prepare("SELECT * FROM jobs WHERE customer_id = ? ORDER BY created_at DESC, id DESC")
    .all(req.params.id);
  res.json({ ...customer, jobs });
});

app.post("/api/customers", (req, res) => {
  const { name, email, phone, address, notes } = req.body ?? {};
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "name is required" });
  }
  const info = db
    .prepare(
      `INSERT INTO customers (name, email, phone, address, notes)
       VALUES (@name, @email, @phone, @address, @notes)`,
    )
    .run({
      name: name.trim(),
      email: email ?? null,
      phone: phone ?? null,
      address: address ?? null,
      notes: notes ?? null,
    });
  const created = db
    .prepare("SELECT * FROM customers WHERE id = ?")
    .get(info.lastInsertRowid);
  res.status(201).json(created);
});

app.delete("/api/customers/:id", (req, res) => {
  const info = db.prepare("DELETE FROM customers WHERE id = ?").run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "Customer not found" });
  res.status(204).end();
});

// ---- Jobs ----
app.get("/api/jobs", (req, res) => {
  const { status, customer_id } = req.query;
  const clauses: string[] = [];
  const params: Record<string, unknown> = {};
  if (typeof status === "string") {
    clauses.push("j.status = @status");
    params.status = status;
  }
  if (typeof customer_id === "string") {
    clauses.push("j.customer_id = @customer_id");
    params.customer_id = customer_id;
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT j.*, c.name AS customer_name
       FROM jobs j
       JOIN customers c ON c.id = j.customer_id
       ${where}
       ORDER BY j.created_at DESC, j.id DESC`,
    )
    .all(params);
  res.json(rows);
});

app.post("/api/jobs", (req, res) => {
  const {
    customer_id,
    title,
    description,
    status,
    priority,
    scheduled_for,
    price_cents,
  } = req.body ?? {};

  if (!customer_id) return res.status(400).json({ error: "customer_id is required" });
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "title is required" });
  }
  const customer = db
    .prepare("SELECT id FROM customers WHERE id = ?")
    .get(customer_id);
  if (!customer) return res.status(400).json({ error: "Unknown customer_id" });

  if (status !== undefined && !isJobStatus(status)) {
    return res.status(400).json({ error: `status must be one of ${JOB_STATUSES.join(", ")}` });
  }
  if (priority !== undefined && !isJobPriority(priority)) {
    return res.status(400).json({ error: `priority must be one of ${JOB_PRIORITIES.join(", ")}` });
  }

  const info = db
    .prepare(
      `INSERT INTO jobs (customer_id, title, description, status, priority, scheduled_for, price_cents)
       VALUES (@customer_id, @title, @description, @status, @priority, @scheduled_for, @price_cents)`,
    )
    .run({
      customer_id,
      title: title.trim(),
      description: description ?? null,
      status: status ?? "scheduled",
      priority: priority ?? "normal",
      scheduled_for: scheduled_for ?? null,
      price_cents: Number.isFinite(price_cents) ? Math.round(price_cents) : 0,
    });
  const created = db.prepare("SELECT * FROM jobs WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(created);
});

app.patch("/api/jobs/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!existing) return res.status(404).json({ error: "Job not found" });

  const { title, description, status, priority, scheduled_for, price_cents } =
    req.body ?? {};

  if (status !== undefined && !isJobStatus(status)) {
    return res.status(400).json({ error: `status must be one of ${JOB_STATUSES.join(", ")}` });
  }
  if (priority !== undefined && !isJobPriority(priority)) {
    return res.status(400).json({ error: `priority must be one of ${JOB_PRIORITIES.join(", ")}` });
  }

  const merged = {
    title: title ?? existing.title,
    description: description ?? existing.description,
    status: status ?? existing.status,
    priority: priority ?? existing.priority,
    scheduled_for: scheduled_for ?? existing.scheduled_for,
    price_cents:
      price_cents !== undefined && Number.isFinite(price_cents)
        ? Math.round(price_cents)
        : existing.price_cents,
    id: req.params.id,
  };

  db.prepare(
    `UPDATE jobs SET title=@title, description=@description, status=@status,
      priority=@priority, scheduled_for=@scheduled_for, price_cents=@price_cents
     WHERE id=@id`,
  ).run(merged);

  const updated = db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id);
  res.json(updated);
});

app.delete("/api/jobs/:id", (req, res) => {
  const info = db.prepare("DELETE FROM jobs WHERE id = ?").run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "Job not found" });
  res.status(204).end();
});

// ---- Dashboard stats ----
app.get("/api/stats", (_req, res) => {
  const customers = db.prepare("SELECT COUNT(*) AS n FROM customers").get() as { n: number };
  const byStatus = db
    .prepare("SELECT status, COUNT(*) AS n FROM jobs GROUP BY status")
    .all() as Array<{ status: string; n: number }>;
  const revenue = db
    .prepare("SELECT COALESCE(SUM(price_cents),0) AS cents FROM jobs WHERE status = 'completed'")
    .get() as { cents: number };
  const pipeline = db
    .prepare(
      "SELECT COALESCE(SUM(price_cents),0) AS cents FROM jobs WHERE status IN ('scheduled','in_progress')",
    )
    .get() as { cents: number };

  const statusMap: Record<string, number> = {};
  for (const row of byStatus) statusMap[row.status] = row.n;

  res.json({
    customers: customers.n,
    jobs: byStatus.reduce((sum, r) => sum + r.n, 0),
    jobs_by_status: statusMap,
    completed_revenue_cents: revenue.cents,
    pipeline_cents: pipeline.cents,
  });
});

app.listen(PORT, () => {
  console.log(`Superb Plumbing CRM API listening on http://localhost:${PORT}`);
});
