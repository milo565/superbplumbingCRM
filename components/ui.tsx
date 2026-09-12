import Link from "next/link";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/workflow";

export function Button({
  href,
  children,
  variant = "primary",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  variant?: "primary" | "orange" | "navy" | "ghost" | "danger";
}) {
  const styles = {
    primary: "bg-blue text-white hover:bg-[#0f7ad4]",
    orange: "bg-orange text-white hover:bg-[#e65524]",
    navy: "bg-navy text-white hover:bg-navy-2",
    ghost: "bg-white text-ink border border-[#d5dde3] hover:bg-pale-2",
    danger: "bg-[#B42318] text-white hover:bg-[#8f1b12]",
  }[variant];
  const cls = cn(
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[15px] font-semibold transition min-h-11",
    styles,
    className,
  );
  if (href) {
    const external = /^(https?:|tel:|mailto:|maps:)/.test(href);
    if (external) {
      const newTab = href.startsWith("http");
      return (
        <a
          href={href}
          className={cls}
          target={newTab ? "_blank" : undefined}
          rel={newTab ? "noopener noreferrer" : undefined}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} {...props}>
      {children}
    </button>
  );
}

export function Card({
  children,
  className,
  padded = true,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "rounded-2xl bg-white shadow-[0_1px_2px_rgba(9,24,37,0.06),0_8px_24px_rgba(9,24,37,0.04)] border border-[#e6ecef]",
        padded && "p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-[#5b6b78]">{hint}</span> : null}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-[#cfd8de] bg-white px-3 py-2.5 text-[15px] text-ink outline-none focus:border-blue focus:ring-2 focus:ring-blue/20";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputCls, "min-h-24", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputCls, props.className)} />;
}

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: StatusTone | "neutral";
}) {
  const map: Record<string, string> = {
    orange: "bg-[#FFE4D6] text-[#9A3412] border-[#FF612F]/30",
    blue: "bg-[#D9EAF4] text-[#0B4F86] border-[#178FF0]/30",
    navy: "bg-[#102938] text-white border-transparent",
    pale: "bg-[#E5EFF3] text-[#102938] border-[#b9d0dc]",
    red: "bg-[#FEE4E2] text-[#B42318] border-[#F97066]/40",
    green: "bg-[#D1FADF] text-[#027A48] border-[#12B76A]/30",
    neutral: "bg-[#F5F1EB] text-ink border-[#ddd6cc]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide",
        map[tone],
      )}
    >
      {label}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue mb-1">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wide text-navy leading-none">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-[15px] text-[#3c4d5a] max-w-2xl">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="text-center py-12">
      <p className="font-heading text-2xl uppercase tracking-wide text-navy">{title}</p>
      <p className="mt-2 text-[#3c4d5a]">{body}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </Card>
  );
}

export function StatCard({
  href,
  label,
  value,
  hint,
  tone = "navy",
}: {
  href: string;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "navy" | "orange" | "blue" | "white";
}) {
  const tones = {
    navy: "bg-navy text-white",
    orange: "bg-orange text-white",
    blue: "bg-blue text-white",
    white: "bg-white text-ink border border-[#e6ecef]",
  };
  return (
    <Link
      href={href}
      className={cn(
        "rounded-2xl p-4 sm:p-5 min-h-[116px] flex flex-col justify-between shadow-sm transition hover:-translate-y-0.5",
        tones[tone],
      )}
    >
      <p className={cn("text-sm font-medium", tone === "white" ? "text-[#4b5c69]" : "text-white/80")}>
        {label}
      </p>
      <p className="font-heading text-4xl uppercase tracking-wide leading-none mt-3">{value}</p>
      {hint ? (
        <p className={cn("text-xs mt-3", tone === "white" ? "text-[#5b6b78]" : "text-white/75")}>
          {hint}
        </p>
      ) : null}
    </Link>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-heading text-2xl uppercase tracking-wide text-navy mb-3">{children}</h2>
  );
}
