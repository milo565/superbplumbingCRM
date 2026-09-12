"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { currentScope } from "@/lib/session";

export async function jobScopeWhere() {
  const { user, assignedOnly } = await currentScope();
  const where: Prisma.JobWhereInput = assignedOnly
    ? { assignedToId: user.id }
    : {};
  return { user, assignedOnly, where };
}

export async function customerScopeWhere() {
  const { user, assignedOnly } = await currentScope();
  const where: Prisma.CustomerWhereInput = assignedOnly
    ? {
        OR: [
          { accountManagerId: user.id },
          { jobs: { some: { assignedToId: user.id } } },
        ],
      }
    : {};
  return { user, assignedOnly, where };
}

export async function touch(paths: string[]) {
  for (const path of paths) revalidatePath(path);
}
