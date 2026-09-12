"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  FileText,
  HardHat,
  History,
  Inbox,
  LayoutDashboard,
  Menu,
  PhoneForwarded,
  Receipt,
  Repeat,
  Search,
  Settings,
  Users,
  Wrench,
  X,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { COMPANY, NAV_ITEMS, ROLE_LABELS, TONE } from "@/lib/constants";
import { navVisible } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { InstallAppBanner, InstallAppButton } from "@/components/install-app";

const ICONS = {
  LayoutDashboard,
  Users,
  Building2,
  Inbox,
  FileText,
  Wrench,
  CalendarDays,
  History,
  PhoneForwarded,
  Repeat,
  Receipt,
  BarChart3,
  HardHat,
  Settings,
};

export function AppShell({
  user,
  children,
}: {
  user: { name?: string | null; email?: string | null; role: Role };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const items = useMemo(
    () => NAV_ITEMS.filter((item) => navVisible(user.role, item.href)),
    [user.role],
  );

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  const nav = (
    <nav className="flex flex-col gap-1 px-3 pb-6">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition",
              active
                ? "bg-blue text-white"
                : "text-[#d6e4ee] hover:bg-white/8 hover:text-white",
            )}
          >
            <Icon size={18} strokeWidth={2} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-cream text-ink">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[272px] bg-navy text-white flex flex-col transition-transform lg:translate-x-0 pt-[env(safe-area-inset-top)]",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              src="/superbflow-logo.png"
              alt="SuperbFlow Plumbing"
              width={44}
              height={36}
              className="h-9 w-auto brightness-0 invert"
            />
            <div>
              <p className="font-heading text-xl uppercase tracking-wide leading-none">
                SuperbFlow
              </p>
              <p className="text-[11px] text-[#9cb4c4] mt-1">CRM · {TONE.noDrama}</p>
            </div>
          </Link>
          <button className="lg:hidden p-2" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <div className="px-4 pb-4">
          <p className="text-xs text-[#8aa0b0]">
            {COMPANY.phoneAnthony} · {COMPANY.phoneNathan}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        <div className="border-t border-white/10 p-4">
          <p className="text-sm font-semibold">{user.name}</p>
          <p className="text-xs text-[#9cb4c4]">{ROLE_LABELS[user.role]}</p>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-3 text-sm text-orange font-semibold"
          >
            Sign out
          </button>
        </div>
      </aside>

      {open ? (
        <button
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close overlay"
        />
      ) : null}

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-20 bg-navy/95 backdrop-blur border-b border-white/10 pt-[env(safe-area-inset-top)]">
          <div className="flex items-center gap-3 px-3 sm:px-5 py-3">
            <button
              className="lg:hidden text-white p-2 -ml-1"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <form onSubmit={submitSearch} className="flex-1">
              <label className="relative block">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8aa0b0]"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search customers, jobs, sites, quotes…"
                  className="w-full rounded-xl bg-[#102938] text-white placeholder:text-[#7f96a6] pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue"
                />
              </label>
            </form>
            <InstallAppButton />
            <a
              href="tel:0412121772"
              className="hidden sm:inline-flex rounded-xl bg-orange px-3 py-2.5 text-sm font-semibold text-white"
            >
              24/7
            </a>
          </div>
        </header>
        <InstallAppBanner />
        <main className="px-3 sm:px-6 py-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-8 max-w-[1400px]">
          {children}
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-navy text-white grid grid-cols-5 border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
        {[
          { href: "/dashboard", label: "Home", icon: LayoutDashboard },
          { href: "/jobs", label: "Jobs", icon: Wrench },
          { href: "/calendar", label: "Today", icon: CalendarDays },
          { href: "/customers", label: "People", icon: Users },
          { href: "/follow-ups", label: "Follow", icon: PhoneForwarded },
        ].map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                active ? "text-blue" : "text-[#c5d4de]",
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
