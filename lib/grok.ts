import type { Role } from "@prisma/client";
import {
  CATEGORY_LABELS,
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_TYPE_LABELS,
  FOLLOW_UP_STATUS_LABELS,
  INVOICE_STATUS_LABELS,
  JOB_STATUS_LABELS,
  PLAN_TYPE_LABELS,
  PRIORITY_LABELS,
  QUOTE_STATUS_LABELS,
  SUGGESTED_FOLLOW_UP_MONTHS,
} from "@/lib/constants";
import { formatAddress, formatDate, formatMoney } from "@/lib/format";
import { XAI_CHAT_URL, grokModelFromEnv, type GrokRef } from "@/lib/grok-shared";
import { prisma } from "@/lib/prisma";
import { scopedToAssigned } from "@/lib/rbac";
import { nextStatuses } from "@/lib/workflow";

export {
  DEFAULT_XAI_MODEL,
  GROK_SYSTEM_PROMPT,
  XAI_CHAT_URL,
  grokChips,
  grokContextLabel,
  grokModelFromEnv,
  parseGrokPath,
  parseGrokRef,
  sanitizeTurns,
} from "@/lib/grok-shared";
export type { ChatTurn, GrokChip, GrokRecordType, GrokRef } from "@/lib/grok-shared";

export function isGrokConfigured() {
  return Boolean(process.env.XAI_API_KEY?.trim());
}

export function grokModel() {
  return grokModelFromEnv(process.env.XAI_MODEL);
}

function clip(value?: string | null, max = 400) {
  if (!value) return undefined;
  const text = value.trim();
  if (!text) return undefined;
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

async function plumberCanSeeCustomer(userId: string, customerId: string) {
  const count = await prisma.job.count({
    where: { customerId, assignedToId: userId },
  });
  if (count > 0) return true;
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, accountManagerId: userId },
    select: { id: true },
  });
  return Boolean(customer);
}

