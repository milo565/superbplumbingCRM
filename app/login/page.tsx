"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { COMPANY, DEMO_PASSWORD, TONE } from "@/lib/constants";

const DEMOS = [
  ["Business owner", "kai@kaizencoastal.com.au"],
  ["Office administrator", "office@kaizencoastal.com.au"],
  ["Field supervisor", "tom@kaizencoastal.com.au"],
  ["Technician", "jordan@kaizencoastal.com.au"],
  ["Sales & follow-up", "sophie@kaizencoastal.com.au"],
];

export default function LoginPage() {
  const [email, setEmail] = useState("kai@kaizencoastal.com.au");
  const [password, setPassword] = useState(DEMO_PASSWORD);
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
      <section className="hidden lg:flex flex-col justify-between p-12 bg-[linear-gradient(160deg,#0A3340_0%,#124A5C_55%,#0E6A78_100%)]">
        <div>
          <Image
            src="/kaizen-logo.png"
            alt="Kaizen Coastal Air Conditioning"
            width={88}
            height={88}
            className="h-16 w-16 rounded-2xl"
          />
          <p className="mt-8 font-heading text-6xl uppercase leading-[0.9] tracking-wide">
            The perfect
            <br />
            temperature.
          </p>
          <p className="mt-6 max-w-md text-[#c5d6e2] text-lg">
            Gold Coast and Northern NSW air conditioning — installs, repairs and
            seasonal services on one board for the office and the van.
          </p>
        </div>
        <p className="text-sm text-[#8aa0b0]">
          {COMPANY.name} · {COMPANY.base}
          <br />
          {COMPANY.phonePrimary} · {COMPANY.phoneOffice}
        </p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10 bg-cream text-ink">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Image
              src="/kaizen-logo.png"
              alt="Kaizen Coastal Air Conditioning"
              width={72}
              height={72}
              className="h-14 w-14 rounded-2xl"
            />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue">
            Team login
          </p>
          <h1 className="font-heading text-4xl uppercase tracking-wide text-navy mt-1">
            {TONE.sorted}
          </h1>
          <p className="mt-2 text-[#3c4d5a]">{TONE.tagline}</p>

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

          <p className="mt-6 text-sm text-[#3c4d5a]">
            After sign-in, install Kaizen from the banner or Settings — iPhone: Share → Add to Home
            Screen. Android: Chrome menu → Install app.
          </p>
          <div className="mt-8 rounded-2xl bg-pale-2 p-4 text-sm">
            <p className="font-semibold text-navy mb-2">Demo logins — password `{DEMO_PASSWORD}`</p>
            <ul className="space-y-1.5">
              {DEMOS.map(([role, mail]) => (
                <li key={mail}>
                  <button
                    type="button"
                    className="text-left w-full hover:text-blue"
                    onClick={() => {
                      setEmail(mail);
                      setPassword(DEMO_PASSWORD);
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
