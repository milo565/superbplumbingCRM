import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import type { Permission } from "@/lib/rbac";
import { can, scopedToAssigned } from "@/lib/rbac";

export async function auth() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (!can(user.role, permission)) {
    redirect("/dashboard");
  }
  return user;
}

export async function currentScope() {
  const user = await requireUser();
  return {
    user,
    assignedOnly: scopedToAssigned(user.role),
  };
}
