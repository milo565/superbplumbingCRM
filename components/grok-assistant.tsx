"use client";

import { Copy, Loader2, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ASSISTANT_NAME,
  grokChips,
  grokContextLabel,
  parseGrokPath,
  type ChatTurn,
} from "@/lib/grok-shared";
import { cn } from "@/lib/utils";

export function AskGrokButton({
  onClick,
  compact = false,
}: {
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ASSISTANT_NAME}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl bg-blue px-3 py-2.5 text-sm font-semibold text-white min-h-11",
        compact && "px-2.5",
      )}
    >
      <Sparkles size={16} />
      <span className={compact ? "sm:inline hidden" : undefined}>{ASSISTANT_NAME}</span>
    </button>
  );
}

export function GrokAssistant({
  open,
  onClose,
  configured,
}: {
  open: boolean;
  onClose: () => void;
  configured: boolean;
}) {
  const pathname = usePathname();
  const ref = useMemo(() => parseGrokPath(pathname), [pathname]);
  const chips = useMemo(() => grokChips(ref.type), [ref.type]);
  const contextKey = `${ref.type}:${ref.id ?? ""}`;

  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTurns([]);
    setDraft("");
    setError(null);
  }, [contextKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy, open]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy || !configured) return;
    const nextTurns = [...turns, { role: "user" as const, content }];
    setTurns(nextTurns);
    setDraft("");
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/grok/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextTurns, context: ref }),
      });
      const data = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok || !data.reply) {
        setError(data.error ?? `${ASSISTANT_NAME} could not answer that.`);
        return;
      }
      setTurns([...nextTurns, { role: "assistant", content: data.reply }]);
    } catch {
      setError(`Could not reach ${ASSISTANT_NAME}. Check the connection and try again.`);
    } finally {
      setBusy(false);
    }
  }

  async function copyText(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(index);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setError("Could not copy. Select the text instead.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-navy/50 backdrop-blur-[2px]"
        aria-label={`Close ${ASSISTANT_NAME}`}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="grok-title"
        className="absolute inset-x-0 bottom-0 max-h-[90dvh] lg:inset-y-0 lg:right-0 lg:left-auto lg:max-h-none lg:w-[420px] bg-cream text-ink shadow-[-8px_0_32px_rgba(9,24,37,0.18)] flex flex-col rounded-t-3xl lg:rounded-none"
      >
        <header className="bg-navy text-white px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 rounded-t-3xl lg:rounded-none">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#9cb4c4]">SuperbFlow assistant</p>
              <h2 id="grok-title" className="font-heading text-2xl uppercase leading-none mt-1">
                {ASSISTANT_NAME}
              </h2>
              <p className="text-xs text-[#c5d6e2] mt-1.5">
                {grokContextLabel(ref)} · drafts only — you send
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10"
              aria-label={`Close ${ASSISTANT_NAME}`}
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {!configured ? (
          <div className="p-5 space-y-3">
            <p className="font-semibold text-navy">Add XAI_API_KEY to enable SuperbBOT</p>
            <p className="text-sm text-[#4b5c69]">
              The assistant stays in the CRM. Get a key at{" "}
              <a
                href="https://console.x.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue font-semibold"
              >
                console.x.ai
              </a>
              , then set <code className="text-navy">XAI_API_KEY</code> in{" "}
              <code className="text-navy">.env</code> or Vercel. The key never appears here.
            </p>
          </div>
        ) : (
          <>
            <div className="px-3 pt-3 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  disabled={busy}
                  onClick={() => send(chip.prompt)}
                  className="rounded-full border border-[#d5dde3] bg-white px-3 py-1.5 text-xs font-semibold text-navy disabled:opacity-50"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {turns.length === 0 && !error ? (
                <p className="text-sm text-[#4b5c69]">
                  No drama. Ask for a call brief, the next job status, or a follow-up draft.
                  SuperbBOT uses this page&apos;s record — it does not send messages.
                </p>
              ) : null}
              {turns.map((turn, index) => (
                <div
                  key={`${turn.role}-${index}`}
                  className={cn(
                    "rounded-2xl px-3.5 py-3 text-sm whitespace-pre-wrap",
                    turn.role === "user"
                      ? "bg-navy text-white ml-8"
                      : "bg-white border border-[#e6ecef] mr-4",
                  )}
                >
                  {turn.content}
                  {turn.role === "assistant" ? (
                    <button
                      type="button"
                      onClick={() => copyText(turn.content, index)}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue"
                    >
                      <Copy size={12} />
                      {copied === index ? "Copied" : "Copy"}
                    </button>
                  ) : null}
                </div>
              ))}
              {busy ? (
                <p className="text-sm text-[#4b5c69] inline-flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Working…
                </p>
              ) : null}
              {error ? <p className="text-sm text-[#B42318]">{error}</p> : null}
            </div>

            <form
              className="border-t border-[#e6ecef] bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
              onSubmit={(event) => {
                event.preventDefault();
                void send(draft);
              }}
            >
              <label className="sr-only" htmlFor="grok-input">
                Message SuperbBOT
              </label>
              <textarea
                id="grok-input"
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send(draft);
                  }
                }}
                rows={2}
                placeholder="Ask about this record…"
                className="w-full rounded-xl border border-[#cfd8de] px-3 py-2.5 text-[15px] outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={busy || !draft.trim()}
                  className="rounded-xl bg-blue px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 min-h-11"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        )}
      </aside>
    </div>
  );
}
