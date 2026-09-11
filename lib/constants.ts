import type {
  CustomerStatus,
  CustomerType,
  FollowUpChannel,
  FollowUpStatus,
  InvoiceStatus,
  JobPriority,
  JobStatus,
  MaintenancePlanType,
  QuoteStatus,
  Role,
  ServiceCategory,
} from "@prisma/client";

export const COMPANY = {
  name: "SuperbFlow Plumbing",
  shortName: "SuperbFlow",
  tagline: "No drama. Just flow.",
  website: "https://superbflowplumbing.com.au",
  email: "Superbflowplumbing@gmail.com",
  abn: "12 345 678 901",
  phoneAnthony: "0412 121 772",
  phoneNathan: "0410 926 968",
  serviceAreas:
    "Melbourne west, north, east and inner suburbs — 150 km from Taylors Lakes and Wheelers Hill",
};

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Business owner",
  OFFICE_ADMIN: "Office administrator",
  SUPERVISOR: "Plumbing supervisor",
  PLUMBER: "Plumber / technician",
  SALES: "Sales & follow-up",
};

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  RESIDENTIAL: "Residential",
  COMMERCIAL: "Commercial",
  INDUSTRIAL: "Industrial",
};

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  PROSPECT: "Prospect",
  ARCHIVED: "Archived",
};

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  GENERAL_PLUMBING: "General plumbing",
  GAS_FITTING: "Gas fitting",
  DRAINAGE: "Drainage",
  ROOFING: "Roofing",
  MAINTENANCE: "Maintenance",
};

export const PRIORITY_LABELS: Record<JobPriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
  EMERGENCY: "Emergency",
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  NEW_ENQUIRY: "New enquiry",
  TRIAGE_REQUIRED: "Triage required",
  SITE_VISIT_REQUIRED: "Site visit required",
  QUOTE_IN_PROGRESS: "Quote in progress",
  QUOTE_SENT: "Quote sent",
  CUSTOMER_FOLLOW_UP: "Customer follow-up",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled",
  PLUMBER_ASSIGNED: "Plumber assigned",
  ON_THE_WAY: "On the way",
  IN_PROGRESS: "In progress",
  AWAITING_PARTS: "Awaiting parts",
  FOLLOW_UP_VISIT_REQUIRED: "Follow-up visit required",
  COMPLETED: "Completed",
  CUSTOMER_SIGN_OFF: "Customer sign-off",
  READY_TO_INVOICE: "Ready to invoice",
  INVOICED: "Invoiced",
  PAID: "Paid",
  MAINTENANCE_FOLLOW_UP_SCHEDULED: "Maintenance follow-up scheduled",
};

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  FOLLOW_UP: "Follow-up",
  APPROVED: "Approved",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  CONVERTED: "Converted",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PARTIAL: "Partial",
  PAID: "Paid",
  OVERDUE: "Overdue",
  VOID: "Void",
};

export const FOLLOW_UP_STATUS_LABELS: Record<FollowUpStatus, string> = {
  PENDING: "Pending",
  AWAITING_APPROVAL: "Awaiting approval",
  APPROVED: "Approved",
  SENT: "Sent",
  CALLED: "Called",
  SNOOZED: "Snoozed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  BLOCKED_OPT_OUT: "Blocked — opted out",
};

export const CHANNEL_LABELS: Record<FollowUpChannel, string> = {
  INTERNAL: "Internal",
  SMS: "SMS",
  EMAIL: "Email",
  CALL: "Call",
};

export const PLAN_TYPE_LABELS: Record<MaintenancePlanType, string> = {
  SIX_MONTHLY: "Six-monthly",
  ANNUAL: "Annual",
  COMMERCIAL: "Commercial",
  PM_PORTFOLIO: "PM portfolio",
  CUSTOM: "Custom",
};

export const SUGGESTED_FOLLOW_UP_MONTHS: Record<ServiceCategory, number> = {
  GENERAL_PLUMBING: 12,
  GAS_FITTING: 12,
  DRAINAGE: 9,
  ROOFING: 6,
  MAINTENANCE: 6,
};

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/customers", label: "Customers", icon: "Users" },
  { href: "/properties", label: "Properties and sites", icon: "Building2" },
  { href: "/enquiries", label: "New enquiries", icon: "Inbox" },
  { href: "/quotes", label: "Quotes", icon: "FileText" },
  { href: "/jobs", label: "Jobs", icon: "Wrench" },
  { href: "/calendar", label: "Calendar and scheduling", icon: "CalendarDays" },
  { href: "/previous-work", label: "Previous work", icon: "History" },
  { href: "/follow-ups", label: "Follow-ups", icon: "PhoneForwarded" },
  { href: "/maintenance", label: "Maintenance plans", icon: "Repeat" },
  { href: "/invoices", label: "Invoices and payments", icon: "Receipt" },
  { href: "/reports", label: "Reports", icon: "BarChart3" },
  { href: "/team", label: "Team", icon: "HardHat" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const;

export const TONE = {
  noDrama: "No drama. Just flow.",
  sorted: "Let's get it sorted.",
  holdsUp: "Work that holds up.",
  nextStep: "Next sensible step.",
};
