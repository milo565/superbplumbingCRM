import { SUGGESTED_FOLLOW_UP_MONTHS } from "@/lib/constants";

export const XAI_CHAT_URL = "https://api.x.ai/v1/chat/completions";
export const DEFAULT_XAI_MODEL = "grok-4";
export const ASSISTANT_NAME = "SuperbBOT";

export const GROK_SYSTEM_PROMPT = `You are SuperbBOT, the in-app assistant for Kaizen Coastal Air Conditioning (also Kaizen Coastal Airconditioning) — a Gold Coast and Northern NSW air conditioning trade based in Tugun QLD. Hipages: https://hipages.com.au/connect/kaizencoastalairconditioning. You are powered by Grok (xAI). Staff call you SuperbBOT, not Grok.

Tone: professional, local, efficient, trustworthy. Tagline: "The perfect temperature all year round." Australian English. Dates DD/MM/YYYY. Money AUD. GST is 10%. Timezone Australia/Brisbane.

You help office staff and field technicians with jobs, customers, quotes, follow-ups, maintenance and the dashboard. Work is residential and commercial air conditioning: split, ducted and cassette supply/install, repair, filter clean/service, refrigerant reclaim notes, warranty and commercial maintenance. Keep answers short enough to read on a phone.

Hard rules:
- Do not invent prices, certificate numbers, ARC/licence details, refrigerant charges, or work that is not in the record context.
- You cannot send SMS, email or change CRM records. Draft copy only. Staff must review and approve anything that leaves the office.
- If marketingOptOut is true, or marketingConsent is false, do not draft marketing SMS/email. Say so clearly. Operational job updates may still be drafted, but flag consent.
- Never ask for or reveal API keys, passwords or secrets.
- When suggesting a job status, only use Kaizen Coastal CRM statuses supplied in the context (or the official workflow list).
- Quote and invoice figures already on the record may be restated; do not invent new ones. Mention GST inclusive vs exclusive when talking money.
- If context is missing, ask one tight question instead of guessing.`;

export type GrokRecordType =
  | "dashboard"
  | "job"
  | "customer"
  | "property"
  | "quote"
  | "follow-up"
  | "follow-ups"
  | "invoice"
  | "maintenance"
  | "general";

export type GrokRef = {
  type: GrokRecordType;
  id?: string;
};

export type GrokChip = {
  id: string;
  label: string;
  prompt: string;
};

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export function grokModelFromEnv(value?: string | null) {
  return value?.trim() || DEFAULT_XAI_MODEL;
}

export function parseGrokPath(pathname: string): GrokRef {
  const parts = pathname.split("/").filter(Boolean);
  const root = parts[0];
  const id = parts[1];
  const isNew = !id || id === "new";

  if (!root || root === "dashboard") return { type: "dashboard" };
  if (root === "follow-ups") {
    return id && id !== "new" ? { type: "follow-up", id } : { type: "follow-ups" };
  }

  const detail: Record<string, GrokRecordType> = {
    jobs: "job",
    customers: "customer",
    properties: "property",
    quotes: "quote",
    invoices: "invoice",
    maintenance: "maintenance",
  };

  if (root && detail[root] && !isNew) {
    return { type: detail[root], id };
  }

  return { type: "general" };
}

export function grokContextLabel(ref: GrokRef) {
  switch (ref.type) {
    case "job":
      return "This job";
    case "customer":
      return "This customer";
    case "property":
      return "This property";
    case "quote":
      return "This quote";
    case "follow-up":
      return "This follow-up";
    case "follow-ups":
      return "Follow-ups";
    case "invoice":
      return "This invoice";
    case "maintenance":
      return "This maintenance plan";
    case "dashboard":
      return "Dashboard";
    default:
      return "Kaizen Coastal";
  }
}