export async function loadGrokContext(
  ref: GrokRef,
  user: { id: string; role: Role },
): Promise<{ ok: true; text: string } | { ok: false; status: number; error: string }> {
  const assignedOnly = scopedToAssigned(user.role);

  if (ref.type === "dashboard" || ref.type === "general") {
    return {
      ok: true,
      text: JSON.stringify(
        {
          page: ref.type,
          dashboardCards: [
            "Today's scheduled jobs",
            "Emergency jobs",
            "Awaiting assignment",
            "Quotes awaiting approval",
            "Approved, ready to schedule",
            "Jobs in progress",
            "Awaiting invoicing",
            "Outstanding invoices",
            "Follow-ups due today",
            "6 / 9 / 12-month follow-ups",
            "Recurring maintenance due",
            "Quote conversion / repeat customers",
          ],
          suggestedFollowUpMonths: SUGGESTED_FOLLOW_UP_MONTHS,
          staffRole: user.role,
        },
        null,
        2,
      ),
    };
  }

  if (ref.type === "follow-ups") {
    const followUps = await prisma.followUp.findMany({
      where: assignedOnly
        ? {
            OR: [
              { assignedToId: user.id },
              { job: { assignedToId: user.id } },
              { customer: { jobs: { some: { assignedToId: user.id } } } },
            ],
          }
        : { status: { in: ["PENDING", "AWAITING_APPROVAL", "APPROVED", "SNOOZED"] } },
      include: { customer: true, job: { select: { jobNumber: true, title: true, category: true } } },
      orderBy: { dueAt: "asc" },
      take: 8,
    });
    return {
      ok: true,
      text: JSON.stringify(
        {
          page: "follow-ups",
          items: followUps.map((item) => ({
            title: item.title,
            status: FOLLOW_UP_STATUS_LABELS[item.status],
            channel: item.channel,
            due: formatDate(item.dueAt),
            customer: item.customer.name,
            marketingConsent: item.customer.marketingConsent,
            marketingOptOut: item.customer.marketingOptOut,
            job: item.job ? `${item.job.jobNumber} ${item.job.title}` : undefined,
          })),
        },
        null,
        2,
      ),
    };
  }

  if (!ref.id) {
      return { ok: false, status: 400, error: "This page needs a record before SuperbBOT can use it." };
  }

  if (ref.type === "job") {
    const job = await prisma.job.findUnique({
      where: { id: ref.id },
      include: {
        customer: true,
        property: true,
        assignedTo: { select: { name: true } },
        lineItems: { orderBy: { sortOrder: "asc" }, take: 8 },
      },
    });
    if (!job) return { ok: false, status: 404, error: "Job not found." };
    if (assignedOnly && job.assignedToId !== user.id) {
      return { ok: false, status: 403, error: "You can only ask SuperbBOT about jobs assigned to you." };
    }
    return {
      ok: true,
      text: JSON.stringify(
        {
          jobNumber: job.jobNumber,
          title: job.title,
          status: JOB_STATUS_LABELS[job.status],
          allowedNextStatuses: nextStatuses(job.status).map((s) => JOB_STATUS_LABELS[s]),
          priority: PRIORITY_LABELS[job.priority],
          emergency: job.emergency,
          category: CATEGORY_LABELS[job.category],
          suggestedFollowUpMonths: SUGGESTED_FOLLOW_UP_MONTHS[job.category],
          description: clip(job.description, 600),
          recommendations: clip(job.recommendations),
          beforeNotes: clip(job.beforeNotes),
          afterNotes: clip(job.afterNotes),
          appointment: job.appointmentStart ? formatDate(job.appointmentStart) : undefined,
          assignedTo: job.assignedTo?.name,
          customer: {
            name: job.customer.name,
            contactName: job.customer.contactName,
            phone: job.customer.phone,
            preferredContact: job.customer.preferredContact,
            marketingConsent: job.customer.marketingConsent,
            marketingOptOut: job.customer.marketingOptOut,
          },
          property: formatAddress(job.property),
          access: clip(job.property.accessNotes),
          existingTotalIncGst: formatMoney(job.totalIncGst),
          lineItems: job.lineItems.map((line) => line.description),
        },
        null,
        2,
      ),
    };
  }

  if (ref.type === "customer") {
    const customer = await prisma.customer.findUnique({
      where: { id: ref.id },
      include: {
        properties: { take: 5 },
        jobs: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            jobNumber: true,
            title: true,
            status: true,
            category: true,
            assignedToId: true,
            recommendations: true,
            completedAt: true,
          },
        },
      },
    });
    if (!customer) return { ok: false, status: 404, error: "Customer not found." };
    if (assignedOnly && !(await plumberCanSeeCustomer(user.id, customer.id))) {
      return { ok: false, status: 403, error: "You can only ask SuperbBOT about customers on your jobs." };
    }
    const jobs = assignedOnly ? customer.jobs.filter((j) => j.assignedToId === user.id) : customer.jobs;
    return {
      ok: true,
      text: JSON.stringify(
        {
          customerNumber: customer.customerNumber,
          name: customer.name,
          contactName: customer.contactName,
          type: CUSTOMER_TYPE_LABELS[customer.type],
          status: CUSTOMER_STATUS_LABELS[customer.status],
          phone: customer.phone,
          preferredContact: customer.preferredContact,
          marketingConsent: customer.marketingConsent,
          marketingOptOut: customer.marketingOptOut,
          billing: formatAddress({
            street: customer.billingStreet,
            suburb: customer.billingSuburb,
            state: customer.billingState,
            postcode: customer.billingPostcode,
          }),
          notes: clip(customer.notes),
          sites: customer.properties.map((p) => formatAddress(p)),
          recentJobs: jobs.map((job) => ({
            jobNumber: job.jobNumber,
            title: job.title,
            status: JOB_STATUS_LABELS[job.status],
            category: CATEGORY_LABELS[job.category],
            completed: job.completedAt ? formatDate(job.completedAt) : undefined,
            recommendations: clip(job.recommendations, 200),
          })),
        },
        null,
        2,
      ),
    };
  }

  if (ref.type === "property") {
    const property = await prisma.property.findUnique({
      where: { id: ref.id },
      include: {
        customer: true,
        jobs: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { jobNumber: true, title: true, status: true, category: true, assignedToId: true },
        },
        maintenancePlans: { where: { active: true }, take: 4 },
      },
    });
    if (!property) return { ok: false, status: 404, error: "Property not found." };
    if (assignedOnly && !(await plumberCanSeeCustomer(user.id, property.customerId))) {
      return { ok: false, status: 403, error: "You can only ask SuperbBOT about sites on your jobs." };
    }
    return {
      ok: true,
      text: JSON.stringify(
        {
          address: formatAddress(property),
          label: property.label,
          customer: property.customer.name,
          marketingConsent: property.customer.marketingConsent,
          marketingOptOut: property.customer.marketingOptOut,
          siteContact: property.siteContactName,
          accessNotes: clip(property.accessNotes),
          parkingNotes: clip(property.parkingNotes),
          petsHazards: clip(property.petsHazards),
          waterMeter: clip(property.waterMeter),
          shutOffLocation: clip(property.shutOffLocation),
          hotWaterSystem: clip(property.hotWaterSystem),
          gasNotes: clip(property.gasNotes),
          roofingDrainage: clip(property.roofingDrainage),
          complianceNotes: clip(property.complianceNotes),
          recommendations: clip(property.recommendations),
          recentJobs: property.jobs
            .filter((job) => !assignedOnly || job.assignedToId === user.id)
            .map((job) => ({
              jobNumber: job.jobNumber,
              title: job.title,
              status: JOB_STATUS_LABELS[job.status],
            })),
          maintenance: property.maintenancePlans.map((plan) => ({
            name: plan.name,
            type: PLAN_TYPE_LABELS[plan.type],
            nextDue: formatDate(plan.nextDueAt),
          })),
        },
        null,
        2,
      ),
    };
  }

  if (ref.type === "quote") {
    const quote = await prisma.quote.findUnique({
      where: { id: ref.id },
      include: {
        customer: true,
        property: true,
        lineItems: { orderBy: { sortOrder: "asc" }, take: 12 },
      },
    });
    if (!quote) return { ok: false, status: 404, error: "Quote not found." };
    if (assignedOnly && !(await plumberCanSeeCustomer(user.id, quote.customerId))) {
      return { ok: false, status: 403, error: "You can only ask SuperbBOT about quotes on your jobs." };
    }
    return {
      ok: true,
      text: JSON.stringify(
        {
          quoteNumber: quote.quoteNumber,
          title: quote.title,
          status: QUOTE_STATUS_LABELS[quote.status],
          category: CATEGORY_LABELS[quote.category],
          introduction: clip(quote.introduction),
          notes: clip(quote.notes),
          validUntil: quote.validUntil ? formatDate(quote.validUntil) : undefined,
          existingTotalIncGst: formatMoney(quote.totalIncGst),
          gstAmount: formatMoney(quote.gstAmount),
          customer: {
            name: quote.customer.name,
            marketingConsent: quote.customer.marketingConsent,
            marketingOptOut: quote.customer.marketingOptOut,
            preferredContact: quote.customer.preferredContact,
          },
          property: formatAddress(quote.property),
          lineItems: quote.lineItems.map((line) => ({
            description: line.description,
            quantity: line.quantity,
          })),
        },
        null,
        2,
      ),
    };
  }

  if (ref.type === "invoice") {
    const invoice = await prisma.invoice.findUnique({
      where: { id: ref.id },
      include: { customer: true, property: true, job: { select: { jobNumber: true, title: true } } },
    });
    if (!invoice) return { ok: false, status: 404, error: "Invoice not found." };
    if (assignedOnly && !(await plumberCanSeeCustomer(user.id, invoice.customerId))) {
      return { ok: false, status: 403, error: "You can only ask SuperbBOT about invoices on your jobs." };
    }
    return {
      ok: true,
      text: JSON.stringify(
        {
          invoiceNumber: invoice.invoiceNumber,
          status: INVOICE_STATUS_LABELS[invoice.status],
          issued: formatDate(invoice.issuedAt),
          due: formatDate(invoice.dueAt),
          existingTotalIncGst: formatMoney(invoice.totalIncGst),
          amountPaid: formatMoney(invoice.amountPaid),
          customer: {
            name: invoice.customer.name,
            marketingConsent: invoice.customer.marketingConsent,
            marketingOptOut: invoice.customer.marketingOptOut,
          },
          property: formatAddress(invoice.property),
          job: invoice.job ? `${invoice.job.jobNumber} ${invoice.job.title}` : undefined,
        },
        null,
        2,
      ),
    };
  }

  if (ref.type === "maintenance") {
    const plan = await prisma.maintenancePlan.findUnique({
      where: { id: ref.id },
      include: { customer: true, property: true },
    });
    if (!plan) return { ok: false, status: 404, error: "Maintenance plan not found." };
    if (assignedOnly && !(await plumberCanSeeCustomer(user.id, plan.customerId))) {
      return { ok: false, status: 403, error: "You can only ask SuperbBOT about plans on your jobs." };
    }
    return {
      ok: true,
      text: JSON.stringify(
        {
          name: plan.name,
          type: PLAN_TYPE_LABELS[plan.type],
          intervalMonths: plan.intervalMonths,
          nextDue: formatDate(plan.nextDueAt),
          lastDone: plan.lastDoneAt ? formatDate(plan.lastDoneAt) : undefined,
          notes: clip(plan.notes),
          customer: {
            name: plan.customer.name,
            marketingConsent: plan.customer.marketingConsent,
            marketingOptOut: plan.customer.marketingOptOut,
          },
          property: formatAddress(plan.property),
        },
        null,
        2,
      ),
    };
  }

  if (ref.type === "follow-up") {
    const item = await prisma.followUp.findUnique({
      where: { id: ref.id },
      include: {
        customer: true,
        job: { select: { jobNumber: true, title: true, category: true, assignedToId: true } },
      },
    });
    if (!item) return { ok: false, status: 404, error: "Follow-up not found." };
    if (
      assignedOnly &&
      item.assignedToId !== user.id &&
      item.job?.assignedToId !== user.id &&
      !(await plumberCanSeeCustomer(user.id, item.customerId))
    ) {
      return { ok: false, status: 403, error: "You can only ask SuperbBOT about follow-ups on your jobs." };
    }
    return {
      ok: true,
      text: JSON.stringify(
        {
          title: item.title,
          status: FOLLOW_UP_STATUS_LABELS[item.status],
          channel: item.channel,
          due: formatDate(item.dueAt),
          body: clip(item.body, 600),
          customer: {
            name: item.customer.name,
            marketingConsent: item.customer.marketingConsent,
            marketingOptOut: item.customer.marketingOptOut,
            preferredContact: item.customer.preferredContact,
          },
          job: item.job
            ? {
                jobNumber: item.job.jobNumber,
                title: item.job.title,
                category: CATEGORY_LABELS[item.job.category],
              }
            : undefined,
        },
        null,
        2,
      ),
    };
  }

  return { ok: true, text: JSON.stringify({ page: ref.type }) };
}

