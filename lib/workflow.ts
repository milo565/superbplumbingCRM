import type { JobStatus } from "@prisma/client";

export const WORKFLOW_ORDER: JobStatus[] = [
  "NEW_ENQUIRY",
  "TRIAGE_REQUIRED",
  "SITE_VISIT_REQUIRED",
  "QUOTE_IN_PROGRESS",
  "QUOTE_SENT",
  "CUSTOMER_FOLLOW_UP",
  "APPROVED",
  "SCHEDULED",
  "PLUMBER_ASSIGNED",
  "ON_THE_WAY",
  "IN_PROGRESS",
  "AWAITING_PARTS",
  "FOLLOW_UP_VISIT_REQUIRED",
  "COMPLETED",
  "CUSTOMER_SIGN_OFF",
  "READY_TO_INVOICE",
  "INVOICED",
  "PAID",
  "MAINTENANCE_FOLLOW_UP_SCHEDULED",
];

const NEXT: Partial<Record<JobStatus, JobStatus[]>> = {
  NEW_ENQUIRY: ["TRIAGE_REQUIRED", "SITE_VISIT_REQUIRED", "APPROVED", "SCHEDULED"],
  TRIAGE_REQUIRED: ["SITE_VISIT_REQUIRED", "QUOTE_IN_PROGRESS", "APPROVED"],
  SITE_VISIT_REQUIRED: ["QUOTE_IN_PROGRESS", "APPROVED", "SCHEDULED"],
  QUOTE_IN_PROGRESS: ["QUOTE_SENT"],
  QUOTE_SENT: ["CUSTOMER_FOLLOW_UP", "APPROVED"],
  CUSTOMER_FOLLOW_UP: ["APPROVED", "QUOTE_SENT"],
  APPROVED: ["SCHEDULED"],
  SCHEDULED: ["PLUMBER_ASSIGNED", "ON_THE_WAY"],
  PLUMBER_ASSIGNED: ["ON_THE_WAY", "IN_PROGRESS"],
  ON_THE_WAY: ["IN_PROGRESS"],
  IN_PROGRESS: ["AWAITING_PARTS", "FOLLOW_UP_VISIT_REQUIRED", "COMPLETED"],
  AWAITING_PARTS: ["IN_PROGRESS", "COMPLETED"],
  FOLLOW_UP_VISIT_REQUIRED: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"],
  COMPLETED: ["CUSTOMER_SIGN_OFF", "READY_TO_INVOICE"],
  CUSTOMER_SIGN_OFF: ["READY_TO_INVOICE"],
  READY_TO_INVOICE: ["INVOICED"],
  INVOICED: ["PAID"],
  PAID: ["MAINTENANCE_FOLLOW_UP_SCHEDULED"],
  MAINTENANCE_FOLLOW_UP_SCHEDULED: [],
};

export function nextStatuses(status: JobStatus): JobStatus[] {
  return NEXT[status] ?? [];
}

export function isCompletedWork(status: JobStatus) {
  return (
    status === "COMPLETED" ||
    status === "CUSTOMER_SIGN_OFF" ||
    status === "READY_TO_INVOICE" ||
    status === "INVOICED" ||
    status === "PAID" ||
    status === "MAINTENANCE_FOLLOW_UP_SCHEDULED"
  );
}

export function isActiveFieldWork(status: JobStatus) {
  return (
    status === "SCHEDULED" ||
    status === "PLUMBER_ASSIGNED" ||
    status === "ON_THE_WAY" ||
    status === "IN_PROGRESS" ||
    status === "AWAITING_PARTS"
  );
}

export type StatusTone = "orange" | "blue" | "navy" | "pale" | "red" | "green";

export function statusTone(status: JobStatus, overdue = false): StatusTone {
  if (overdue) return "orange";
  if (
    status === "NEW_ENQUIRY" ||
    status === "TRIAGE_REQUIRED" ||
    status === "AWAITING_PARTS" ||
    status === "FOLLOW_UP_VISIT_REQUIRED"
  ) {
    return "orange";
  }
  if (
    status === "SCHEDULED" ||
    status === "PLUMBER_ASSIGNED" ||
    status === "ON_THE_WAY" ||
    status === "IN_PROGRESS"
  ) {
    return "blue";
  }
  if (
    status === "COMPLETED" ||
    status === "CUSTOMER_SIGN_OFF" ||
    status === "READY_TO_INVOICE"
  ) {
    return "navy";
  }
  if (
    status === "QUOTE_SENT" ||
    status === "CUSTOMER_FOLLOW_UP" ||
    status === "MAINTENANCE_FOLLOW_UP_SCHEDULED"
  ) {
    return "pale";
  }
  if (status === "INVOICED") return "red";
  if (status === "PAID") return "green";
  return "blue";
}

export const FOLLOW_UP_SEQUENCE = [
  {
    step: 1,
    daysBefore: 30,
    channel: "INTERNAL" as const,
    title: "Internal reminder — 30 days out",
  },
  {
    step: 2,
    daysBefore: 14,
    channel: "INTERNAL" as const,
    title: "Prepare message — 14 days out",
  },
  {
    step: 3,
    daysBefore: 0,
    channel: "SMS" as const,
    title: "Send SMS / email — due",
  },
  {
    step: 4,
    daysBefore: -7,
    channel: "CALL" as const,
    title: "Call task — 7 days after due",
  },
  {
    step: 5,
    daysBefore: -21,
    channel: "EMAIL" as const,
    title: "Final reminder — 21 days after due",
  },
];
