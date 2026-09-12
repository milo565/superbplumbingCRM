"use server";

import {
  CustomerStatus,
  CustomerType,
  FollowUpChannel,
  FollowUpStatus,
  InvoiceStatus,
  JobPriority,
  JobStatus,
  MaintenancePlanType,
  Prisma,
  QuoteStatus,
  ServiceCategory,
} from "@prisma/client";
import { addDays, addMonths } from "date-fns";
import { redirect } from "next/navigation";
import { writeAudit, nextNumber } from "@/lib/audit";
import { calcTotals } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { requirePermission, requireUser } from "@/lib/session";
import { SUGGESTED_FOLLOW_UP_MONTHS } from "@/lib/constants";
import { FOLLOW_UP_SEQUENCE } from "@/lib/workflow";
import { customerScopeWhere, jobScopeWhere, touch } from "@/actions/shared";

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function num(form: FormData, key: string, fallback = 0) {
  const value = Number(form.get(key));
  return Number.isFinite(value) ? value : fallback;
}

function bool(form: FormData, key: string) {
  const value = form.get(key);
  return value === "on" || value === "true" || value === "1";
}

async function findDuplicates(name: string, phone: string, email: string, excludeId?: string) {
  const digits = phone.replace(/\D/g, "");
  return prisma.customer.findMany({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      OR: [
        { name: { equals: name } },
        digits ? { phone: { contains: digits.slice(-8) } } : undefined,
        email ? { email: { equals: email, mode: undefined } } : undefined,
      ].filter(Boolean) as Prisma.CustomerWhereInput[],
    },
    take: 5,
    select: { id: true, customerNumber: true, name: true, phone: true },
  });
}

export async function createCustomer(form: FormData) {
  const user = await requirePermission("customers:write");
  const name = str(form, "name");
  const phone = str(form, "phone");
  const email = str(form, "email");
  if (!name || !phone) throw new Error("Name and phone are required.");

  const duplicates = await findDuplicates(name, phone, email);
  if (duplicates.length && str(form, "confirmDuplicate") !== "yes") {
    throw new Error(
      `Possible duplicate: ${duplicates.map((d) => `${d.customerNumber} ${d.name}`).join(", ")}. Resubmit with confirmDuplicate=yes to create anyway.`,
    );
  }

  const customerNumber = await nextNumber("customer", "SF-");
  const customer = await prisma.customer.create({
    data: {
      customerNumber,
      name,
      contactName: str(form, "contactName") || name,
      phone,
      email: email || null,
      type: str(form, "type") as CustomerType,
      status: (str(form, "status") as CustomerStatus) || CustomerStatus.ACTIVE,
      billingStreet: str(form, "billingStreet"),
      billingSuburb: str(form, "billingSuburb"),
      billingState: str(form, "billingState") || "VIC",
      billingPostcode: str(form, "billingPostcode"),
      preferredContact: str(form, "preferredContact") || "phone",
      source: str(form, "source") || null,
      accessInstructions: str(form, "accessInstructions") || null,
      preferredTimes: str(form, "preferredTimes") || null,
      notes: str(form, "notes") || null,
      marketingConsent: !bool(form, "marketingOptOut"),
      marketingOptOut: bool(form, "marketingOptOut"),
      accountManagerId: str(form, "accountManagerId") || user.id,
    },
  });

  const street = str(form, "siteStreet") || str(form, "billingStreet");
  if (street) {
    await prisma.property.create({
      data: {
        customerId: customer.id,
        label: str(form, "siteLabel") || "Primary site",
        street,
        suburb: str(form, "siteSuburb") || str(form, "billingSuburb"),
        postcode: str(form, "sitePostcode") || str(form, "billingPostcode"),
        type: str(form, "type") as CustomerType,
      },
    });
  }

  await writeAudit({
    userId: user.id,
    action: "create",
    entityType: "Customer",
    entityId: customer.id,
    summary: `Created ${customer.customerNumber} ${customer.name}`,
  });
  touch(["/customers", "/dashboard"]);
  redirect(`/customers/${customer.id}`);
}

