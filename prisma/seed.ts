import {
  CustomerStatus,
  CustomerType,
  FollowUpChannel,
  FollowUpStatus,
  InvoiceStatus,
  JobPriority,
  JobStatus,
  MaintenancePlanType,
  PrismaClient,
  QuoteStatus,
  Role,
  ServiceCategory,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, addMonths, setHours, setMinutes, subDays, subMonths } from "date-fns";
import { COMPANY, DEMO_PASSWORD } from "../lib/constants";
import { calcTotals } from "../lib/money";

const prisma = new PrismaClient();

// Demo-only Gold Coast / Northern NSW data. Do not run against a
// live customer database without changing every login first. See DEPLOY.md.

const PASSWORD = DEMO_PASSWORD;
const RATE = 140;

function at(base: Date, hour: number, minute = 0) {
  return setMinutes(setHours(base, hour), minute);
}

async function main() {
  await prisma.payment.deleteMany();
  await prisma.lineItem.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.jobStatusHistory.deleteMany();
  await prisma.document.deleteMany();
  await prisma.communication.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.job.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.maintenancePlan.deleteMany();
  await prisma.property.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.template.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.counter.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash(PASSWORD, 10);
  const now = new Date();
  const today = at(now, 8, 0);

  const kai = await prisma.user.create({
    data: {
      email: "kai@kaizencoastal.com.au",
      passwordHash: hash,
      name: "Kai Vincent",
      phone: "0428316868",
      role: Role.OWNER,
      avatarInitials: "KV",
      licenceNumber: "ARC L188734",
    },
  });
  const maya = await prisma.user.create({
    data: {
      email: "office@kaizencoastal.com.au",
      passwordHash: hash,
      name: "Maya Chen",
      phone: "0428316868",
      role: Role.OFFICE_ADMIN,
      avatarInitials: "MC",
    },
  });
  const tom = await prisma.user.create({
    data: {
      email: "tom@kaizencoastal.com.au",
      passwordHash: hash,
      name: "Tom Reeves",
      phone: "0421330441",
      role: Role.SUPERVISOR,
      avatarInitials: "TR",
      licenceNumber: "NSW 473916C",
    },
  });
  const jordan = await prisma.user.create({
    data: {
      email: "jordan@kaizencoastal.com.au",
      passwordHash: hash,
      name: "Jordan Walsh",
      phone: "0432118902",
      role: Role.PLUMBER,
      avatarInitials: "JW",
      licenceNumber: "ARC L188901",
    },
  });
  const riley = await prisma.user.create({
    data: {
      email: "riley@kaizencoastal.com.au",
      passwordHash: hash,
      name: "Riley Nguyen",
      phone: "0408776215",
      role: Role.PLUMBER,
      avatarInitials: "RN",
      licenceNumber: "ARC L189014",
    },
  });
  const sophie = await prisma.user.create({
    data: {
      email: "sophie@kaizencoastal.com.au",
      passwordHash: hash,
      name: "Sophie Hart",
      phone: "0415229640",
      role: Role.SALES,
      avatarInitials: "SH",
    },
  });

  await prisma.setting.createMany({
    data: [
      { key: "companyName", value: COMPANY.name },
      { key: "category", value: COMPANY.category },
      { key: "address", value: COMPANY.address },
      { key: "abn", value: COMPANY.abn },
      { key: "email", value: COMPANY.email },
      { key: "phonePrimary", value: COMPANY.phonePrimary },
      { key: "hours", value: COMPANY.hours },
      { key: "hoursSchedule", value: COMPANY.hoursSchedule },
      { key: "followUpRequireApproval", value: "true" },
      { key: "defaultLabourRate", value: String(RATE) },
      { key: "gstRate", value: "0.10" },
      { key: "timezone", value: "Australia/Brisbane" },
      { key: "integrations.xero", value: "disconnected" },
      { key: "integrations.myob", value: "disconnected" },
      { key: "integrations.sms", value: "stub" },
    ],
  });

  await prisma.template.createMany({
    data: [
      {
        key: "followup-sms-due",
        name: "Follow-up SMS — service due",
        channel: FollowUpChannel.SMS,
        body: "Hi {{contactName}}, it's {{technicianName}} from Kaizen Coastal. Your {{service}} at {{propertyAddress}} is due for a filter clean / service so it stays efficient. Want a morning window? Reply YES or call 0428 316 868.",
      },
      {
        key: "followup-email-due",
        name: "Follow-up email — service due",
        channel: FollowUpChannel.EMAIL,
        subject: "Service due — {{propertyAddress}}",
        body: "Hi {{contactName}},\n\nYour {{service}} at {{propertyAddress}} is coming due for a filter clean and performance check. That keeps the system efficient through Gold Coast humidity.\n\nWe can lock a morning or afternoon window that suits. We're open until 21:00.\n\nKaizen Coastal Air Conditioning\nHome service in Tugun, Queensland\nThe Parc, 2 Inland Dr, Tugun QLD 4224\nThe perfect temperature all year round.\n0428 316 868",
      },
      {
        key: "followup-call-script",
        name: "Follow-up call script",
        channel: FollowUpChannel.CALL,
        body: "Call {{contactName}} on {{phone}}. Mention the {{service}} at {{propertyAddress}} and offer a 6 or 12-month service. If they opt out, mark consent immediately.",
      },
      {
        key: "quote-cover",
        name: "Quote cover note",
        channel: FollowUpChannel.EMAIL,
        subject: "Quote {{quoteNumber}} — Kaizen Coastal Air Conditioning",
        body: "Hi {{contactName}},\n\nHere is a clear quote for the air conditioning work at {{propertyAddress}}. GST is included. Happy to talk through sizing, install window and warranty.\n\nKaizen Coastal Air Conditioning\nThe Parc, 2 Inland Dr, Tugun QLD 4224\nKai — 0428 316 868 · open, closes 21:00",
      },
    ],
  });

  const saltwater = await prisma.customer.create({
    data: {
      customerNumber: "KC-1001",
      type: CustomerType.COMMERCIAL,
      name: "Saltwater Property Group",
      contactName: "Melissa Hart",
      phone: "0755932100",
      email: "melissa.hart@saltwaterpg.com.au",
      billingStreet: "Level 2, 17 Lawson Street",
      billingSuburb: "Southport",
      billingState: "QLD",
      billingPostcode: "4215",
      preferredContact: "email",
      source: "Property manager referral",
      status: CustomerStatus.ACTIVE,
      accountManagerId: sophie.id,
      notes: "PM portfolio — Robina office, Varsity Lakes tenancy, Coolangatta retail.",
    },
  });
  const tanya = await prisma.customer.create({
    data: {
      customerNumber: "KC-1002",
      type: CustomerType.RESIDENTIAL,
      name: "Tanya Brennan",
      contactName: "Tanya Brennan",
      phone: "0412884410",
      email: "tanya.brennan@email.com",
      billingStreet: "14 Birralee Street",
      billingSuburb: "Pacific Pines",
      billingState: "QLD",
      billingPostcode: "4211",
      preferredContact: "sms",
      source: "hipages",
      status: CustomerStatus.ACTIVE,
      accountManagerId: kai.id,
    },
  });
  const jun = await prisma.customer.create({
    data: {
      customerNumber: "KC-1003",
      type: CustomerType.RESIDENTIAL,
      name: "Jun Xiao",
      contactName: "Jun Xiao",
      phone: "0401992287",
      email: "jun.xiao@email.com",
      billingStreet: "8 Mermaid Avenue",
      billingSuburb: "Southport",
      billingState: "QLD",
      billingPostcode: "4215",
      preferredContact: "phone",
      source: "Repeat customer",
      status: CustomerStatus.ACTIVE,
      accountManagerId: jordan.id,
    },
  });
  const medical = await prisma.customer.create({
    data: {
      customerNumber: "KC-1004",
      type: CustomerType.COMMERCIAL,
      name: "Elanora Medical Centre",
      contactName: "Dr Priya Nair",
      phone: "0755348800",
      email: "practice@elanoramedical.com.au",
      billingStreet: "42 Guineas Creek Road",
      billingSuburb: "Elanora",
      billingState: "QLD",
      billingPostcode: "4221",
      preferredContact: "email",
      source: "Commercial enquiry",
      status: CustomerStatus.ACTIVE,
      accountManagerId: tom.id,
    },
  });
  const cafe = await prisma.customer.create({
    data: {
      customerNumber: "KC-1005",
      type: CustomerType.COMMERCIAL,
      name: "Coastline Cafe",
      contactName: "Owen Blake",
      phone: "0755364411",
      email: "owen@coastlinecafe.com.au",
      billingStreet: "2 McLean Street",
      billingSuburb: "Coolangatta",
      billingState: "QLD",
      billingPostcode: "4225",
      preferredContact: "phone",
      source: "Walk-in / local",
      status: CustomerStatus.ACTIVE,
      accountManagerId: sophie.id,
    },
  });
  const strata = await prisma.customer.create({
    data: {
      customerNumber: "KC-1006",
      type: CustomerType.COMMERCIAL,
      name: "Banora Point Strata",
      contactName: "Helen Crowe",
      phone: "0755240091",
      email: "helen@banorapointstrata.com.au",
      billingStreet: "1 Leisure Drive",
      billingSuburb: "Banora Point",
      billingState: "NSW",
      billingPostcode: "2486",
      preferredContact: "email",
      source: "NSW Fair Trading / strata",
      status: CustomerStatus.ACTIVE,
      accountManagerId: tom.id,
    },
  });
  const kingscliff = await prisma.customer.create({
    data: {
      customerNumber: "KC-1007",
      type: CustomerType.RESIDENTIAL,
      name: "Elena Rossi",
      contactName: "Elena Rossi",
      phone: "0416002981",
      email: "elena.rossi@email.com",
      billingStreet: "22 Marine Parade",
      billingSuburb: "Kingscliff",
      billingState: "NSW",
      billingPostcode: "2487",
      preferredContact: "sms",
      source: "Holiday let / AirBNB host",
      status: CustomerStatus.ACTIVE,
      marketingConsent: true,
      accountManagerId: sophie.id,
    },
  });
  const tugun = await prisma.customer.create({
    data: {
      customerNumber: "KC-1008",
      type: CustomerType.RESIDENTIAL,
      name: "Sam Okonkwo",
      contactName: "Sam Okonkwo",
      phone: "0432109844",
      email: "sam.okonkwo@email.com",
      billingStreet: "9 Toolona Street",
      billingSuburb: "Tugun",
      billingState: "QLD",
      billingPostcode: "4224",
      preferredContact: "phone",
      source: "Neighbour referral",
      status: CustomerStatus.ACTIVE,
      accountManagerId: kai.id,
    },
  });
  const burleigh = await prisma.customer.create({
    data: {
      customerNumber: "KC-1009",
      type: CustomerType.RESIDENTIAL,
      name: "Liam Chen",
      contactName: "Liam Chen",
      phone: "0413882104",
      email: "liam.chen@email.com",
      billingStreet: "31 The Esplanade",
      billingSuburb: "Burleigh Heads",
      billingState: "QLD",
      billingPostcode: "4220",
      preferredContact: "sms",
      source: "Google",
      status: CustomerStatus.PROSPECT,
      accountManagerId: sophie.id,
    },
  });
  const robina = await prisma.customer.create({
    data: {
      customerNumber: "KC-1010",
      type: CustomerType.COMMERCIAL,
      name: "Robina Office Suites",
      contactName: "Nathan Blake",
      phone: "0755572200",
      email: "nathan.blake@robinasuites.com.au",
      billingStreet: "14 Markeri Street",
      billingSuburb: "Robina",
      billingState: "QLD",
      billingPostcode: "4226",
      preferredContact: "email",
      source: "PM portfolio",
      status: CustomerStatus.ACTIVE,
      accountManagerId: tom.id,
    },
  });

  async function site(
    customerId: string,
    street: string,
    suburb: string,
    postcode: string,
    state: string,
    type: CustomerType,
    extra: Record<string, string | null | undefined> = {},
  ) {
    return prisma.property.create({
      data: {
        customerId,
        street,
        suburb,
        postcode,
        state,
        type,
        label: extra.label ?? null,
        siteContactName: extra.siteContactName ?? null,
        siteContactPhone: extra.siteContactPhone ?? null,
        propertyManager: extra.propertyManager ?? null,
        accessNotes: extra.accessNotes ?? null,
        parkingNotes: extra.parkingNotes ?? null,
        keysLockbox: extra.keysLockbox ?? null,
        petsHazards: extra.petsHazards ?? null,
        outdoorUnit: extra.outdoorUnit ?? null,
        isolatorLocation: extra.isolatorLocation ?? null,
        indoorHeads: extra.indoorHeads ?? null,
        refrigerantType: extra.refrigerantType ?? null,
        mountNotes: extra.mountNotes ?? null,
        modelSerial: extra.modelSerial ?? null,
        filterDates: extra.filterDates ?? null,
        complianceNotes: extra.complianceNotes ?? null,
        recommendations: extra.recommendations ?? null,
      },
    });
  }

  const saltwaterOffice = await site(
    saltwater.id,
    "17 Lawson Street",
    "Southport",
    "4215",
    "QLD",
    CustomerType.COMMERCIAL,
    {
      label: "Southport office",
      propertyManager: "Melissa Hart",
      outdoorUnit: "Roof plant — 2 x Daikin VRV outdoor",
      isolatorLocation: "Plant room switchboard, labelled AC-1 / AC-2",
      indoorHeads: "8 wall splits + 2 cassettes",
      refrigerantType: "R410A — reclaim notes on last service",
      mountNotes: "Roof plant, hatch from Level 2 store",
      modelSerial: "Daikin RXYQ10 / indoor mix",
      filterDates: "Last commercial service Mar 2026; next Jun 2026",
      complianceNotes: "Electrical isolators tagged. Warranty on indoor 2 lapsed.",
    },
  );
  const varsityTenancy = await site(
    saltwater.id,
    "5 University Drive",
    "Varsity Lakes",
    "4227",
    "QLD",
    CustomerType.COMMERCIAL,
    {
      label: "Tenancy B12",
      outdoorUnit: "Ground pad, west wall",
      isolatorLocation: "External isolator beside outdoor",
      indoorHeads: "1 cassette over open plan",
      refrigerantType: "R32",
      mountNotes: "Wall brackets, no roof work",
      filterDates: "Due this month",
    },
  );
  const tanyaHome = await site(tanya.id, "14 Birralee Street", "Pacific Pines", "4211", "QLD", CustomerType.RESIDENTIAL, {
    outdoorUnit: "Rear patio, Mitsubishi 7.1kW",
    isolatorLocation: "Beside outdoor unit, lockable",
    indoorHeads: "1 living, 1 bedroom",
    refrigerantType: "R32",
    mountNotes: "Wall mount living, high wall bedroom",
    modelSerial: "MSZ-AP71 / MXZ-2F52",
    filterDates: "Filters cleaned on last install; 12-month service due",
    recommendations: "Book 12-month split service before summer.",
    petsHazards: "Dog in backyard — call first.",
  });
  const junHome = await site(jun.id, "8 Mermaid Avenue", "Southport", "4215", "QLD", CustomerType.RESIDENTIAL, {
    outdoorUnit: "Side path, ageing Fujitsu",
    isolatorLocation: "Meter board isolator",
    indoorHeads: "1 living split — noisy outdoor",
    refrigerantType: "R410A — quote reclaim on replacement",
    mountNotes: "Replace on same wall brackets if possible",
    filterDates: "Not serviced in 18 months",
    recommendations: "Replace with 7.1kW R32 split. Quote sent.",
  });
  const medicalSite = await site(
    medical.id,
    "42 Guineas Creek Road",
    "Elanora",
    "4221",
    "QLD",
    CustomerType.COMMERCIAL,
    {
      label: "Clinic",
      outdoorUnit: "Roof — 3 Mitsubishi cassettes outdoor",
      isolatorLocation: "Plant cupboard isolators",
      indoorHeads: "3 cassettes — consult, waiting, staff",
      refrigerantType: "R32",
      mountNotes: "Roof walkway, harness points",
      filterDates: "Quarterly commercial maintenance",
      complianceNotes: "After-hours access via practice manager.",
    },
  );
  const cafeSite = await site(cafe.id, "2 McLean Street", "Coolangatta", "4225", "QLD", CustomerType.COMMERCIAL, {
    outdoorUnit: "Lane behind kitchen, salt air",
    isolatorLocation: "Kitchen switchboard",
    indoorHeads: "1 cassette dining, 1 split kitchen",
    refrigerantType: "R32",
    mountNotes: "Corrosion on outdoor fins — rinse at service",
    filterDates: "Kitchen filters monthly; dining 6-monthly",
    petsHazards: "Hot kitchen — isolate before coil work.",
  });
  const strataSite = await site(strata.id, "12 Banora Boulevard", "Banora Point", "2486", "NSW", CustomerType.COMMERCIAL, {
    label: "Common property plant",
    outdoorUnit: "Carpark plant cage",
    isolatorLocation: "Cage isolator + MSB",
    indoorHeads: "Foyer cassette + gym split",
    refrigerantType: "R410A",
    mountNotes: "NSW Fair Trading 473916C on file",
    filterDates: "Strata quarterly",
    propertyManager: "Helen Crowe",
  });
  const kingscliffHome = await site(
    kingscliff.id,
    "22 Marine Parade",
    "Kingscliff",
    "2487",
    "NSW",
    CustomerType.RESIDENTIAL,
    {
      outdoorUnit: "Deck, Daikin 8.5kW",
      isolatorLocation: "Deck isolator",
      indoorHeads: "Living + 2 bedrooms",
      refrigerantType: "R32",
      mountNotes: "Holiday let — lockbox on side gate",
      keysLockbox: "Lockbox 4281",
      filterDates: "Service every 6 months between guests",
    },
  );
  const tugunHome = await site(tugun.id, "9 Toolona Street", "Tugun", "4224", "QLD", CustomerType.RESIDENTIAL, {
    outdoorUnit: "Ground slab, new Panasonic 5.0kW",
    isolatorLocation: "Beside outdoor",
    indoorHeads: "1 living split",
    refrigerantType: "R32",
    mountNotes: "Wall mount living, condensate to garden",
    modelSerial: "CS-Z50XKRW",
    filterDates: "Installed this season — 12-month warranty service",
    complianceNotes: "Warranty 5 yr parts. ARC L188734 on install.",
  });
  const burleighHome = await site(
    burleigh.id,
    "31 The Esplanade",
    "Burleigh Heads",
    "4220",
    "QLD",
    CustomerType.RESIDENTIAL,
    {
      outdoorUnit: "Roof — existing ducted outdoor",
      isolatorLocation: "Garage board",
      indoorHeads: "Ducted 12.5kW, 5 zones",
      refrigerantType: "R410A",
      mountNotes: "Roof walk, salt air — quote new R32 ducted",
      filterDates: "Return filter overdue",
    },
  );
  const robinaOffice = await site(robina.id, "14 Markeri Street", "Robina", "4226", "QLD", CustomerType.COMMERCIAL, {
    label: "Level 1 suite",
    outdoorUnit: "Roof VRV",
    isolatorLocation: "Level 1 comms cupboard",
    indoorHeads: "4 cassettes",
    refrigerantType: "R32",
    filterDates: "Commercial plan — every 3 months",
  });

  await prisma.counter.createMany({
    data: [
      { key: "customer", value: 1010 },
      { key: "job", value: 2140 },
      { key: "quote", value: 340 },
      { key: "invoice", value: 188 },
    ],
  });

  type JobSeed = {
    jobNumber: string;
    customerId: string;
    propertyId: string;
    assignedToId?: string;
    status: JobStatus;
    priority: JobPriority;
    emergency?: boolean;
    category: ServiceCategory;
    title: string;
    description: string;
    appointmentStart?: Date;
    appointmentEnd?: Date;
    windowLabel?: string;
    labourHours?: number;
    materialsCost?: number;
    completedAt?: Date;
    nextFollowUpAt?: Date;
    recommendations?: string;
    warrantyMonths?: number;
    createdAt?: Date;
    quoteId?: string;
  };

  async function makeJob(seed: JobSeed) {
    const labourHours = seed.labourHours ?? 2;
    const materialsCost = seed.materialsCost ?? 80;
    const totals = calcTotals({ labourHours, labourRate: RATE, materialsCost, otherCost: 0 });
    return prisma.job.create({
      data: {
        jobNumber: seed.jobNumber,
        customerId: seed.customerId,
        propertyId: seed.propertyId,
        assignedToId: seed.assignedToId,
        createdById: maya.id,
        quoteId: seed.quoteId,
        status: seed.status,
        priority: seed.priority,
        emergency: seed.emergency ?? seed.priority === JobPriority.EMERGENCY,
        category: seed.category,
        title: seed.title,
        description: seed.description,
        appointmentStart: seed.appointmentStart,
        appointmentEnd: seed.appointmentEnd,
        windowLabel: seed.windowLabel,
        labourHours,
        labourRate: RATE,
        materialsCost,
        gstAmount: totals.gstAmount,
        totalIncGst: totals.totalIncGst,
        marginPercent: 28,
        completedAt: seed.completedAt,
        nextFollowUpAt: seed.nextFollowUpAt,
        recommendations: seed.recommendations,
        warrantyMonths: seed.warrantyMonths,
        createdAt: seed.createdAt ?? subDays(now, 2),
        statusHistory: { create: { to: seed.status, note: "Seeded workflow state" } },
      },
    });
  }

  const quoteJun = await prisma.quote.create({
    data: {
      quoteNumber: "Q-0321",
      status: QuoteStatus.SENT,
      category: ServiceCategory.SPLIT_INSTALL,
      title: "Replace living split — 7.1kW R32",
      introduction: "Remove ageing Fujitsu, reclaim R410A, install Mitsubishi 7.1kW R32 on existing brackets.",
      validUntil: addDays(now, 14),
      labourHours: 6,
      labourRate: RATE,
      materialsCost: 2480,
      gstAmount: calcTotals({ labourHours: 6, labourRate: RATE, materialsCost: 2480, otherCost: 0 }).gstAmount,
      totalIncGst: calcTotals({ labourHours: 6, labourRate: RATE, materialsCost: 2480, otherCost: 0 }).totalIncGst,
      notes: "Includes reclaim, disposal and commissioning. Does not include plaster patching.",
      sentAt: subDays(now, 4),
      customerId: jun.id,
      propertyId: junHome.id,
      createdById: sophie.id,
      lineItems: {
        create: [
          { description: "Mitsubishi 7.1kW R32 split supply", quantity: 1, unitPrice: 2280, sortOrder: 1 },
          { description: "Labour — isolate, reclaim, swap, commission", quantity: 6, unitPrice: RATE, sortOrder: 2 },
          { description: "Refrigerant reclaim and old unit disposal", quantity: 1, unitPrice: 200, sortOrder: 3 },
        ],
      },
    },
  });

  const quoteMedical = await prisma.quote.create({
    data: {
      quoteNumber: "Q-0328",
      status: QuoteStatus.APPROVED,
      category: ServiceCategory.COMMERCIAL_MAINTENANCE,
      title: "Clinic cassette service + waiting room filter",
      introduction: "Quarterly commercial service on three cassettes, coil clean and condensate check.",
      validUntil: addDays(now, 21),
      labourHours: 4,
      labourRate: RATE,
      materialsCost: 180,
      gstAmount: calcTotals({ labourHours: 4, labourRate: RATE, materialsCost: 180, otherCost: 0 }).gstAmount,
      totalIncGst: calcTotals({ labourHours: 4, labourRate: RATE, materialsCost: 180, otherCost: 0 }).totalIncGst,
      approvedAt: subDays(now, 1),
      customerId: medical.id,
      propertyId: medicalSite.id,
      createdById: sophie.id,
    },
  });

  const quoteBurleigh = await prisma.quote.create({
    data: {
      quoteNumber: "Q-0330",
      status: QuoteStatus.DRAFT,
      category: ServiceCategory.DUCTED_INSTALL,
      title: "Ducted replacement — 12.5kW R32",
      introduction: "Replace ageing roof ducted with a zoned R32 system. Site visit completed.",
      validUntil: addDays(now, 21),
      labourHours: 14,
      labourRate: RATE,
      materialsCost: 7800,
      gstAmount: calcTotals({ labourHours: 14, labourRate: RATE, materialsCost: 7800, otherCost: 0 }).gstAmount,
      totalIncGst: calcTotals({ labourHours: 14, labourRate: RATE, materialsCost: 7800, otherCost: 0 }).totalIncGst,
      customerId: burleigh.id,
      propertyId: burleighHome.id,
      createdById: kai.id,
    },
  });

  await makeJob({
    jobNumber: "J-2128",
    customerId: tanya.id,
    propertyId: tanyaHome.id,
    assignedToId: kai.id,
    status: JobStatus.PAID,
    priority: JobPriority.NORMAL,
    category: ServiceCategory.SPLIT_INSTALL,
    title: "Remove and replace split — Pacific Pines",
    description: "Swap existing split for a larger 7.1kW. Customer compared quotes; Kaizen was cheaper with a bigger system.",
    completedAt: subMonths(now, 8),
    warrantyMonths: 60,
    recommendations: "12-month filter service before next summer.",
    labourHours: 6,
    materialsCost: 2100,
  });
  await makeJob({
    jobNumber: "J-2130",
    customerId: tugun.id,
    propertyId: tugunHome.id,
    assignedToId: kai.id,
    status: JobStatus.PAID,
    priority: JobPriority.NORMAL,
    category: ServiceCategory.SPLIT_INSTALL,
    title: "New 5.0kW living split — Tugun",
    description: "Supply and install Panasonic R32, condensate to garden, isolator labelled.",
    completedAt: subMonths(now, 2),
    warrantyMonths: 60,
    nextFollowUpAt: addMonths(now, 10),
    labourHours: 5,
    materialsCost: 1680,
  });
  await makeJob({
    jobNumber: "J-2132",
    customerId: cafe.id,
    propertyId: cafeSite.id,
    assignedToId: jordan.id,
    status: JobStatus.COMPLETED,
    priority: JobPriority.HIGH,
    category: ServiceCategory.SERVICE,
    title: "Kitchen split filter + coil clean",
    description: "Grease-laden filters. Coil clean and outdoor rinse for salt air.",
    completedAt: subDays(now, 3),
    recommendations: "Monthly kitchen filter; 6-month dining cassette.",
    labourHours: 2,
    materialsCost: 40,
  });
  await makeJob({
    jobNumber: "J-2134",
    customerId: medical.id,
    propertyId: medicalSite.id,
    assignedToId: tom.id,
    status: JobStatus.SCHEDULED,
    priority: JobPriority.NORMAL,
    category: ServiceCategory.COMMERCIAL_MAINTENANCE,
    title: "Quarterly clinic cassette service",
    description: "After-hours window. Three cassettes, condensate trays, filters.",
    appointmentStart: at(today, 17, 30),
    appointmentEnd: at(today, 20, 0),
    windowLabel: "17:30–20:00",
    quoteId: quoteMedical.id,
    labourHours: 4,
    materialsCost: 180,
  });
  await makeJob({
    jobNumber: "J-2135",
    customerId: jun.id,
    propertyId: junHome.id,
    assignedToId: jordan.id,
    status: JobStatus.QUOTE_SENT,
    priority: JobPriority.NORMAL,
    category: ServiceCategory.SPLIT_INSTALL,
    title: "Quote follow-up — noisy outdoor Fujitsu",
    description: "Customer waiting on 7.1kW replacement quote Q-0321.",
    quoteId: quoteJun.id,
  });
  await makeJob({
    jobNumber: "J-2136",
    customerId: kingscliff.id,
    propertyId: kingscliffHome.id,
    assignedToId: riley.id,
    status: JobStatus.ON_THE_WAY,
    priority: JobPriority.NORMAL,
    category: ServiceCategory.SERVICE,
    title: "Holiday let — 6-month filter service",
    description: "Lockbox access. Three indoor heads, deck outdoor.",
    appointmentStart: at(today, 9, 0),
    appointmentEnd: at(today, 11, 0),
    windowLabel: "09:00–11:00",
  });
  await makeJob({
    jobNumber: "J-2137",
    customerId: saltwater.id,
    propertyId: varsityTenancy.id,
    assignedToId: riley.id,
    status: JobStatus.IN_PROGRESS,
    priority: JobPriority.HIGH,
    category: ServiceCategory.REPAIR,
    title: "Cassette not cooling — Tenancy B12",
    description: "No cool air. Check indoor coil, drain and outdoor isolator.",
    appointmentStart: at(today, 11, 30),
    emergency: false,
  });
  await makeJob({
    jobNumber: "J-2138",
    customerId: saltwater.id,
    propertyId: saltwaterOffice.id,
    assignedToId: tom.id,
    status: JobStatus.AWAITING_PARTS,
    priority: JobPriority.HIGH,
    category: ServiceCategory.REPAIR,
    title: "VRV indoor fan motor — Southport office",
    description: "Cassette 3 noisy. Fan motor on order.",
    labourHours: 3,
    materialsCost: 420,
  });
  await makeJob({
    jobNumber: "J-2139",
    customerId: cafe.id,
    propertyId: cafeSite.id,
    status: JobStatus.NEW_ENQUIRY,
    priority: JobPriority.EMERGENCY,
    emergency: true,
    category: ServiceCategory.REPAIR,
    title: "Dining cassette leaking onto seats",
    description: "Condensate overflow. Coolangatta lunch trade.",
  });
  await makeJob({
    jobNumber: "J-2140",
    customerId: burleigh.id,
    propertyId: burleighHome.id,
    status: JobStatus.SITE_VISIT_REQUIRED,
    priority: JobPriority.NORMAL,
    category: ServiceCategory.DUCTED_INSTALL,
    title: "Ducted replacement site measure",
    description: "Roof access and zone layout for Q-0330.",
    quoteId: quoteBurleigh.id,
  });
  await makeJob({
    jobNumber: "J-2141",
    customerId: strata.id,
    propertyId: strataSite.id,
    assignedToId: tom.id,
    status: JobStatus.PLUMBER_ASSIGNED,
    priority: JobPriority.NORMAL,
    category: ServiceCategory.COMMERCIAL_MAINTENANCE,
    title: "Banora Point strata quarterly",
    description: "Foyer cassette + gym split. NSW licence on van.",
    appointmentStart: addDays(at(today, 8, 0), 1),
    windowLabel: "Tomorrow AM",
  });
  await makeJob({
    jobNumber: "J-2142",
    customerId: robina.id,
    propertyId: robinaOffice.id,
    assignedToId: jordan.id,
    status: JobStatus.READY_TO_INVOICE,
    priority: JobPriority.NORMAL,
    category: ServiceCategory.CASSETTE_INSTALL,
    title: "Install cassette — Level 1 meeting room",
    description: "New cassette on existing VRV branch. Commissioned.",
    completedAt: subDays(now, 1),
    labourHours: 5,
    materialsCost: 1620,
  });
  await makeJob({
    jobNumber: "J-2143",
    customerId: tugun.id,
    propertyId: tugunHome.id,
    assignedToId: kai.id,
    status: JobStatus.CUSTOMER_FOLLOW_UP,
    priority: JobPriority.LOW,
    category: ServiceCategory.WARRANTY,
    title: "Warranty callback — condensate drip",
    description: "Minor drip after install. Check trap and fall.",
  });

  const invoiceCafe = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-0184",
      status: InvoiceStatus.SENT,
      customerId: cafe.id,
      propertyId: cafeSite.id,
      issuedAt: subDays(now, 2),
      dueAt: addDays(now, 12),
      labourHours: 2,
      labourRate: RATE,
      materialsCost: 40,
      gstAmount: calcTotals({ labourHours: 2, labourRate: RATE, materialsCost: 40, otherCost: 0 }).gstAmount,
      totalIncGst: calcTotals({ labourHours: 2, labourRate: RATE, materialsCost: 40, otherCost: 0 }).totalIncGst,
      notes: "Kitchen filter and coil clean.",
    },
  });
  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-0182",
      status: InvoiceStatus.PAID,
      customerId: tugun.id,
      propertyId: tugunHome.id,
      issuedAt: subMonths(now, 2),
      dueAt: subMonths(now, 1),
      paidAt: subMonths(now, 1),
      labourHours: 5,
      labourRate: RATE,
      materialsCost: 1680,
      amountPaid: calcTotals({ labourHours: 5, labourRate: RATE, materialsCost: 1680, otherCost: 0 }).totalIncGst,
      gstAmount: calcTotals({ labourHours: 5, labourRate: RATE, materialsCost: 1680, otherCost: 0 }).gstAmount,
      totalIncGst: calcTotals({ labourHours: 5, labourRate: RATE, materialsCost: 1680, otherCost: 0 }).totalIncGst,
    },
  });
  await prisma.payment.create({
    data: {
      invoiceId: invoiceCafe.id,
      amount: 50,
      method: "card",
      notes: "Part payment",
    },
  });

  await prisma.maintenancePlan.createMany({
    data: [
      {
        name: "Pacific Pines split — 12-month service",
        type: MaintenancePlanType.ANNUAL,
        intervalMonths: 12,
        nextDueAt: addMonths(now, 4),
        customerId: tanya.id,
        propertyId: tanyaHome.id,
        notes: "Filter clean + performance check before summer.",
      },
      {
        name: "Kingscliff holiday let — 6-monthly",
        type: MaintenancePlanType.SIX_MONTHLY,
        intervalMonths: 6,
        nextDueAt: addMonths(now, 5),
        customerId: kingscliff.id,
        propertyId: kingscliffHome.id,
      },
      {
        name: "Elanora clinic — quarterly cassettes",
        type: MaintenancePlanType.COMMERCIAL,
        intervalMonths: 3,
        nextDueAt: addMonths(now, 2),
        customerId: medical.id,
        propertyId: medicalSite.id,
      },
      {
        name: "Saltwater PM portfolio",
        type: MaintenancePlanType.PM_PORTFOLIO,
        intervalMonths: 3,
        nextDueAt: addDays(now, 18),
        customerId: saltwater.id,
        propertyId: saltwaterOffice.id,
      },
      {
        name: "Tugun warranty service",
        type: MaintenancePlanType.ANNUAL,
        intervalMonths: 12,
        nextDueAt: addMonths(now, 10),
        customerId: tugun.id,
        propertyId: tugunHome.id,
        notes: "First warranty service after install.",
      },
    ],
  });

  await prisma.followUp.createMany({
    data: [
      {
        title: "Tanya — 12-month split service",
        status: FollowUpStatus.PENDING,
        channel: FollowUpChannel.SMS,
        dueAt: addDays(now, 2),
        customerId: tanya.id,
        assignedToId: sophie.id,
        body: "Hi Tanya, it's Kaizen Coastal. Your Pacific Pines split is due for a 12-month filter service. Want a morning window?",
        requireApproval: true,
      },
      {
        title: "Jun — quote follow-up Q-0321",
        status: FollowUpStatus.AWAITING_APPROVAL,
        channel: FollowUpChannel.EMAIL,
        dueAt: today,
        customerId: jun.id,
        assignedToId: sophie.id,
        body: "Hi Jun, following up the 7.1kW replacement quote. GST included. Happy to lock an install day.",
        requireApproval: true,
      },
      {
        title: "Elena — Kingscliff 6-month service",
        status: FollowUpStatus.APPROVED,
        channel: FollowUpChannel.SMS,
        dueAt: today,
        customerId: kingscliff.id,
        assignedToId: sophie.id,
        body: "Hi Elena, it's Kaizen Coastal. Your Kingscliff heads are due a 6-month filter clean between guests. Reply YES to book.",
      },
      {
        title: "Coastline Cafe — kitchen monthly reminder",
        status: FollowUpStatus.PENDING,
        channel: FollowUpChannel.CALL,
        dueAt: addDays(now, 5),
        customerId: cafe.id,
        assignedToId: maya.id,
        body: "Call Owen about kitchen filter cadence and salt-air outdoor rinse.",
      },
    ],
  });

  await prisma.auditLog.create({
    data: {
      userId: kai.id,
      action: "seed",
      entityType: "Workspace",
      entityId: "demo",
      summary: "Demo workspace seeded with Gold Coast / Northern NSW air conditioning jobs.",
    },
  });

  console.log("Kaizen Coastal CRM demo data ready.");
  console.log(`Logins (password for all): ${PASSWORD}`);
  console.log("  kai@kaizencoastal.com.au     — Business owner");
  console.log("  office@kaizencoastal.com.au  — Office administrator");
  console.log("  tom@kaizencoastal.com.au     — Field supervisor");
  console.log("  jordan@kaizencoastal.com.au  — Technician");
  console.log("  riley@kaizencoastal.com.au   — Technician");
  console.log("  sophie@kaizencoastal.com.au  — Sales & follow-up");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
