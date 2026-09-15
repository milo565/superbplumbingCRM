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
  name: "Kaizen Coastal Air Conditioning",
  shortName: "Kaizen Coastal",
  appName: "Kaizen Coastal CRM",
  homeScreenName: "Kaizen",
  tagline: "The perfect temperature all year round.",
  category: "Home service in Tugun, Queensland",
  website: "https://hipages.com.au/connect/kaizencoastalairconditioning",
  email: "kai@kaizencoastal.com.au",
  abn: "18 871 604 073",
  phonePrimary: "0428 316 868",
  phoneE164: "+61428316868",
  phoneTel: "tel:+61428316868",
  arcLicence: "L188734",
  nswLicence: "473916C",
  address: "The Parc, 2 Inland Dr, Tugun QLD 4224",
  base: "Tugun QLD 4224",
  hours: "Open · closes 21:00",
  hoursSchedule: "Mon–Sun 07:00–21:00",
  serviceAreas: "Gold Coast (QLD) and Northern NSW — Tugun base, Tweed, Banora Point and the coastal corridor",
};

export const DEMO_PASSWORD = "KaizenCoastal1!";

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Business owner",
  OFFICE_ADMIN: "Office administrator",
  SUPERVISOR: "Field supervisor",
  PLUMBER: "Technician",
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
  SPLIT_INSTALL: "Split system install",
  DUCTED_INSTALL: "Ducted install",
  CASSETTE_INSTALL: "Cassette install",
  REPAIR: "Repair",
  SERVICE: "Filter clean / service",
  WARRANTY: "Warranty service",
  COMMERCIAL_MAINTENANCE: "Commercial AC maintenance",
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
  PLUMBER_ASSIGNED: "Technician assigned",
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
  SPLIT_INSTALL: 12,
  DUCTED_INSTALL: 12,
  CASSETTE_INSTALL: 12,
  REPAIR: 6,
  SERVICE: 6,
  WARRANTY: 12,
  COMMERCIAL_MAINTENANCE: 3,
};

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/customers", label: "Customers", icon: "Users" },
  { href: "/properties", label: "Properties and sites", icon: "Building2" },
  { href: "/enquiries", label: "New enquiries", icon: "Inbox" },
  { href: "/quotes", label: "Quotes", icon: "FileText" },
  { href: "/jobs", label: "Jobs", icon: "Wind" },
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
  tagline: "The perfect temperature all year round.",
  sorted: "Let's get the temperature right.",
  holdsUp: "Professional, local and efficient.",
  nextStep: "Book the next service while you're here.",
};