export function grokChips(type: GrokRecordType): GrokChip[] {
  const sms =
    "Draft a short follow-up SMS in Australian English. Respect consent and opt-out. Staff will approve before sending. Do not invent prices.";
  const email =
    "Draft a short follow-up email (subject + body). Respect consent and opt-out. Staff will approve before sending. Do not invent prices.";
  const call =
    "Summarise this record and previous work so I can call. Under 10 short lines. Do not invent facts.";
  const maintenance = `Suggest a maintenance follow-up interval from the service type. Use Kaizen Coastal defaults if they fit (split/ducted/cassette/warranty ${SUGGESTED_FOLLOW_UP_MONTHS.SPLIT_INSTALL} months, repair/filter service ${SUGGESTED_FOLLOW_UP_MONTHS.SERVICE}, commercial maintenance ${SUGGESTED_FOLLOW_UP_MONTHS.COMMERCIAL_MAINTENANCE}).`;

  switch (type) {
    case "job":
      return [
        { id: "sms", label: "Draft SMS", prompt: sms },
        { id: "call", label: "Call brief", prompt: call },
        {
          id: "status",
          label: "Next status",
          prompt:
            "Suggest the next sensible job status and why. Only use the allowed next statuses in the context.",
        },
        {
          id: "notes",
          label: "Work notes",
          prompt:
            "Draft clear work-description / quote line notes from this job. Do not invent prices or certificates.",
        },
        { id: "maint", label: "Maintenance", prompt: maintenance },
      ];
    case "customer":
      return [
        { id: "sms", label: "Draft SMS", prompt: sms },
        { id: "email", label: "Draft email", prompt: email },
        { id: "call", label: "Call brief", prompt: call },
        { id: "maint", label: "Maintenance", prompt: maintenance },
      ];
    case "property":
      return [
        {
          id: "van",
          label: "Van brief",
          prompt:
            "Summarise site access, hazards, outdoor unit, isolator and recommendations for the technician on the way. Short bullets.",
        },
        { id: "maint", label: "Maintenance", prompt: maintenance },
        { id: "call", label: "Call brief", prompt: call },
      ];
    case "quote":
      return [
        {
          id: "notes",
          label: "Line notes",
          prompt:
            "Draft quote line notes / a work description from this quote. Restate existing totals only. Do not invent prices.",
        },
        { id: "sms", label: "Draft SMS", prompt: sms },
        { id: "email", label: "Draft email", prompt: email },
      ];
    case "follow-up":
    case "follow-ups":
      return [
        { id: "sms", label: "Draft SMS", prompt: sms },
        { id: "email", label: "Draft email", prompt: email },
        { id: "call", label: "Call brief", prompt: call },
      ];
    case "invoice":
      return [
        {
          id: "pay",
          label: "Payment note",
          prompt:
            "Draft a polite payment-reminder SMS or email using the invoice figures already on the record. GST-aware. Staff must approve before sending.",
        },
        { id: "call", label: "Call brief", prompt: call },
      ];
    case "maintenance":
      return [
        { id: "sms", label: "Draft SMS", prompt: sms },
        { id: "maint", label: "Interval", prompt: maintenance },
      ];
    case "dashboard":
      return [
        {
          id: "cards",
          label: "Explain cards",
          prompt:
            "Explain the Kaizen Coastal dashboard cards in plain English and what the office should do first today.",
        },
        {
          id: "triage",
          label: "Triage today",
          prompt:
            "Give a short triage order: emergencies, unassigned jobs, quotes waiting, follow-ups, invoicing. Why that order.",
        },
      ];
    default:
      return [
        {
          id: "help",
          label: "What can you do?",
          prompt:
            "What can you help Kaizen Coastal staff with on this screen? Keep it practical.",
        },
        {
          id: "cards",
          label: "Explain dashboard",
          prompt: "Explain the dashboard cards in plain English for a new office admin.",
        },
      ];
  }
}

export function sanitizeTurns(input: unknown): ChatTurn[] {
  if (!Array.isArray(input)) return [];
  const turns: ChatTurn[] = [];
  for (const row of input) {
    if (!row || typeof row !== "object") continue;
    const role = (row as { role?: string }).role;
    const content = (row as { content?: string }).content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;
    const text = content.trim().slice(0, 4000);
    if (!text) continue;
    turns.push({ role, content: text });
    if (turns.length >= 16) break;
  }
  return turns;
}

export function parseGrokRef(input: unknown): GrokRef {
  if (!input || typeof input !== "object") return { type: "general" };
  const type = (input as { type?: string }).type;
  const id = (input as { id?: string }).id;
  const allowed: GrokRecordType[] = [
    "dashboard",
    "job",
    "customer",
    "property",
    "quote",
    "follow-up",
    "follow-ups",
    "invoice",
    "maintenance",
    "general",
  ];
  if (!type || !allowed.includes(type as GrokRecordType)) return { type: "general" };
  return {
    type: type as GrokRecordType,
    id: typeof id === "string" && id.length < 80 ? id : undefined,
  };
}
