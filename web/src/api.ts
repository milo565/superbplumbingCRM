export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  job_count?: number;
}

export type JobStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type JobPriority = "low" | "normal" | "high" | "emergency";

export interface Job {
  id: number;
  customer_id: number;
  customer_name?: string;
  title: string;
  description: string | null;
  status: JobStatus;
  priority: JobPriority;
  scheduled_for: string | null;
  price_cents: number;
  created_at: string;
}

export interface Stats {
  customers: number;
  jobs: number;
  jobs_by_status: Partial<Record<JobStatus, number>>;
  completed_revenue_cents: number;
  pipeline_cents: number;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  getStats: () => request<Stats>("/api/stats"),
  getCustomers: () => request<Customer[]>("/api/customers"),
  createCustomer: (data: Partial<Customer>) =>
    request<Customer>("/api/customers", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteCustomer: (id: number) =>
    request<void>(`/api/customers/${id}`, { method: "DELETE" }),
  getJobs: () => request<Job[]>("/api/jobs"),
  createJob: (data: Partial<Job>) =>
    request<Job>("/api/jobs", { method: "POST", body: JSON.stringify(data) }),
  updateJob: (id: number, data: Partial<Job>) =>
    request<Job>(`/api/jobs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteJob: (id: number) =>
    request<void>(`/api/jobs/${id}`, { method: "DELETE" }),
};
