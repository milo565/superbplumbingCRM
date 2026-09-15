import Link from "next/link";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="min-h-dvh bg-navy text-white flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue">Kaizen Coastal CRM</p>
        <h1 className="font-heading text-4xl uppercase tracking-wide mt-2">You are offline</h1>
        <p className="mt-3 text-[#c5d6e2]">
          The app shell is still here. Open a page you have already visited — dashboard or jobs
          if they were cached — or reconnect to load a live job. Full offline sync can come later.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/dashboard"
            className="rounded-xl bg-blue px-4 py-3 font-semibold min-h-11 inline-flex items-center justify-center"
          >
            Try dashboard
          </Link>
          <Link
            href="/jobs"
            className="rounded-xl bg-orange px-4 py-3 font-semibold min-h-11 inline-flex items-center justify-center"
          >
            Try jobs
          </Link>
        </div>
      </div>
    </div>
  );
}
