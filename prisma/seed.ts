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
import { calcTotals } from "../lib/money";

const prisma = new PrismaClient();

const PASSWORD = "SuperbFlow1!";

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

  const anthony = await prisma.user.create({
    data: {
      email: "anthony@superbflowplumbing.com.au",
      passwordHash: hash,
      name: "Anthony Rossi",
      phone: "0412121772",
      role: Role.OWNER,
      avatarInitials: "AR",
      licenceNumber: "LPL-44821",
    },
  });
  const priya = await prisma.user.create({
    data: {
      email: "office@superbflowplumbing.com.au",
      passwordHash: hash,
      name: "Priya Nair",
      phone: "0390124401",
      role: Role.OFFICE_ADMIN,
      avatarInitials: "PN",
    },
  });
  const nathan = await prisma.user.create({
    data: {
      email: "nathan@superbflowplumbing.com.au",
      passwordHash: hash,
      name: "Nathan Blake",
      phone: "0410926968",
      role: Role.SUPERVISOR,
      avatarInitials: "NB",
      licenceNumber: "LPL-55210",
    },
  });
  const liam = await prisma.user.create({
    data: {
      email: "liam@superbflowplumbing.com.au",
      passwordHash: hash,
      name: "Liam Chen",
      phone: "0413882104",
      role: Role.PLUMBER,
      avatarInitials: "LC",
      licenceNumber: "LPL-67119",
    },
  });
  const sam = await prisma.user.create({
    data: {
      email: "sam@superbflowplumbing.com.au",
      passwordHash: hash,
      name: "Sam Okonkwo",
      phone: "0432109844",
      role: Role.PLUMBER,
      avatarInitials: "SO",
      licenceNumber: "LPL-69002",
    },
  });
  const jess = await prisma.user.create({
    data: {
      email: "jess@superbflowplumbing.com.au",
      passwordHash: hash,
      name: "Jess Moretti",
      phone: "0401552983",
      role: Role.SALES,
      avatarInitials: "JM",
    },
  });

  await prisma.setting.createMany({
    data: [
      { key: "companyName", value: "SuperbFlow Plumbing" },
      { key: "abn", value: "12 345 678 901" },
      { key: "email", value: "Superbflowplumbing@gmail.com" },
      { key: "phonePrimary", value: "0412121772" },
      { key: "phoneSecondary", value: "0410926968" },
      { key: "followUpRequireApproval", value: "true" },
      { key: "defaultLabourRate", value: "120" },
      { key: "gstRate", value: "0.10" },
      { key: "timezone", value: "Australia/Melbourne" },
      { key: "integrations.xero", value: "disconnected" },
      { key: "integrations.myob", value: "disconnected" },
      { key: "integrations.sms", value: "stub" },
    ],
  });

  await prisma.template.createMany({
    data: [
      {
        key: "followup-sms-due",
        name: "Follow-up SMS — due",
        channel: FollowUpChannel.SMS,
        body: "Hi {{contactName}}, it's {{plumberName}} from SuperbFlow Plumbing. Your {{propertyAddress}} is coming due for a check on the {{service}} work we completed. Want us to lock in a time? Reply YES or call 0412 121 772.",
      },
      {
        key: "followup-email-due",
        name: "Follow-up email — due",
        channel: FollowUpChannel.EMAIL,
        subject: "Time for a quick check-in — {{propertyAddress}}",
        body: "Hi {{contactName}},\n\nNo drama — just a sensible next step. The {{service}} work at {{propertyAddress}} is coming due for a look-over so it keeps holding up.\n\nWe can sort a morning or afternoon window that suits.\n\nSuperbFlow Plumbing\n0412 121 772",
      },
      {
        key: "followup-call-script",
        name: "Follow-up call script",
        channel: FollowUpChannel.CALL,
        body: "Call {{contactName}} on {{phone}}. Mention the {{service}} at {{propertyAddress}} and offer a 6/9/12-month check. If they opt out, mark consent immediately.",
      },
      {
        key: "quote-cover",
        name: "Quote cover note",
        channel: FollowUpChannel.EMAIL,
        subject: "Quote {{quoteNumber}} — SuperbFlow Plumbing",
        body: "Hi {{contactName}},\n\nHere is a clear quote for the work at {{propertyAddress}}. GST is included. Happy to talk through the next sensible step.\n\nAnthony or Nathan — 0412 121 772 / 0410 926 968",
      },
    ],
  });

  const horizon = await prisma.customer.create({
    data: {
      customerNumber: "SF-1001",
      type: CustomerType.COMMERCIAL,
      name: "Horizon Property Group",
      contactName: "Melissa Hart",
      phone: "0396412200",
      email: "melissa.hart@horizonpg.com.au",
      billingStreet: "Level 8, 120 Collins Street",
      billingSuburb: "Melbourne",
      billingPostcode: "3000",
      preferredContact: "email",
      source: "Property manager referral",
      status: CustomerStatus.ACTIVE,
      accountManagerId: jess.id,
      accessInstructions: "Report to building managers. After-hours via Horizon duty phone.",
      preferredTimes: "Weekdays 7:00–16:00, avoid retail peak 11:30–13:30",
      notes: "Multi-site commercial portfolio. Invoices to accounts@horizonpg.com.au. 30-day terms.",
      lastJobAt: subDays(now, 18),
      nextFollowUpAt: addDays(now, 12),
    },
  });

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        customerNumber: "SF-1002",
        type: CustomerType.RESIDENTIAL,
        name: "Elena Papadopoulos",
        contactName: "Elena Papadopoulos",
        phone: "0412764301",
        email: "elena.p@example.com",
        billingStreet: "14 Banchory Avenue",
        billingSuburb: "Taylors Lakes",
        billingPostcode: "3038",
        preferredContact: "sms",
        source: "Google",
        status: CustomerStatus.ACTIVE,
        accountManagerId: anthony.id,
        accessInstructions: "Side gate code 1944. Dog is friendly — keep closed.",
        preferredTimes: "Mornings before 11",
        notes: "Hot water replaced 2025. Keep an eye on roof valley in winter.",
        lastJobAt: subMonths(now, 11),
        nextFollowUpAt: today,
      },
    }),
    prisma.customer.create({
      data: {
        customerNumber: "SF-1003",
        type: CustomerType.RESIDENTIAL,
        name: "Daniel & Mei Nguyen",
        contactName: "Daniel Nguyen",
        phone: "0428991103",
        email: "d.nguyen@example.com",
        billingStreet: "8 Mernda Court",
        billingSuburb: "Wheelers Hill",
        billingPostcode: "3150",
        preferredContact: "phone",
        source: "Repeat — neighbour referral",
        status: CustomerStatus.ACTIVE,
        accountManagerId: nathan.id,
        preferredTimes: "After 3pm weekdays, Saturday mornings",
        notes: "Family with young kids. Prefers text before arrival.",
        lastJobAt: subDays(now, 40),
        nextFollowUpAt: addDays(now, 3),
      },
    }),
    prisma.customer.create({
      data: {
        customerNumber: "SF-1004",
        type: CustomerType.COMMERCIAL,
        name: "Northside Medical Rooms",
        contactName: "Dr Kavita Shah",
        phone: "0393746610",
        email: "practice@northsidemedical.com.au",
        billingStreet: "22 Pascoe Vale Road",
        billingSuburb: "Moonee Ponds",
        billingPostcode: "3039",
        preferredContact: "email",
        source: "Website quote form",
        status: CustomerStatus.ACTIVE,
        accountManagerId: jess.id,
        accessInstructions: "Enter via staff carpark. Infection-control rules apply.",
        preferredTimes: "Before clinic opens (7:00) or Sundays",
        notes: "Sensitive site. No noisy work during consult hours.",
        lastJobAt: subDays(now, 6),
      },
    }),
    prisma.customer.create({
      data: {
        customerNumber: "SF-1005",
        type: CustomerType.INDUSTRIAL,
        name: "Westline Fabrication",
        contactName: "Troy McKenzie",
        phone: "0411557782",
        email: "troy@westlinefab.com.au",
        billingStreet: "41–49 Fitzgerald Road",
        billingSuburb: "Laverton North",
        billingPostcode: "3026",
        preferredContact: "phone",
        source: "Existing industrial account",
        status: CustomerStatus.ACTIVE,
        accountManagerId: nathan.id,
        accessInstructions: "Induct at gatehouse. Hi-vis, steel caps, site card.",
        preferredTimes: "Shutdown windows Friday 14:00+",
        notes: "Trade waste and compressed air lines. SWMS required.",
        lastJobAt: subDays(now, 4),
      },
    }),
    prisma.customer.create({
      data: {
        customerNumber: "SF-1006",
        type: CustomerType.RESIDENTIAL,
        name: "Amira Haddad",
        contactName: "Amira Haddad",
        phone: "0403882199",
        email: "amira.haddad@example.com",
        billingStreet: "3 Rachelle Road",
        billingSuburb: "Keilor East",
        billingPostcode: "3033",
        preferredContact: "phone",
        source: "24/7 emergency call",
        status: CustomerStatus.ACTIVE,
        accountManagerId: anthony.id,
        accessInstructions: "Call on arrival. Street parking only.",
        notes: "Burst pipe last night — emergency.",
        lastJobAt: now,
      },
    }),
    prisma.customer.create({
      data: {
        customerNumber: "SF-1007",
        type: CustomerType.RESIDENTIAL,
        name: "Owen Gallagher",
        contactName: "Owen Gallagher",
        phone: "0433765408",
        email: "owen.g@example.com",
        billingStreet: "55 Surrey Road",
        billingSuburb: "Blackburn",
        billingPostcode: "3130",
        preferredContact: "email",
        source: "Hipages",
        status: CustomerStatus.PROSPECT,
        marketingConsent: true,
        accountManagerId: jess.id,
        notes: "New enquiry — leaking ensuite.",
      },
    }),
    prisma.customer.create({
      data: {
        customerNumber: "SF-1008",
        type: CustomerType.COMMERCIAL,
        name: "Bar Luca Footscray",
        contactName: "Sofia Ricci",
        phone: "0419002284",
        email: "sofia@barluca.com.au",
        billingStreet: "412 Barkly Street",
        billingSuburb: "Footscray",
        billingPostcode: "3011",
        preferredContact: "sms",
        source: "Walk-in / previous grease trap work",
        status: CustomerStatus.ACTIVE,
        accountManagerId: liam.id,
        preferredTimes: "Before 10:00 or after close 21:30",
        lastJobAt: subMonths(now, 6),
        nextFollowUpAt: addDays(now, 1),
      },
    }),
    prisma.customer.create({
      data: {
        customerNumber: "SF-1009",
        type: CustomerType.RESIDENTIAL,
        name: "Helen Crowe",
        contactName: "Helen Crowe",
        phone: "0422331098",
        email: "helen.crowe@example.com",
        billingStreet: "19 Glendale Court",
        billingSuburb: "Sunbury",
        billingPostcode: "3429",
        preferredContact: "phone",
        source: "Referral — Elena Papadopoulos",
        status: CustomerStatus.ACTIVE,
        marketingConsent: false,
        marketingOptOut: true,
        accountManagerId: jess.id,
        notes: "Opted out of marketing. Operational job comms only.",
        lastJobAt: subMonths(now, 9),
        nextFollowUpAt: addDays(now, 14),
      },
    }),
    prisma.customer.create({
      data: {
        customerNumber: "SF-1010",
        type: CustomerType.INDUSTRIAL,
        name: "Scoresby Cold Store",
        contactName: "Mark Pell",
        phone: "0397648800",
        email: "ops@scoresbycold.com.au",
        billingStreet: "8/70 Rushdale Street",
        billingSuburb: "Knoxfield",
        billingPostcode: "3180",
        preferredContact: "email",
        source: "Commercial tender",
        status: CustomerStatus.ACTIVE,
        accountManagerId: nathan.id,
        accessInstructions: "Cold-store PPE. Book via ops desk 24h prior.",
        lastJobAt: subDays(now, 90),
      },
    }),
  ]);

  const [elena, nguyens, medical, westline, amira, owen, barLuca, helen, coldStore] =
    customers;

  const horizonSites = await Promise.all([
    prisma.property.create({
      data: {
        customerId: horizon.id,
        label: "Watergardens Plaza — tenancy B12",
        street: "399 Melton Highway",
        suburb: "Taylors Lakes",
        postcode: "3038",
        type: CustomerType.COMMERCIAL,
        siteContactName: "Building manager — Craig",
        siteContactPhone: "0412777001",
        propertyManager: "Melissa Hart, Horizon PG",
        accessNotes: "Loading dock B. After hours via security.",
        parkingNotes: "Contractor bays behind Coles.",
        keysLockbox: "Site office holds keys.",
        fixtures: "2 amenities, grease-prone food tenancy next door.",
        complianceNotes: "Backflow test due annually.",
        recommendations: "Six-monthly amenities and roof drain check.",
      },
    }),
    prisma.property.create({
      data: {
        customerId: horizon.id,
        label: "Glen Waverley office — Level 2",
        street: "1 Kingsway",
        suburb: "Glen Waverley",
        postcode: "3150",
        type: CustomerType.COMMERCIAL,
        siteContactName: "Reception",
        siteContactPhone: "0385621100",
        propertyManager: "Melissa Hart, Horizon PG",
        accessNotes: "Sign in at lobby.",
        hotWaterSystem: "Rheem commercial 315L — plant room",
        roofingDrainage: "Box gutter overflow recently cleared.",
      },
    }),
    prisma.property.create({
      data: {
        customerId: horizon.id,
        label: "Essendon warehouse unit 4",
        street: "26 English Street",
        suburb: "Essendon Fields",
        postcode: "3041",
        type: CustomerType.INDUSTRIAL,
        siteContactName: "Yard lead — Paul",
        siteContactPhone: "0433888122",
        propertyManager: "Melissa Hart, Horizon PG",
        accessNotes: "Induct at gate. Forklift traffic.",
        petsHazards: "Moving plant. Isolation required for drain work.",
        complianceNotes: "Trade waste agreement on file.",
      },
    }),
    prisma.property.create({
      data: {
        customerId: horizon.id,
        label: "CBD retail — Little Collins",
        street: "271 Little Collins Street",
        suburb: "Melbourne",
        postcode: "3000",
        type: CustomerType.COMMERCIAL,
        siteContactName: "Store lead",
        propertyManager: "Melissa Hart, Horizon PG",
        accessNotes: "No street parking. Load via lane 6am–8am.",
        parkingNotes: "Wilson car park — claim via Horizon.",
      },
    }),
  ]);

  async function home(
    customerId: string,
    street: string,
    suburb: string,
    postcode: string,
    type: CustomerType,
    extra: Record<string, string> = {},
  ) {
    return prisma.property.create({
      data: {
        customerId,
        label: "Primary site",
        street,
        suburb,
        postcode,
        type,
        ...extra,
      },
    });
  }

  const elenaHome = await home(elena.id, "14 Banchory Avenue", "Taylors Lakes", "3038", CustomerType.RESIDENTIAL, {
    accessNotes: "Side gate 1944. Owner often WFH.",
    petsHazards: "Friendly kelpie — keep in backyard.",
    waterMeter: "Front left, under flap.",
    shutOffLocation: "Meter + under-stair cupboard.",
    hotWaterSystem: "Rinnai 26L continuous — 2025 install",
    gasNotes: "Natural gas, meter at side path.",
    roofingDrainage: "Colorbond, valley above ensuite.",
    fixtures: "3 bath, 2 kitchen, outdoor tap rear.",
    recommendations: "Roof valley inspect before next winter.",
  });
  const nguyenHome = await home(nguyens.id, "8 Mernda Court", "Wheelers Hill", "3150", CustomerType.RESIDENTIAL, {
    accessNotes: "Text 15 minutes out.",
    petsHazards: "None.",
    hotWaterSystem: "Storage 250L — ageing, quote replacement.",
    roofingDrainage: "Tile roof, moss on south pitch.",
  });
  const medicalSite = await home(medical.id, "22 Pascoe Vale Road", "Moonee Ponds", "3039", CustomerType.COMMERCIAL, {
    accessNotes: "Staff entry. Clinical waste area off-limits.",
    complianceNotes: "TMVs on public basins. Annual valve service.",
    fixtures: "4 consult rooms, staff kitchen, 2 public WCs.",
  });
  const westlineSite = await home(westline.id, "41–49 Fitzgerald Road", "Laverton North", "3026", CustomerType.INDUSTRIAL, {
    accessNotes: "Gatehouse induction. SWMS on file.",
    petsHazards: "Workshop noise, hot works nearby.",
    waterMeter: "Main at Fitzgerald boundary pit.",
    complianceNotes: "Backflow + trade waste.",
  });
  const amiraHome = await home(amira.id, "3 Rachelle Road", "Keilor East", "3033", CustomerType.RESIDENTIAL, {
    accessNotes: "Call on arrival.",
    shutOffLocation: "Front meter.",
    fixtures: "Single storey, 2 bath.",
  });
  const owenHome = await home(owen.id, "55 Surrey Road", "Blackburn", "3130", CustomerType.RESIDENTIAL, {
    accessNotes: "New customer — no prior access notes.",
  });
  const barSite = await home(barLuca.id, "412 Barkly Street", "Footscray", "3011", CustomerType.COMMERCIAL, {
    accessNotes: "Kitchen rear door after 9pm.",
    fixtures: "Commercial kitchen, grease trap, beer line sinks.",
    recommendations: "Quarterly grease trap and floor waste.",
  });
  const helenHome = await home(helen.id, "19 Glendale Court", "Sunbury", "3429", CustomerType.RESIDENTIAL, {
    accessNotes: "No marketing contact. Job comms only.",
    hotWaterSystem: "Electric storage.",
  });
  const coldSite = await home(coldStore.id, "8/70 Rushdale Street", "Knoxfield", "3180", CustomerType.INDUSTRIAL, {
    accessNotes: "Ops desk booking required.",
    petsHazards: "Cold rooms, slippery floors, forklifts.",
    complianceNotes: "Food-grade site. Sanitise tools.",
  });

  const elenaInvestment = await prisma.property.create({
    data: {
      customerId: elena.id,
      label: "Investment — Caroline Springs",
      street: "6 Brookfield Avenue",
      suburb: "Caroline Springs",
      postcode: "3023",
      type: CustomerType.RESIDENTIAL,
      siteContactName: "Tenant — Ravi",
      siteContactPhone: "0416002981",
      propertyManager: "Elena (self-managed)",
      accessNotes: "Tenant on site after 5pm.",
      recommendations: "Annual HW service.",
    },
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
    otherCost?: number;
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
    const otherCost = seed.otherCost ?? 0;
    const totals = calcTotals({
      labourHours,
      labourRate: 120,
      materialsCost,
      otherCost,
    });
    const job = await prisma.job.create({
      data: {
        jobNumber: seed.jobNumber,
        customerId: seed.customerId,
        propertyId: seed.propertyId,
        assignedToId: seed.assignedToId,
        createdById: priya.id,
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
        labourRate: 120,
        materialsCost,
        otherCost,
        gstAmount: totals.gstAmount,
        totalIncGst: totals.totalIncGst,
        marginPercent: 32,
        completedAt: seed.completedAt,
        nextFollowUpAt: seed.nextFollowUpAt,
        recommendations: seed.recommendations,
        warrantyMonths: seed.warrantyMonths,
        createdAt: seed.createdAt ?? subDays(now, 2),
        statusHistory: {
          create: { to: seed.status, note: "Seeded workflow state" },
        },
      },
    });
    return job;
  }

  const quoteHw = await prisma.quote.create({
    data: {
      quoteNumber: "Q-0321",
      status: QuoteStatus.SENT,
      category: ServiceCategory.GENERAL_PLUMBING,
      title: "Hot water storage replacement",
      introduction: "Replace ageing 250L storage with a 26L continuous unit and reconnect existing gas.",
      validUntil: addDays(now, 14),
      labourHours: 6,
      labourRate: 120,
      materialsCost: 1680,
      gstAmount: calcTotals({ labourHours: 6, labourRate: 120, materialsCost: 1680, otherCost: 0 }).gstAmount,
      totalIncGst: calcTotals({ labourHours: 6, labourRate: 120, materialsCost: 1680, otherCost: 0 }).totalIncGst,
      notes: "Includes disposal of old cylinder. Does not include plaster repairs.",
      sentAt: subDays(now, 4),
      customerId: nguyens.id,
      propertyId: nguyenHome.id,
      createdById: jess.id,
      lineItems: {
        create: [
          { description: "Rinnai 26L continuous hot water", quantity: 1, unitPrice: 1480, sortOrder: 1 },
          { description: "Labour — isolate, swap, commission", quantity: 6, unitPrice: 120, sortOrder: 2 },
          { description: "Fittings, flue and disposal", quantity: 1, unitPrice: 200, sortOrder: 3 },
        ],
      },
    },
  });

  const quoteMedical = await prisma.quote.create({
    data: {
      quoteNumber: "Q-0328",
      status: QuoteStatus.APPROVED,
      category: ServiceCategory.MAINTENANCE,
      title: "TMV service + staff kitchen tapware",
      introduction: "Annual thermostatic mixing valve service and replace two leaking staff kitchen mixers.",
      validUntil: addDays(now, 21),
      labourHours: 4,
      labourRate: 140,
      materialsCost: 340,
      gstAmount: calcTotals({ labourHours: 4, labourRate: 140, materialsCost: 340, otherCost: 0 }).gstAmount,
      totalIncGst: calcTotals({ labourHours: 4, labourRate: 140, materialsCost: 340, otherCost: 0 }).totalIncGst,
      approvedAt: subDays(now, 1),
      customerId: medical.id,
      propertyId: medicalSite.id,
      createdById: jess.id,
    },
  });

  const quoteOwen = await prisma.quote.create({
    data: {
      quoteNumber: "Q-0330",
      status: QuoteStatus.DRAFT,
      category: ServiceCategory.GENERAL_PLUMBING,
      title: "Ensuite leak investigation",
      introduction: "Open ceiling, trace leak from shower waste, report and quote repair.",
      labourHours: 2,
      labourRate: 120,
      materialsCost: 0,
      gstAmount: calcTotals({ labourHours: 2, labourRate: 120, materialsCost: 0, otherCost: 0 }).gstAmount,
      totalIncGst: calcTotals({ labourHours: 2, labourRate: 120, materialsCost: 0, otherCost: 0 }).totalIncGst,
      customerId: owen.id,
      propertyId: owenHome.id,
      createdById: jess.id,
    },
  });

  const quoteHorizon = await prisma.quote.create({
    data: {
      quoteNumber: "Q-0319",
      status: QuoteStatus.FOLLOW_UP,
      category: ServiceCategory.ROOFING,
      title: "Box gutter overflow upgrade — Glen Waverley",
      introduction: "Upgrade overflow and add leaf guard to Level 2 box gutter.",
      validUntil: addDays(now, 7),
      labourHours: 8,
      labourRate: 130,
      materialsCost: 920,
      gstAmount: calcTotals({ labourHours: 8, labourRate: 130, materialsCost: 920, otherCost: 0 }).gstAmount,
      totalIncGst: calcTotals({ labourHours: 8, labourRate: 130, materialsCost: 920, otherCost: 0 }).totalIncGst,
      sentAt: subDays(now, 10),
      customerId: horizon.id,
      propertyId: horizonSites[1].id,
      createdById: anthony.id,
    },
  });

  const jobs: Awaited<ReturnType<typeof makeJob>>[] = [];

  jobs.push(
    await makeJob({
      jobNumber: "J-2101",
      customerId: amira.id,
      propertyId: amiraHome.id,
      assignedToId: anthony.id,
      status: JobStatus.ON_THE_WAY,
      priority: JobPriority.EMERGENCY,
      emergency: true,
      category: ServiceCategory.GENERAL_PLUMBING,
      title: "Burst pipe — kitchen supply",
      description: "Customer reported water pouring from kitchen cupboard at 02:10. Isolate and repair copper.",
      appointmentStart: at(today, 7, 30),
      appointmentEnd: at(today, 9, 30),
      windowLabel: "Emergency now",
      labourHours: 3,
      materialsCost: 160,
    }),
    await makeJob({
      jobNumber: "J-2102",
      customerId: horizon.id,
      propertyId: horizonSites[0].id,
      assignedToId: liam.id,
      status: JobStatus.SCHEDULED,
      priority: JobPriority.HIGH,
      category: ServiceCategory.DRAINAGE,
      title: "Amenities floor waste backing up",
      description: "Tenancy B12 amenities slow and odour. Jet and CCTV if needed.",
      appointmentStart: at(today, 10, 0),
      appointmentEnd: at(today, 12, 0),
      windowLabel: "10:00–12:00",
      labourHours: 2.5,
      materialsCost: 90,
    }),
    await makeJob({
      jobNumber: "J-2103",
      customerId: westline.id,
      propertyId: westlineSite.id,
      assignedToId: sam.id,
      status: JobStatus.IN_PROGRESS,
      priority: JobPriority.HIGH,
      category: ServiceCategory.GENERAL_PLUMBING,
      title: "Workshop eyewash station isolation valve",
      description: "Replace seized isolation valve on eyewash loop during Friday window. Carry over to today.",
      appointmentStart: at(today, 13, 0),
      appointmentEnd: at(today, 16, 0),
      windowLabel: "13:00–16:00",
      labourHours: 3,
      materialsCost: 210,
    }),
    await makeJob({
      jobNumber: "J-2104",
      customerId: owen.id,
      propertyId: owenHome.id,
      status: JobStatus.NEW_ENQUIRY,
      priority: JobPriority.NORMAL,
      category: ServiceCategory.GENERAL_PLUMBING,
      title: "Ensuite leak — new enquiry",
      description: "Water staining on ceiling below ensuite. Customer wants a site visit this week.",
      createdAt: subDays(now, 0),
    }),
    await makeJob({
      jobNumber: "J-2105",
      customerId: medical.id,
      propertyId: medicalSite.id,
      status: JobStatus.TRIAGE_REQUIRED,
      priority: JobPriority.HIGH,
      category: ServiceCategory.GAS_FITTING,
      title: "Intermittent smell near plant room",
      description: "Staff reported faint gas odour near plant room Friday. Needs triage before clinic Monday.",
    }),
    await makeJob({
      jobNumber: "J-2106",
      customerId: horizon.id,
      propertyId: horizonSites[3].id,
      status: JobStatus.APPROVED,
      priority: JobPriority.NORMAL,
      category: ServiceCategory.GENERAL_PLUMBING,
      title: "Retail basin mixer replacement",
      description: "Approved works — replace two public basin mixers after hours.",
      labourHours: 2,
      materialsCost: 280,
    }),
    await makeJob({
      jobNumber: "J-2107",
      customerId: medical.id,
      propertyId: medicalSite.id,
      status: JobStatus.APPROVED,
      priority: JobPriority.NORMAL,
      category: ServiceCategory.MAINTENANCE,
      title: "TMV service + staff kitchen tapware",
      description: "Quote Q-0328 approved. Ready to schedule Sunday morning.",
      quoteId: quoteMedical.id,
      labourHours: 4,
      materialsCost: 340,
    }),
    await makeJob({
      jobNumber: "J-2108",
      customerId: barLuca.id,
      propertyId: barSite.id,
      assignedToId: liam.id,
      status: JobStatus.AWAITING_PARTS,
      priority: JobPriority.NORMAL,
      category: ServiceCategory.DRAINAGE,
      title: "Grease trap lid and gasket",
      description: "Trap pumped. Waiting on replacement lid gasket from supplier.",
      appointmentStart: subDays(today, 1),
      labourHours: 2,
      materialsCost: 140,
    }),
    await makeJob({
      jobNumber: "J-2088",
      customerId: elena.id,
      propertyId: elenaHome.id,
      assignedToId: nathan.id,
      status: JobStatus.COMPLETED,
      priority: JobPriority.NORMAL,
      category: ServiceCategory.ROOFING,
      title: "Roof valley leak — ensuite",
      description: "Resealed valley and checked overflow. Dry after hose test.",
      completedAt: subMonths(now, 11),
      nextFollowUpAt: today,
      recommendations: "Reinspect before winter. Consider leaf guard.",
      warrantyMonths: 12,
      labourHours: 4,
      materialsCost: 220,
      createdAt: subMonths(now, 11),
    }),
    await makeJob({
      jobNumber: "J-2091",
      customerId: helen.id,
      propertyId: helenHome.id,
      assignedToId: sam.id,
      status: JobStatus.PAID,
      priority: JobPriority.NORMAL,
      category: ServiceCategory.GENERAL_PLUMBING,
      title: "Blocked outdoor drain",
      description: "Cleared stormwater pit. Customer opted out of marketing follow-up.",
      completedAt: subMonths(now, 9),
      nextFollowUpAt: addDays(now, 14),
      warrantyMonths: 3,
      labourHours: 1.5,
      materialsCost: 40,
      createdAt: subMonths(now, 9),
    }),
    await makeJob({
      jobNumber: "J-2094",
      customerId: barLuca.id,
      propertyId: barSite.id,
      assignedToId: liam.id,
      status: JobStatus.PAID,
      priority: JobPriority.NORMAL,
      category: ServiceCategory.MAINTENANCE,
      title: "Kitchen floor waste service",
      description: "Quarterly clean and sanitise. Recommended grease trap lid.",
      completedAt: subMonths(now, 6),
      nextFollowUpAt: addDays(now, 1),
      labourHours: 2,
      materialsCost: 70,
      createdAt: subMonths(now, 6),
    }),
    await makeJob({
      jobNumber: "J-2099",
      customerId: horizon.id,
      propertyId: horizonSites[2].id,
      assignedToId: sam.id,
      status: JobStatus.READY_TO_INVOICE,
      priority: JobPriority.NORMAL,
      category: ServiceCategory.DRAINAGE,
      title: "Warehouse trade waste line camera",
      description: "CCTV and jet of unit 4 trade line. Report attached as placeholder.",
      completedAt: subDays(now, 3),
      labourHours: 5,
      materialsCost: 180,
    }),
    await makeJob({
      jobNumber: "J-2097",
      customerId: coldStore.id,
      propertyId: coldSite.id,
      assignedToId: nathan.id,
      status: JobStatus.INVOICED,
      priority: JobPriority.HIGH,
      category: ServiceCategory.GENERAL_PLUMBING,
      title: "Wash-down hose reel upgrade",
      description: "Replaced cracked reel and isolation. Awaiting payment.",
      completedAt: subDays(now, 20),
      labourHours: 4,
      materialsCost: 460,
      createdAt: subDays(now, 22),
    }),
    await makeJob({
      jobNumber: "J-2082",
      customerId: elena.id,
      propertyId: elenaInvestment.id,
      assignedToId: liam.id,
      status: JobStatus.PAID,
      priority: JobPriority.NORMAL,
      category: ServiceCategory.GAS_FITTING,
      title: "Cooktop bayonet and leak test",
      description: "New bayonet, leak test passed, certificate issued.",
      completedAt: subMonths(now, 5),
      nextFollowUpAt: addMonths(now, 7),
      warrantyMonths: 12,
      labourHours: 2,
      materialsCost: 95,
      createdAt: subMonths(now, 5),
    }),
    await makeJob({
      jobNumber: "J-2075",
      customerId: westline.id,
      propertyId: westlineSite.id,
      assignedToId: nathan.id,
      status: JobStatus.PAID,
      priority: JobPriority.URGENT,
      category: ServiceCategory.GAS_FITTING,
      title: "Heater flue safety check",
      description: "Industrial unit flue inspection and CO check. Passed.",
      completedAt: subMonths(now, 2),
      nextFollowUpAt: addMonths(now, 10),
      labourHours: 3,
      materialsCost: 0,
      createdAt: subMonths(now, 2),
    }),
    await makeJob({
      jobNumber: "J-2109",
      customerId: nguyens.id,
      propertyId: nguyenHome.id,
      assignedToId: sam.id,
      status: JobStatus.PLUMBER_ASSIGNED,
      priority: JobPriority.NORMAL,
      category: ServiceCategory.GENERAL_PLUMBING,
      title: "Cistern inlet valve — downstairs WC",
      description: "Running cistern. Parts on van. Assigned to Sam for tomorrow morning.",
      appointmentStart: at(addDays(today, 1), 8, 0),
      appointmentEnd: at(addDays(today, 1), 9, 30),
      windowLabel: "08:00–09:30",
      labourHours: 1,
      materialsCost: 45,
    }),
    await makeJob({
      jobNumber: "J-2110",
      customerId: horizon.id,
      propertyId: horizonSites[1].id,
      status: JobStatus.SITE_VISIT_REQUIRED,
      priority: JobPriority.NORMAL,
      category: ServiceCategory.ROOFING,
      title: "Box gutter — confirm measurements",
      description: "Need site measure before locking Q-0319 materials.",
    }),
    await makeJob({
      jobNumber: "J-2070",
      customerId: medical.id,
      propertyId: medicalSite.id,
      assignedToId: liam.id,
      status: JobStatus.PAID,
      priority: JobPriority.NORMAL,
      category: ServiceCategory.MAINTENANCE,
      title: "Annual TMV service 2025",
      description: "All four TMVs serviced and tagged.",
      completedAt: subMonths(now, 12),
      nextFollowUpAt: subDays(now, 2),
      labourHours: 3,
      materialsCost: 120,
      createdAt: subMonths(now, 12),
    }),
  );

  const jobByNumber = Object.fromEntries(jobs.map((j) => [j.jobNumber, j]));

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-0179",
      status: InvoiceStatus.OVERDUE,
      issuedAt: subDays(now, 28),
      dueAt: subDays(now, 7),
      labourHours: 4,
      labourRate: 120,
      materialsCost: 460,
      gstAmount: jobByNumber["J-2097"].gstAmount,
      totalIncGst: jobByNumber["J-2097"].totalIncGst,
      amountPaid: 0,
      notes: "Sent to ops@scoresbycold.com.au. Follow accounts Tuesday.",
      customerId: coldStore.id,
      propertyId: coldSite.id,
      jobId: jobByNumber["J-2097"].id,
      lineItems: {
        create: [
          { description: "Wash-down hose reel and isolation", quantity: 1, unitPrice: 460 },
          { description: "Labour", quantity: 4, unitPrice: 120 },
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-0184",
      status: InvoiceStatus.SENT,
      issuedAt: subDays(now, 6),
      dueAt: addDays(now, 24),
      labourHours: 5,
      labourRate: 120,
      materialsCost: 180,
      gstAmount: jobByNumber["J-2099"].gstAmount,
      totalIncGst: jobByNumber["J-2099"].totalIncGst,
      notes: "Ready once office confirms PO from Horizon.",
      customerId: horizon.id,
      propertyId: horizonSites[2].id,
      jobId: jobByNumber["J-2099"].id,
    },
  });

  const paidInv = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-0166",
      status: InvoiceStatus.PAID,
      issuedAt: subMonths(now, 5),
      dueAt: subMonths(now, 4),
      paidAt: subMonths(now, 4),
      labourHours: 2,
      labourRate: 120,
      materialsCost: 95,
      gstAmount: jobByNumber["J-2082"].gstAmount,
      totalIncGst: jobByNumber["J-2082"].totalIncGst,
      amountPaid: jobByNumber["J-2082"].totalIncGst,
      customerId: elena.id,
      propertyId: elenaInvestment.id,
      jobId: jobByNumber["J-2082"].id,
    },
  });
  await prisma.payment.create({
    data: {
      invoiceId: paidInv.id,
      amount: jobByNumber["J-2082"].totalIncGst,
      method: "Bank transfer",
      receivedAt: subMonths(now, 4),
      reference: "ELENA-2082",
    },
  });

  await prisma.maintenancePlan.createMany({
    data: [
      {
        name: "Horizon amenities + roof drains",
        type: MaintenancePlanType.PM_PORTFOLIO,
        intervalMonths: 6,
        nextDueAt: addDays(now, 5),
        lastDoneAt: subMonths(now, 6),
        notes: "Covers Watergardens B12 and Glen Waverley Level 2.",
        customerId: horizon.id,
        propertyId: horizonSites[0].id,
      },
      {
        name: "Bar Luca grease / floor waste",
        type: MaintenancePlanType.COMMERCIAL,
        intervalMonths: 3,
        nextDueAt: addDays(now, 1),
        lastDoneAt: subMonths(now, 3),
        customerId: barLuca.id,
        propertyId: barSite.id,
      },
      {
        name: "Papadopoulos roof & HW check",
        type: MaintenancePlanType.ANNUAL,
        intervalMonths: 12,
        nextDueAt: today,
        lastDoneAt: subMonths(now, 12),
        customerId: elena.id,
        propertyId: elenaHome.id,
      },
      {
        name: "Northside TMV program",
        type: MaintenancePlanType.SIX_MONTHLY,
        intervalMonths: 6,
        nextDueAt: addDays(now, 20),
        lastDoneAt: subMonths(now, 6),
        customerId: medical.id,
        propertyId: medicalSite.id,
      },
      {
        name: "Westline safety fixtures",
        type: MaintenancePlanType.CUSTOM,
        intervalMonths: 4,
        nextDueAt: addDays(now, 40),
        lastDoneAt: subMonths(now, 2),
        notes: "Eyewash, hose reels, trade waste.",
        customerId: westline.id,
        propertyId: westlineSite.id,
      },
    ],
  });

  await prisma.followUp.createMany({
    data: [
      {
        title: "Send SMS / email — roof valley check",
        status: FollowUpStatus.AWAITING_APPROVAL,
        channel: FollowUpChannel.SMS,
        sequenceStep: 3,
        dueAt: today,
        requireApproval: true,
        templateKey: "followup-sms-due",
        body: "Hi Elena, it's SuperbFlow. Your Taylors Lakes roof valley work is due for a 12-month check. Want us to lock a morning window?",
        customerId: elena.id,
        jobId: jobByNumber["J-2088"].id,
        assignedToId: jess.id,
      },
      {
        title: "Internal reminder — 30 days out (Helen — do not market)",
        status: FollowUpStatus.BLOCKED_OPT_OUT,
        channel: FollowUpChannel.INTERNAL,
        sequenceStep: 1,
        dueAt: addDays(now, 14),
        requireApproval: true,
        body: "Customer opted out. Do not send. Keep operational records only.",
        customerId: helen.id,
        jobId: jobByNumber["J-2091"].id,
        assignedToId: jess.id,
      },
      {
        title: "Call task — Bar Luca quarterly",
        status: FollowUpStatus.PENDING,
        channel: FollowUpChannel.CALL,
        sequenceStep: 4,
        dueAt: addDays(now, 1),
        body: "Call Sofia about grease trap lid and next quarterly.",
        customerId: barLuca.id,
        jobId: jobByNumber["J-2094"].id,
        assignedToId: jess.id,
      },
      {
        title: "Prepare message — Northside TMV",
        status: FollowUpStatus.PENDING,
        channel: FollowUpChannel.INTERNAL,
        sequenceStep: 2,
        dueAt: today,
        body: "Prepare email for Dr Shah — annual TMV cycle approaching.",
        customerId: medical.id,
        jobId: jobByNumber["J-2070"].id,
        assignedToId: jess.id,
      },
      {
        title: "Quote follow-up — Nguyen hot water",
        status: FollowUpStatus.PENDING,
        channel: FollowUpChannel.CALL,
        sequenceStep: 0,
        dueAt: today,
        body: "Call Daniel about Q-0321. Storage unit is ageing; offer Sunday install if approved.",
        customerId: nguyens.id,
        assignedToId: jess.id,
      },
      {
        title: "Horizon Q-0319 gutter upgrade",
        status: FollowUpStatus.PENDING,
        channel: FollowUpChannel.EMAIL,
        sequenceStep: 0,
        dueAt: addDays(now, 2),
        body: "Email Melissa with photos from last overflow and ask for PO.",
        customerId: horizon.id,
        assignedToId: jess.id,
      },
    ],
  });

  await prisma.communication.createMany({
    data: [
      {
        type: "PHONE",
        direction: "inbound",
        subject: "Emergency burst pipe",
        body: "Amira called Anthony at 02:14. Kitchen cupboard flooding. Isolated at meter. Booked first van.",
        customerId: amira.id,
        jobId: jobByNumber["J-2101"].id,
        userId: anthony.id,
        createdAt: at(today, 2, 14),
      },
      {
        type: "EMAIL",
        direction: "outbound",
        subject: "Quote Q-0321",
        body: "Sent hot water replacement quote to Daniel Nguyen.",
        customerId: nguyens.id,
        userId: jess.id,
        createdAt: subDays(now, 4),
      },
      {
        type: "NOTE",
        direction: "internal",
        subject: "Horizon PO pending",
        body: "Melissa asked to hold Little Collins mixer job until next Monday's site meeting.",
        customerId: horizon.id,
        jobId: jobByNumber["J-2106"].id,
        userId: priya.id,
        createdAt: subDays(now, 1),
      },
      {
        type: "SMS",
        direction: "outbound",
        subject: "On the way",
        body: "Liam texted Watergardens BM — 15 minutes out (demo).",
        customerId: horizon.id,
        jobId: jobByNumber["J-2102"].id,
        userId: liam.id,
        createdAt: at(today, 9, 40),
      },
    ],
  });

  await prisma.document.createMany({
    data: [
      {
        name: "Before — kitchen cupboard.jpg",
        kind: "PHOTO",
        placeholder: true,
        customerId: amira.id,
        jobId: jobByNumber["J-2101"].id,
      },
      {
        name: "Gas certificate — cooktop bayonet.pdf",
        kind: "COMPLIANCE",
        placeholder: true,
        customerId: elena.id,
        jobId: jobByNumber["J-2082"].id,
      },
      {
        name: "CCTV report — Horizon unit 4.pdf",
        kind: "OTHER",
        placeholder: true,
        customerId: horizon.id,
        jobId: jobByNumber["J-2099"].id,
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        action: "seed",
        entityType: "System",
        entityId: "demo",
        summary: "Demo workspace seeded with Melbourne customers, jobs and follow-ups.",
        userId: anthony.id,
      },
    ],
  });

  // Silence unused vars in seed construction
  void quoteHw;
  void quoteOwen;
  void quoteHorizon;
  void priya;
  void liam;

  console.log("SuperbFlow CRM demo data ready.");
  console.log("Logins (password for all): SuperbFlow1!");
  console.log("  anthony@superbflowplumbing.com.au  — Business owner");
  console.log("  office@superbflowplumbing.com.au   — Office administrator");
  console.log("  nathan@superbflowplumbing.com.au   — Plumbing supervisor");
  console.log("  liam@superbflowplumbing.com.au     — Plumber");
  console.log("  sam@superbflowplumbing.com.au      — Plumber");
  console.log("  jess@superbflowplumbing.com.au     — Sales & follow-up");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
