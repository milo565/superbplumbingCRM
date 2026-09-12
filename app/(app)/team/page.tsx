import { updateUserRole } from "@/actions/crm";
import { Button, Card, PageHeader, StatusBadge } from "@/components/ui";
import { ROLE_LABELS } from "@/lib/constants";
import { formatPhone } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { can } from "@/lib/rbac";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const user = await requirePermission("team:read");
  const team = await prisma.user.findMany({
    include: {
      assignedJobs: {
        where: { status: { in: ["SCHEDULED", "PLUMBER_ASSIGNED", "ON_THE_WAY", "IN_PROGRESS"] } },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader eyebrow="Crew" title="Team" description="Who is on the tools and who is holding the office." />
      <div className="grid md:grid-cols-2 gap-3">
        {team.map((member) => (
          <Card key={member.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-heading text-2xl uppercase text-navy">{member.name}</p>
                <p className="text-sm">{ROLE_LABELS[member.role]}</p>
                <p className="text-sm text-[#4b5c69]">{member.email}</p>
                <p className="text-sm">{formatPhone(member.phone)}</p>
                {member.licenceNumber ? <p className="text-xs mt-1">Licence {member.licenceNumber}</p> : null}
              </div>
              <StatusBadge label={member.active ? "Active" : "Inactive"} tone={member.active ? "green" : "red"} />
            </div>
            <p className="text-sm mt-3">{member.assignedJobs.length} jobs on the board</p>
            {can(user.role, "team:write") ? (
              <form action={updateUserRole} className="mt-3">
                <input type="hidden" name="id" value={member.id} />
                <input type="hidden" name="active" value={member.active ? "" : "true"} />
                <Button type="submit" variant="ghost">
                  {member.active ? "Deactivate" : "Reactivate"}
                </Button>
              </form>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
