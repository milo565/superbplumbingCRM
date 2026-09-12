import { saveSettings, saveTemplate } from "@/actions/crm";
import { Button, Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { can } from "@/lib/rbac";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requirePermission("settings:read");
  const settings = Object.fromEntries(
    (await prisma.setting.findMany()).map((s) => [s.key, s.value]),
  );
  const templates = await prisma.template.findMany({ orderBy: { name: "asc" } });
  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div>
      <PageHeader
        eyebrow="Office"
        title="Settings"
        description="Company details, consent, templates and integration stubs."
      />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card id="install" className="lg:col-span-2 bg-navy text-white border-0">
          <h2 className="font-heading text-2xl uppercase mb-2">Install SuperbFlow</h2>
          <p className="text-sm text-[#c5d6e2]">
            Put the CRM on the home screen so plumbers can open jobs, maps and follow-ups like an app.
            Pages already visited (dashboard, jobs) can open from the cached shell if the van drops signal.
            Full offline sync can come later — sign-in still needs a connection.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm">
            <div className="rounded-xl bg-white/8 p-4">
              <p className="font-semibold">iPhone / iPad</p>
              <ol className="list-decimal pl-5 mt-2 space-y-1 text-[#c5d6e2]">
                <li>Open SuperbFlow in Safari</li>
                <li>Tap Share</li>
                <li>Tap Add to Home Screen</li>
                <li>Tap Add — launch fullscreen from the icon</li>
              </ol>
            </div>
            <div className="rounded-xl bg-white/8 p-4">
              <p className="font-semibold">Android / Chrome / Edge</p>
              <ol className="list-decimal pl-5 mt-2 space-y-1 text-[#c5d6e2]">
                <li>Open the site in Chrome or Edge</li>
                <li>Tap the menu (⋮)</li>
                <li>Tap Install app or Add to Home screen</li>
                <li>Or use Install when the in-app banner appears</li>
              </ol>
            </div>
          </div>
        </Card>
        <Card>
          <h2 className="font-heading text-2xl uppercase text-navy mb-3">Company</h2>
          <form action={saveSettings} className="grid gap-3">
            <Field label="Name">
              <Input name="companyName" defaultValue={settings.companyName} disabled={!can(user.role, "settings:write")} />
            </Field>
            <Field label="ABN">
              <Input name="abn" defaultValue={settings.abn} disabled={!can(user.role, "settings:write")} />
            </Field>
            <Field label="Email">
              <Input name="email" defaultValue={settings.email} disabled={!can(user.role, "settings:write")} />
            </Field>
            <Field label="Primary phone">
              <Input name="phonePrimary" defaultValue={settings.phonePrimary} disabled={!can(user.role, "settings:write")} />
            </Field>
            <Field label="Secondary phone">
              <Input name="phoneSecondary" defaultValue={settings.phoneSecondary} disabled={!can(user.role, "settings:write")} />
            </Field>
            <Field label="Default labour rate (ex GST)">
              <Input name="defaultLabourRate" defaultValue={settings.defaultLabourRate} disabled={!can(user.role, "settings:write")} />
            </Field>
            <Field label="Require approval before SMS/email">
              <Input name="followUpRequireApproval" defaultValue={settings.followUpRequireApproval} />
            </Field>
            {can(user.role, "settings:write") ? <Button type="submit">Save settings</Button> : null}
          </form>
        </Card>
        <Card>
          <h2 className="font-heading text-2xl uppercase text-navy mb-3">Integrations</h2>
          <p className="text-sm">Xero: {settings["integrations.xero"] ?? "disconnected"} (placeholder)</p>
          <p className="text-sm mt-1">MYOB: {settings["integrations.myob"] ?? "disconnected"} (placeholder)</p>
          <p className="text-sm mt-1">SMS gateway: {settings["integrations.sms"] ?? "stub"}</p>
          <p className="text-sm mt-4 text-[#4b5c69]">
            Outbound messages are stored in communications and never hit a live gateway in this demo.
          </p>
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="font-heading text-2xl uppercase text-navy mb-3">Templates</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <form key={tpl.id} action={saveTemplate} className="space-y-2">
                <input type="hidden" name="id" value={tpl.id} />
                <Field label="Name">
                  <Input name="name" defaultValue={tpl.name} />
                </Field>
                <Field label="Subject">
                  <Input name="subject" defaultValue={tpl.subject ?? ""} />
                </Field>
                <Field label="Body">
                  <Textarea name="body" defaultValue={tpl.body} />
                </Field>
                {can(user.role, "settings:write") ? (
                  <Button type="submit" variant="ghost">
                    Save template
                  </Button>
                ) : null}
              </form>
            ))}
          </div>
          <p className="text-xs text-[#5b6b78] mt-3">
            Tokens: {"{{contactName}}"} {"{{propertyAddress}}"} {"{{service}}"} {"{{plumberName}}"} {"{{phone}}"}
          </p>
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="font-heading text-2xl uppercase text-navy mb-3">Audit trail</h2>
          <ul className="text-sm space-y-2">
            {logs.map((log) => (
              <li key={log.id}>
                <span className="font-medium">{log.summary}</span>
                <span className="text-[#5b6b78]">
                  {" "}
                  · {log.user?.name ?? "System"} · {log.action}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