export async function updateCustomer(form: FormData) {
  const user = await requirePermission("customers:write");
  const id = str(form, "id");
  await prisma.customer.update({
    where: { id },
    data: {
      name: str(form, "name"),
      contactName: str(form, "contactName") || null,
      phone: str(form, "phone"),
      email: str(form, "email") || null,
      type: str(form, "type") as CustomerType,
      status: str(form, "status") as CustomerStatus,
      billingStreet: str(form, "billingStreet"),
      billingSuburb: str(form, "billingSuburb"),
      billingState: str(form, "billingState") || "VIC",
      billingPostcode: str(form, "billingPostcode"),
      preferredContact: str(form, "preferredContact") || "phone",
      source: str(form, "source") || null,
      accessInstructions: str(form, "accessInstructions") || null,
      preferredTimes: str(form, "preferredTimes") || null,
      notes: str(form, "notes") || null,
      marketingConsent: !bool(form, "marketingOptOut"),
      marketingOptOut: bool(form, "marketingOptOut"),
      accountManagerId: str(form, "accountManagerId") || null,
    },
  });
  await writeAudit({
    userId: user.id,
    action: "update",
    entityType: "Customer",
    entityId: id,
    summary: `Updated customer ${str(form, "name")}`,
  });
  touch(["/customers", `/customers/${id}`]);
}

export async function addCommunication(form: FormData) {
  const user = await requireUser();
  const customerId = str(form, "customerId");
  await prisma.communication.create({
    data: {
      customerId,
      jobId: str(form, "jobId") || null,
      userId: user.id,
      type: str(form, "type") as "PHONE" | "EMAIL" | "SMS" | "NOTE" | "SITE_VISIT",
      direction: str(form, "direction") || "outbound",
      subject: str(form, "subject") || null,
      body: str(form, "body"),
    },
  });
  touch([`/customers/${customerId}`, "/follow-ups"]);
}

export async function createProperty(form: FormData) {
  await requirePermission("properties:write");
  const property = await prisma.property.create({
    data: {
      customerId: str(form, "customerId"),
      label: str(form, "label") || null,
      street: str(form, "street"),
      suburb: str(form, "suburb"),
      state: str(form, "state") || "VIC",
      postcode: str(form, "postcode"),
      type: str(form, "type") as CustomerType,
      siteContactName: str(form, "siteContactName") || null,
      siteContactPhone: str(form, "siteContactPhone") || null,
      propertyManager: str(form, "propertyManager") || null,
      accessNotes: str(form, "accessNotes") || null,
      parkingNotes: str(form, "parkingNotes") || null,
      keysLockbox: str(form, "keysLockbox") || null,
      petsHazards: str(form, "petsHazards") || null,
      waterMeter: str(form, "waterMeter") || null,
      shutOffLocation: str(form, "shutOffLocation") || null,
      hotWaterSystem: str(form, "hotWaterSystem") || null,
      gasNotes: str(form, "gasNotes") || null,
      roofingDrainage: str(form, "roofingDrainage") || null,
      fixtures: str(form, "fixtures") || null,
      complianceNotes: str(form, "complianceNotes") || null,
      recommendations: str(form, "recommendations") || null,
    },
  });
  touch(["/properties", `/customers/${property.customerId}`]);
  redirect(`/properties/${property.id}`);
}

export async function updateProperty(form: FormData) {
  await requirePermission("properties:write");
  const id = str(form, "id");
  const property = await prisma.property.update({
    where: { id },
    data: {
      label: str(form, "label") || null,
      street: str(form, "street"),
      suburb: str(form, "suburb"),
      postcode: str(form, "postcode"),
      type: str(form, "type") as CustomerType,
      siteContactName: str(form, "siteContactName") || null,
      siteContactPhone: str(form, "siteContactPhone") || null,
      propertyManager: str(form, "propertyManager") || null,
      accessNotes: str(form, "accessNotes") || null,
      parkingNotes: str(form, "parkingNotes") || null,
      keysLockbox: str(form, "keysLockbox") || null,
      petsHazards: str(form, "petsHazards") || null,
      waterMeter: str(form, "waterMeter") || null,
      shutOffLocation: str(form, "shutOffLocation") || null,
      hotWaterSystem: str(form, "hotWaterSystem") || null,
      gasNotes: str(form, "gasNotes") || null,
      roofingDrainage: str(form, "roofingDrainage") || null,
      fixtures: str(form, "fixtures") || null,
      complianceNotes: str(form, "complianceNotes") || null,
      recommendations: str(form, "recommendations") || null,
    },
  });
  touch(["/properties", `/properties/${id}`, `/customers/${property.customerId}`]);
}

