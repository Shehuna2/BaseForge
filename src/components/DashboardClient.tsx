"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BASE_APP_AUTH_MESSAGE, useAuth } from "@/hooks/useAuth";

type Project = {
  id: string;
  owner_wallet: string;
  name: string;
  project_slug: string;
  plan_id: "basic" | "pro";
  status: "draft" | "published";
  config_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export default function DashboardClient() {
  const { isLoading, token, wallet, fid, error } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      if (!token || !wallet) {
        return;
      }

      const response = await fetch(`/api/projects?wallet=${wallet}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = (await response.json()) as Project[] | { error: string };

      if (!response.ok) {
        setProjectsError("error" in payload ? payload.error : "Unable to load projects.");
        return;
      }

      setProjects(payload as Project[]);
      setProjectsError(null);
    };

    void loadProjects();
  }, [token, wallet]);

  if (isLoading) {
    return <p className="text-slate-300">Authenticating with Farcaster…</p>;
  }

  if (error || !wallet || !fid || !token) {
    const friendlyMessage = error ?? BASE_APP_AUTH_MESSAGE;

    return (
      <div className="space-y-4 rounded-md border border-rose-500/40 bg-rose-500/10 p-4 text-rose-200">
        <p>{friendlyMessage}</p>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="cursor-not-allowed rounded-md bg-slate-700 px-3 py-2 text-sm font-medium text-slate-300 opacity-60"
        >
          New Draft Project
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <p>
          <span className="text-slate-400">Wallet:</span> <span className="font-mono">{wallet}</span>
        </p>
        <p>
          <span className="text-slate-400">FID:</span> {fid}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Projects</h2>
        <Link href="/dashboard/new" className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white">
          New Draft Project
        </Link>
      </div>

      {projectsError && <p className="rounded border border-rose-500/40 bg-rose-500/10 p-3 text-rose-100">{projectsError}</p>}

      <ul className="space-y-3">
        {projects.map((project) => (
          <li key={project.id} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <p className="font-medium">{project.name}</p>
            <p className="text-sm text-slate-400">/{project.owner_wallet}/{project.project_slug}</p>
            <p className="text-sm text-slate-400">Plan: {project.plan_id} • Status: {project.status}</p>
            <Link
              href={`/dashboard/${project.owner_wallet}/${project.project_slug}/edit`}
              className="mt-2 inline-flex text-sm text-indigo-300"
            >
              Edit
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
