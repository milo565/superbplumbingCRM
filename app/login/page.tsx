"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { COMPANY, TONE } from "@/lib/constants";

const DEMOS = [
  ["Business owner", "anthony@superbflowplumbing.com.au"],
  ["Office administrator", "office@superbflowplumbing.com.au"],
  ["Plumbing supervisor", "nathan@superbflowplumbing.com.au"],
  ["Plumber", "liam@superbflowplumbing.com.au"],
  ["Sales & follow-up", "jess@superbflowplumbing.com.au"],
];

export default function LoginPage() {
  const [email, setEmail] = useState("anthony@superbflowplumbing.com.au");
  const [password, setPassword] = useState("SuperbFlow1!");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });
    setBusy(false);
    if (result?.error) {
      setError("That login did not work. Check the demo details below.");
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen bg-navy text-white grid lg:grid-cols-2">
      <section className="hidden lg:flex flex-col justify-between p-12 bg-[linear-gradient(160deg,#091825_0%,#102938_60%,#0b3a5c_100%)]">
        <div>
          <Image
            src="/superbflow-logo.png"
            alt="SuperbFlow Plumbing"
            width={88}
            height={72}
            className="h-16 w-auto brightness-0 invert"
          />
          <p className="mt-8 font-heading text-6xl uppercase leading-[0.9] tracking-wide">
            No drama.
            <br />
            Just flow.
          </p>
          <p className="mt-6 max-w-md text-[#c5d6e2] text-lg">
            See who needs a hand today, what was done last visit, and which
            customers are due a sensible follow-up.
          </p>
        </div>
        <p className="text-sm text-[#8aa0b0]">
          {COMPANY.name} · {COMPANY.website.replace("https://", "")}
          <br />
          24/7 {COMPANY.phoneAnthony} · {COMPANY.phoneNathan}
        </p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10 bg-cream text-ink">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Image
              src="/superbflow-logo.png"
              alt="SuperbFlow Plumbing"
              width={72}
              height={58}
              className="h-14 w-auto"
            />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue">
            Team login
          </p>
          <h1 className="font-heading text-4xl uppercase tracking-wide text-navy mt-1">
            Let&apos;s get it sorted.
          </h1>
          <p className="mt-2 text-[#3c4d5a]">{TONE.holdsUp}</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#cfd8de] bg-white px-3 py-3"
                required
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#cfd8de] bg-white px-3 py-3"
                required
              />
            </label>
            {error ? <p className="text-sm text-[#B42318]">{error}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-blue text-white font-semibold py-3.5 text-base"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-8 rounded-2xl bg-pale-2 p-4 text-sm">
            <p className="font-semibold text-navy mb-2">Demo logins — password `SuperbFlow1!`</p>
            <ul className="space-y-1.5">
              {DEMOS.map(([role, mail]) => (
                <li key={mail}>
                  <button
                    type="button"
                    className="text-left w-full hover:text-blue"
                    onClick={() => {
                      setEmail(mail);
                      setPassword("SuperbFlow1!");
                    }}
                  >
                    <span className="font-medium">{role}</span>
                    <span className="block text-[#4b5c69] text-xs">{mail}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