export async function createJob(form: FormData) {
  const user = await requirePermission("jobs:write");
  const labourHours = num(form, "labourHours");
  const labourRate = num(form, "labourRate", 120);
  const materialsCost = num(form, "materialsCost");
  const otherCost = num(form, "otherCost");
  const totals = calcTotals({ labourHours, labourRate, materialsCost, otherCost });
  const jobNumber = await nextNumber("job", "J-");
  const start = str(form, "appointmentStart");
  const job = await prisma.job.create({
    data: {
      jobNumber,
      customerId: str(form, "customerId"),
      propertyId: str(form, "propertyId"),
      createdById: user.id,
      assignedToId: str(form, "assignedToId") || null,
      status: (str(form, "status") as JobStatus) || JobStatus.NEW_ENQUIRY,
      priority: (str(form, "priority") as JobPriority) || JobPriority.NORMAL,
      emergency: bool(form, "emergency"),
      category: str(form, "category") as ServiceCategory,
      title: str(form, "title"),
      description: str(form, "description"),
      appointmentStart: start ? new Date(start) : null,
      windowLabel: str(form, "windowLabel") || null,
      locationConfirmed: bool(form, "locationConfirmed"),
      labourHours,
      labourRate,
      materialsCost,
      otherCost,
      gstAmount: totals.gstAmount,
      totalIncGst: totals.totalIncGst,
      internalNotes: str(form, "internalNotes") || null,
      statusHistory: {
        create: { to: (str(form, "status") as JobStatus) || JobStatus.NEW_ENQUIRY, note: "Created" },
      },
    },
  });
  await writeAudit({
    userId: user.id,
    action: "create",
    entityType: "Job",
    entityId: job.id,
    summary: `Created ${job.jobNumber}`,
  });
  touch(["/jobs", "/dashboard", "/enquiries", "/calendar"]);
  redirect(`/jobs/${job.id}`);
}

export async function updateJobStatus(form: FormData) {
  const user = await requirePermission("jobs:write");
  const id = str(form, "id");
  const to = str(form, "status") as JobStatus;
  const existing = await prisma.job.findUnique({ where: { id } });
  if (!existing) throw new Error("Job not found");

  const labourHours = num(form, "labourHours", existing.labourHours);
  const labourRate = num(form, "labourRate", existing.labourRate);
  const materialsCost = num(form, "materialsCost", existing.materialsCost);
  const otherCost = num(form, "otherCost", existing.otherCost);
  const totals = calcTotals({ labourHours, labourRate, materialsCost, otherCost });

  const assignedToId = str(form, "assignedToId");
  const start = str(form, "appointmentStart");

  await prisma.job.update({
    where: { id },
    data: {
      status: to,
      assignedToId: assignedToId || existing.assignedToId,
      priority: (str(form, "priority") as JobPriority) || existing.priority,
      emergency: form.has("emergency") ? bool(form, "emergency") : existing.emergency,
      title: str(form, "title") || existing.title,
      description: str(form, "description") || existing.description,
      appointmentStart: start ? new Date(start) : existing.appointmentStart,
      windowLabel: str(form, "windowLabel") || existing.windowLabel,
      labourHours,
      labourRate,
      materialsCost,
      otherCost,
      gstAmount: totals.gstAmount,
      totalIncGst: totals.totalIncGst,
      beforeNotes: str(form, "beforeNotes") || existing.beforeNotes,
      afterNotes: str(form, "afterNotes") || existing.afterNotes,
      internalNotes: str(form, "internalNotes") || existing.internalNotes,
      recommendations: str(form, "recommendations") || existing.recommendations,
      complianceNotes: str(form, "complianceNotes") || existing.complianceNotes,
      warrantyMonths: num(form, "warrantyMonths", existing.warrantyMonths ?? 0) || existing.warrantyMonths,
      locationConfirmed: form.has("locationConfirmed")
        ? bool(form, "locationConfirmed")
        : existing.locationConfirmed,
      completedAt: to === "COMPLETED" ? new Date() : existing.completedAt,
      statusHistory: {
        create: { from: existing.status, to, note: str(form, "statusNote") || null },
      },
    },
  });

  await writeAudit({
    userId: user.id,
    action: "status",
    entityType: "Job",
    entityId: id,
    summary: `${existing.jobNumber} ${existing.status} → ${to}`,
  });
  touch(["/jobs", `/jobs/${id}`, "/dashboard", "/calendar", "/previous-work"]);
}

