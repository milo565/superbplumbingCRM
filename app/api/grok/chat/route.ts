import { NextResponse } from "next/server";
import { writeAudit } from "@/lib/audit";
import {
  GROK_SYSTEM_PROMPT,
  completeGrokChat,
  grokContextLabel,
  grokModel,
  isGrokConfigured,
  loadGrokContext,
  parseGrokRef,
  sanitizeTurns,
} from "@/lib/grok";
import { can } from "@/lib/rbac";
import { auth } from "@/lib/session";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) {
    return NextResponse.json({ error: "Sign in to ask Grok." }, { status: 401 });
  }
  if (!can(user.role, "grok:use")) {
    return NextResponse.json({ error: "Your role cannot use Grok." }, { status: 403 });
  }
  if (!isGrokConfigured()) {
    return NextResponse.json({ error: "Add XAI_API_KEY to enable Grok." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const turns = sanitizeTurns(payload.messages);
  const lastUser = [...turns].reverse().find((turn) => turn.role === "user");
  if (!lastUser) {
    return NextResponse.json({ error: "Ask Grok a question first." }, { status: 400 });
  }

  const ref = parseGrokRef(payload.context);
  const loaded = await loadGrokContext(ref, { id: user.id, role: user.role });
  if (!loaded.ok) {
    return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  }

  const messages = [
    { role: "system", content: GROK_SYSTEM_PROMPT },
    {
      role: "system",
      content: `Current CRM page: ${grokContextLabel(ref)}. Staff: ${user.name ?? "team"} (${user.role}). Record context (no secrets):\n${loaded.text}`,
    },
    ...turns,
  ];

  const result = await completeGrokChat(messages);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  try {
    await writeAudit({
      userId: user.id,
      action: "grok.ask",
      entityType: ref.type,
      entityId: ref.id ?? "app",
      summary: `Asked Grok (${grokModel()}): ${lastUser.content.slice(0, 80)}`,
    });
  } catch {
    // Chat still succeeds if audit write fails.
  }

  return NextResponse.json({ reply: result.content });
}
