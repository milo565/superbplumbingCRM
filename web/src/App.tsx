import { useCallback, useEffect, useMemo, useState } from "react";
import {
  api,
  type Customer,
  type Job,
  type JobPriority,
  type JobStatus,
  type Stats,
} from "./api";

const STATUSES: JobStatus[] = ["scheduled", "in_progress", "completed", "cancelled"];
const PRIORITIES: JobPriority[] = ["low", "normal", "high", "emergency"];

function money(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function statusLabel(s: JobStatus): string {
  return s.replace("_", " ");
}

export function App() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [s, c, j] = await Promise.all([
        api.getStats(),
        api.getCustomers(),
        api.getJobs(),
      ]);
      setStats(s);
      setCustomers(c);
      setJobs(j);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) {
    return (
      <div className="app">
        <p className="muted">Loading Superb Plumbing CRM…</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">🔧</span>
          <div>
            <h1>Superb Plumbing CRM</h1>
            <p className="muted">Customers &amp; job dispatch</p>
          </div>
        </div>
        <button className="ghost" onClick={() => void refresh()}>
          Refresh
        </button>
      </header>

      {error && <div className="banner error">{error}</div>}

      {stats && <StatsRow stats={stats} />}

      <div className="grid">
        <section className="panel">
          <h2>Jobs</h2>
          <JobForm customers={customers} onCreated={refresh} onError={setError} />
          <JobList jobs={jobs} onChanged={refresh} onError={setError} />
        </section>

        <section className="panel">
          <h2>Customers</h2>
          <CustomerForm onCreated={refresh} onError={setError} />
          <CustomerList customers={customers} onChanged={refresh} onError={setError} />
        </section>
      </div>
    </div>
  );
}

function StatsRow({ stats }: { stats: Stats }) {
  const cards = [
    { label: "Customers", value: String(stats.customers) },
    { label: "Active jobs", value: String(
        (stats.jobs_by_status.scheduled ?? 0) + (stats.jobs_by_status.in_progress ?? 0),
      ) },
    { label: "Pipeline value", value: money(stats.pipeline_cents) },
    { label: "Completed revenue", value: money(stats.completed_revenue_cents) },
  ];
  return (
    <div className="stats">
      {cards.map((c) => (
        <div className="stat-card" key={c.label}>
          <div className="stat-value">{c.value}</div>
          <div className="stat-label">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

interface FormProps {
  onCreated: () => Promise<void> | void;
  onError: (msg: string) => void;
}

function CustomerForm({ onCreated, onError }: FormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.createCustomer({ name, email, phone, address });
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      await onCreated();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to add customer");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <input
        aria-label="Customer name"
        placeholder="Customer name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        aria-label="Customer email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        aria-label="Customer phone"
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        aria-label="Customer address"
        placeholder="Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <button type="submit" disabled={busy || !name.trim()}>
        {busy ? "Adding…" : "Add customer"}
      </button>
    </form>
  );
}

function JobForm({
  customers,
  onCreated,
  onError,
}: FormProps & { customers: Customer[] }) {
  const [customerId, setCustomerId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<JobPriority>("normal");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);

  const defaultCustomer = useMemo(
    () => (customers.length ? String(customers[0].id) : ""),
    [customers],
  );
  const effectiveCustomer = customerId || defaultCustomer;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveCustomer || !title.trim()) return;
    setBusy(true);
    try {
      await api.createJob({
        customer_id: Number(effectiveCustomer),
        title,
        priority,
        price_cents: price ? Math.round(Number(price) * 100) : 0,
      });
      setTitle("");
      setPrice("");
      setPriority("normal");
      await onCreated();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to add job");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <select
        aria-label="Job customer"
        value={effectiveCustomer}
        onChange={(e) => setCustomerId(e.target.value)}
      >
        {customers.length === 0 && <option value="">No customers yet</option>}
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        aria-label="Job title"
        placeholder="Job title * (e.g. Water heater install)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <select
        aria-label="Job priority"
        value={priority}
        onChange={(e) => setPriority(e.target.value as JobPriority)}
      >
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <input
        aria-label="Job price"
        placeholder="Price (USD)"
        inputMode="decimal"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <button type="submit" disabled={busy || !title.trim() || !effectiveCustomer}>
        {busy ? "Adding…" : "Add job"}
      </button>
    </form>
  );
}

function JobList({
  jobs,
  onChanged,
  onError,
}: {
  jobs: Job[];
  onChanged: () => Promise<void> | void;
  onError: (msg: string) => void;
}) {
  async function setStatus(job: Job, status: JobStatus) {
    try {
      await api.updateJob(job.id, { status });
      await onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to update job");
    }
  }
  async function remove(job: Job) {
    try {
      await api.deleteJob(job.id);
      await onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to delete job");
    }
  }

  if (jobs.length === 0) return <p className="muted">No jobs yet.</p>;

  return (
    <ul className="list">
      {jobs.map((job) => (
        <li className="list-item" key={job.id}>
          <div className="list-main">
            <div className="row">
              <span className={`pill priority-${job.priority}`}>{job.priority}</span>
              <strong>{job.title}</strong>
            </div>
            <div className="muted small">
              {job.customer_name} · {money(job.price_cents)}
              {job.scheduled_for ? ` · ${job.scheduled_for}` : ""}
            </div>
          </div>
          <div className="list-actions">
            <select
              aria-label={`Status for ${job.title}`}
              value={job.status}
              onChange={(e) => void setStatus(job, e.target.value as JobStatus)}
              className={`status status-${job.status}`}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
            <button className="danger" onClick={() => void remove(job)} aria-label={`Delete ${job.title}`}>
              ✕
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CustomerList({
  customers,
  onChanged,
  onError,
}: {
  customers: Customer[];
  onChanged: () => Promise<void> | void;
  onError: (msg: string) => void;
}) {
  async function remove(c: Customer) {
    try {
      await api.deleteCustomer(c.id);
      await onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to delete customer");
    }
  }

  if (customers.length === 0) return <p className="muted">No customers yet.</p>;

  return (
    <ul className="list">
      {customers.map((c) => (
        <li className="list-item" key={c.id}>
          <div className="list-main">
            <strong>{c.name}</strong>
            <div className="muted small">
              {[c.phone, c.email, c.address].filter(Boolean).join(" · ") || "No contact info"}
            </div>
            <div className="muted small">{c.job_count ?? 0} job(s)</div>
          </div>
          <div className="list-actions">
            <button className="danger" onClick={() => void remove(c)} aria-label={`Delete ${c.name}`}>
              ✕
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