export async function completeJobWithFollowUp(form: FormData) {
  const user = await requirePermission("jobs:write");
  const id = str(form, "id");
  const job = await prisma.job.findUnique({
    where: { id },
    include: { customer: true, property: true },
  });
  if (!job) throw new Error("Job not found");

  const mode = str(form, "followMode");
  const months =
    num(form, "followMonths") || SUGGESTED_FOLLOW_UP_MONTHS[job.category];
  const due = addMonths(new Date(), months);

  await prisma.job.update({
    where: { id },
    data: {
      status: JobStatus.COMPLETED,
      completedAt: new Date(),
      nextFollowUpAt: mode === "plan" ? null : due,
      recommendations: str(form, "recommendations") || job.recommendations,
      afterNotes: str(form, "afterNotes") || job.afterNotes,
      signatureName: str(form, "signatureName") || job.signatureName,
      signedAt: str(form, "signatureName") ? new Date() : job.signedAt,
      statusHistory: {
        create: { from: job.status, to: JobStatus.COMPLETED, note: "Completed on site" },
      },
    },
  });

  await prisma.customer.update({
    where: { id: job.customerId },
    data: { lastJobAt: new Date(), nextFollowUpAt: mode === "plan" ? job.customer.nextFollowUpAt : due },
  });

  if (mode === "plan") {
    await prisma.maintenancePlan.create({
      data: {
        name: str(form, "planName") || `${job.category} plan`,
        type: (str(form, "planType") as MaintenancePlanType) || MaintenancePlanType.ANNUAL,
        intervalMonths: months,
        nextDueAt: due,
        lastDoneAt: new Date(),
        customerId: job.customerId,
        propertyId: job.propertyId,
        notes: str(form, "recommendations") || null,
      },
    });
  } else {
    const optedOut = job.customer.marketingOptOut;
    const requireApproval =
      process.env.FOLLOWUP_REQUIRE_APPROVAL === "true" ||
      (await prisma.setting.findUnique({ where: { key: "followUpRequireApproval" } }))?.value ===
        "true";

    for (const step of FOLLOW_UP_SEQUENCE) {
      const stepDue = addDays(due, -step.daysBefore);
      const outbound = step.channel === "SMS" || step.channel === "EMAIL";
      await prisma.followUp.create({
        data: {
          title: `${step.title} — ${job.jobNumber}`,
          channel: step.channel,
          sequenceStep: step.step,
          dueAt: stepDue,
          requireApproval: outbound && requireApproval,
          status: optedOut && outbound
            ? FollowUpStatus.BLOCKED_OPT_OUT
            : outbound && requireApproval
              ? FollowUpStatus.AWAITING_APPROVAL
              : FollowUpStatus.PENDING,
          templateKey: step.channel === "SMS" ? "followup-sms-due" : "followup-email-due",
          body: `Hi ${job.customer.contactName ?? job.customer.name}, follow-up for ${job.title} at ${job.property.street}, ${job.property.suburb}.`,
          customerId: job.customerId,
          jobId: job.id,
          assignedToId: user.id,
        },
      });
    }
  }

  await writeAudit({
    userId: user.id,
    action: "complete",
    entityType: "Job",
    entityId: id,
    summary: `Completed ${job.jobNumber} with ${mode} follow-up`,
  });
  touch(["/jobs", `/jobs/${id}`, "/follow-ups", "/maintenance", "/previous-work", "/dashboard"]);
}

