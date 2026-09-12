import { prisma } from "@/lib/prisma";

export async function writeAudit(input: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
}) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId ?? undefined,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary,
    },
  });
}

export async function nextNumber(key: string, prefix: string, pad = 4) {
  const row = await prisma.counter.upsert({
    where: { key },
    update: { value: { increment: 1 } },
    create: { key, value: 1 },
  });
  return `${prefix}${String(row.value).padStart(pad, "0")}`;
}