export async function completeGrokChat(messages: { role: string; content: string }[]) {
  const key = process.env.XAI_API_KEY?.trim();
  if (!key) {
    return { ok: false as const, status: 503, error: "Add XAI_API_KEY to enable SuperbBOT." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(XAI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: grokModel(),
        stream: false,
        temperature: 0.4,
        max_tokens: 1200,
        messages,
      }),
    });

    const raw = await response.text();
    if (!response.ok) {
      return {
        ok: false as const,
        status: response.status >= 500 ? 502 : 400,
        error:
          response.status === 401 || response.status === 403
            ? "xAI rejected the API key. Check XAI_API_KEY in the host environment."
            : "SuperbBOT could not complete that request. Try again in a moment.",
      };
    }

    let parsed: { choices?: { message?: { content?: string } }[] };
    try {
      parsed = JSON.parse(raw) as { choices?: { message?: { content?: string } }[] };
    } catch {
      return { ok: false as const, status: 502, error: "SuperbBOT returned an unexpected response." };
    }

    const content = parsed.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return { ok: false as const, status: 502, error: "SuperbBOT returned an empty reply." };
    }
    return { ok: true as const, content };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      ok: false as const,
      status: 502,
      error: aborted ? "SuperbBOT timed out. Try a shorter question." : "Could not reach SuperbBOT right now.",
    };
  } finally {
    clearTimeout(timer);
  }
}