export async function confirmJobLocation(form: FormData) {
  await requirePermission("jobs:write");
  const id = str(form, "id");
  await prisma.job.update({
    where: { id },
    data: { locationConfirmed: true },
  });
  touch([`/jobs/${id}`, "/calendar"]);
}

export async function checkInJob(form: FormData) {
  const user = await requireUser();
  const id = str(form, "id");
  await prisma.job.update({
    where: { id },
    data: {
      checkedInAt: new Date(),
      status: JobStatus.IN_PROGRESS,
      statusHistory: { create: { to: JobStatus.IN_PROGRESS, note: "Checked in" } },
    },
  });
  await prisma.timeEntry.create({
    data: { jobId: id, userId: user.id, startedAt: new Date(), note: "Check-in" },
  });
  touch([`/jobs/${id}`, "/calendar", "/dashboard"]);
}

export async function checkOutJob(form: FormData) {
  const user = await requireUser();
  const id = str(form, "id");
  const open = await prisma.timeEntry.findFirst({
    where: { jobId: id, userId: user.id, endedAt: null },
    orderBy: { startedAt: "desc" },
  });
  const endedAt = new Date();
  if (open) {
    const hours = (endedAt.getTime() - open.startedAt.getTime()) / 36e5;
    await prisma.timeEntry.update({
      where: { id: open.id },
      data: { endedAt, hours, note: "Check-out" },
    });
  }
  await prisma.job.update({
    where: { id },
    data: { checkedOutAt: endedAt },
  });
  touch([`/jobs/${id}`, "/calendar"]);
}

export async function createQuote(form: FormData) {
  const user = await requirePermission("quotes:write");
  const labourHours = num(form, "labourHours");
  const labourRate = num(form, "labourRate", 120);
  const materialsCost = num(form, "materialsCost");
  const totals = calcTotals({ labourHours, labourRate, materialsCost, otherCost: 0 });
  const quote = await prisma.quote.create({
    data: {
      quoteNumber: await nextNumber("quote", "Q-"),
      customerId: str(form, "customerId"),
      propertyId: str(form, "propertyId"),
      createdById: user.id,
      status: QuoteStatus.DRAFT,
      category: str(form, "category") as ServiceCategory,
      title: str(form, "title"),
      introduction: str(form, "introduction") || null,
      labourHours,
      labourRate,
      materialsCost,
      gstAmount: totals.gstAmount,
      totalIncGst: totals.totalIncGst,
      notes: str(form, "notes") || null,
      validUntil: str(form, "validUntil") ? new Date(str(form, "validUntil")) : addDays(new Date(), 14),
    },
  });
  touch(["/quotes", "/dashboard"]);
  redirect(`/quotes/${quote.id}`);
}

export async function updateQuoteStatus(form: FormData) {
  await requirePermission("quotes:write");
  const id = str(form, "id");
  const status = str(form, "status") as QuoteStatus;
  await prisma.quote.update({
    where: { id },
    data: {
      status,
      sentAt: status === "SENT" ? new Date() : undefined,
      approvedAt: status === "APPROVED" ? new Date() : undefined,
    },
  });
  touch(["/quotes", `/quotes/${id}`, "/dashboard"]);
}

export async function convertQuoteToJob(form: FormData) {
  const user = await requirePermission("jobs:write");
  const id = str(form, "id");
  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote) throw new Error("Quote not found");
  const jobNumber = await nextNumber("job", "J-");
  const job = await prisma.job.create({
    data: {
      jobNumber,
      customerId: quote.customerId,
      propertyId: quote.propertyId,
      quoteId: quote.id,
      createdById: user.id,
      status: JobStatus.APPROVED,
      priority: JobPriority.NORMAL,
      category: quote.category,
      title: quote.title,
      description: quote.introduction ?? quote.title,
      labourHours: quote.labourHours,
      labourRate: quote.labourRate,
      materialsCost: quote.materialsCost,
      gstAmount: quote.gstAmount,
      totalIncGst: quote.totalIncGst,
      statusHistory: { create: { to: JobStatus.APPROVED, note: `Converted from ${quote.quoteNumber}` } },
    },
  });
  await prisma.quote.update({ where: { id }, data: { status: QuoteStatus.CONVERTED } });
  touch(["/quotes", "/jobs", "/dashboard"]);
  redirect(`/jobs/${job.id}`);
}

