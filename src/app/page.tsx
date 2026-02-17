import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">BaseForge v2 — Phase 0</h1>
      <p className="text-slate-300">Authenticated dashboard for draft project CRUD.</p>
      <Link href="/dashboard" className="inline-flex rounded-md bg-indigo-500 px-4 py-2 font-medium text-white">
        Open Dashboard
      </Link>
    </div>
  );
}