export async function convertJobToInvoice(form: FormData) {
  await requirePermission("invoices:write");
  const id = str(form, "id");
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) throw new Error("Job not found");
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: await nextNumber("invoice", "INV-"),
      customerId: job.customerId,
      propertyId: job.propertyId,
      jobId: job.id,
      status: InvoiceStatus.SENT,
      dueAt: addDays(new Date(), 14),
      labourHours: job.labourHours,
      labourRate: job.labourRate,
      materialsCost: job.materialsCost,
      otherCost: job.otherCost,
      gstAmount: job.gstAmount,
      totalIncGst: job.totalIncGst,
      notes: job.recommendations,
    },
  });
  await prisma.job.update({
    where: { id },
    data: {
      status: JobStatus.INVOICED,
      statusHistory: { create: { from: job.status, to: JobStatus.INVOICED } },
    },
  });
  touch(["/invoices", "/jobs", `/jobs/${id}`, "/dashboard"]);
  redirect(`/invoices/${invoice.id}`);
}

export async function recordPayment(form: FormData) {
  await requirePermission("invoices:write");
  const invoiceId = str(form, "invoiceId");
  const amount = num(form, "amount");
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error("Invoice not found");
  await prisma.payment.create({
    data: {
      invoiceId,
      amount,
      method: str(form, "method") || "Bank transfer",
      reference: str(form, "reference") || null,
    },
  });
  const amountPaid = invoice.amountPaid + amount;
  const paid = amountPaid >= invoice.totalIncGst - 0.01;
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      amountPaid,
      status: paid ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL,
      paidAt: paid ? new Date() : null,
    },
  });
  if (paid && invoice.jobId) {
    await prisma.job.update({
      where: { id: invoice.jobId },
      data: { status: JobStatus.PAID },
    });
  }
  touch(["/invoices", `/invoices/${invoiceId}`, "/dashboard", "/reports"]);
}

export async function createFollowUp(form: FormData) {
  const user = await requirePermission("followups:write");
  const customer = await prisma.customer.findUnique({ where: { id: str(form, "customerId") } });
  if (!customer) throw new Error("Customer not found");
  const outbound = ["SMS", "EMAIL"].includes(str(form, "channel"));
  const blocked = customer.marketingOptOut && outbound;
  await prisma.followUp.create({
    data: {
      title: str(form, "title"),
      customerId: customer.id,
      jobId: str(form, "jobId") || null,
      assignedToId: str(form, "assignedToId") || user.id,
      channel: str(form, "channel") as FollowUpChannel,
      dueAt: new Date(str(form, "dueAt")),
      body: str(form, "body"),
      requireApproval: outbound,
      status: blocked
        ? FollowUpStatus.BLOCKED_OPT_OUT
        : outbound
          ? FollowUpStatus.AWAITING_APPROVAL
          : FollowUpStatus.PENDING,
    },
  });
  touch(["/follow-ups", `/customers/${customer.id}`]);
}

export async function approveFollowUp(form: FormData) {
  await requirePermission("followups:approve");
  const id = str(form, "id");
  await prisma.followUp.update({
    where: { id },
    data: { status: FollowUpStatus.APPROVED, approvedAt: new Date() },
  });
  touch(["/follow-ups"]);
}

export async function sendFollowUp(form: FormData) {
  const user = await requirePermission("followups:write");
  const id = str(form, "id");
  const follow = await prisma.followUp.findUnique({
    where: { id },
    include: { customer: true },
  });
  if (!follow) throw new Error("Follow-up not found");
  if (follow.customer.marketingOptOut && follow.channel !== "INTERNAL") {
    await prisma.followUp.update({
      where: { id },
      data: { status: FollowUpStatus.BLOCKED_OPT_OUT },
    });
    touch(["/follow-ups"]);
    return;
  }
  await prisma.followUp.update({
    where: { id },
    data: {
      status: follow.channel === "CALL" ? FollowUpStatus.CALLED : FollowUpStatus.SENT,
      sentAt: new Date(),
    },
  });
  await prisma.communication.create({
    data: {
      customerId: follow.customerId,
      jobId: follow.jobId,
      userId: user.id,
      type: follow.channel === "SMS" ? "SMS" : follow.channel === "CALL" ? "PHONE" : "EMAIL",
      subject: follow.title,
      body: `${follow.body}\n\n[Demo stub — message not sent to a live gateway]`,
    },
  });
  touch(["/follow-ups", `/customers/${follow.customerId}`]);
}

export async function snoozeFollowUp(form: FormData) {
  await requirePermission("followups:write");
  const id = str(form, "id");
  const until = str(form, "until") ? new Date(str(form, "until")) : addDays(new Date(), 7);
  await prisma.followUp.update({
    where: { id },
    data: { status: FollowUpStatus.SNOOZED, snoozedUntil: until, dueAt: until },
  });
  touch(["/follow-ups"]);
}

export async function completeFollowUp(form: FormData) {
  await requirePermission("followups:write");
  await prisma.followUp.update({
    where: { id: str(form, "id") },
    data: { status: FollowUpStatus.COMPLETED, completedAt: new Date() },
  });
  touch(["/follow-ups", "/dashboard"]);
}

export async function createMaintenancePlan(form: FormData) {
  await requirePermission("maintenance:write");
  const plan = await prisma.maintenancePlan.create({
    data: {
      name: str(form, "name"),
      type: str(form, "type") as MaintenancePlanType,
      intervalMonths: num(form, "intervalMonths", 12),
      nextDueAt: new Date(str(form, "nextDueAt")),
      notes: str(form, "notes") || null,
      customerId: str(form, "customerId"),
      propertyId: str(form, "propertyId"),
    },
  });
  touch(["/maintenance"]);
  redirect(`/maintenance/${plan.id}`);
}

export async function saveTemplate(form: FormData) {
  await requirePermission("settings:write");
  await prisma.template.update({
    where: { id: str(form, "id") },
    data: {
      name: str(form, "name"),
      subject: str(form, "subject") || null,
      body: str(form, "body"),
    },
  });
  touch(["/settings"]);
}

export async function saveSettings(form: FormData) {
  await requirePermission("settings:write");
  const keys = [
    "companyName",
    "abn",
    "email",
    "phonePrimary",
    "phoneSecondary",
    "followUpRequireApproval",
    "defaultLabourRate",
  ];
  for (const key of keys) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: str(form, key) },
      create: { key, value: str(form, key) },
    });
  }
  touch(["/settings"]);
}

export async function updateUserRole(form: FormData) {
  await requirePermission("team:write");
  await prisma.user.update({
    where: { id: str(form, "id") },
    data: { active: bool(form, "active") },
  });
  touch(["/team"]);
}

export async function searchRecords(query: string) {
  await requireUser();
  const q = query.trim();
  if (q.length < 2) return { customers: [], jobs: [], properties: [], quotes: [] };
  const { where: customerWhere } = await customerScopeWhere();
  const { where: jobWhere } = await jobScopeWhere();
  const [customers, jobs, properties, quotes] = await Promise.all([
    prisma.customer.findMany({
      where: {
        AND: [
          customerWhere,
          {
            OR: [
              { name: { contains: q } },
              { phone: { contains: q } },
              { email: { contains: q } },
              { customerNumber: { contains: q } },
            ],
          },
        ],
      },
      take: 8,
    }),
    prisma.job.findMany({
      where: {
        AND: [
          jobWhere,
          {
            OR: [
              { jobNumber: { contains: q } },
              { title: { contains: q } },
              { description: { contains: q } },
            ],
          },
        ],
      },
      include: { customer: true, property: true },
      take: 8,
    }),
    prisma.property.findMany({
      where: {
        OR: [
          { street: { contains: q } },
          { suburb: { contains: q } },
          { label: { contains: q } },
          { postcode: { contains: q } },
        ],
      },
      include: { customer: true },
      take: 8,
    }),
    prisma.quote.findMany({
      where: {
        OR: [{ quoteNumber: { contains: q } }, { title: { contains: q } }],
      },
      include: { customer: true },
      take: 6,
    }),
  ]);
  return { customers, jobs, properties, quotes };
}
