"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";

type Project = {
  id: string;
  owner_wallet: string;
  name: string;
  project_slug: string;
  config_json: Record<string, unknown>;
};

export default function EditProjectPage() {
  const { wallet: authWallet, token, isLoading, error } = useAuth();
  const params = useParams<{ wallet: string; projectSlug: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [configText, setConfigText] = useState("{}");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token || !authWallet) return;
      const response = await fetch(`/api/projects?wallet=${authWallet}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = (await response.json()) as Project[] | { error: string };
      if (!response.ok) {
        setMessage("error" in payload ? payload.error : "Could not load project");
        return;
      }

      const match = (payload as Project[]).find(
        (item) => item.owner_wallet === params.wallet && item.project_slug === params.projectSlug
      );

      if (!match) {
        setMessage("Project not found.");
        return;
      }

      setProject(match);
      setName(match.name);
      setConfigText(JSON.stringify(match.config_json ?? {}, null, 2));
      setMessage(null);
    };

    void load();
  }, [authWallet, params.projectSlug, params.wallet, token]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project || !token) return;

    let configJson: Record<string, unknown>;
    try {
      configJson = JSON.parse(configText) as Record<string, unknown>;
    } catch {
      setMessage("config_json must be valid JSON");
      return;
    }

    const response = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, config_json: configJson })
    });

    const payload = (await response.json()) as Project | { error: string };
    if (!response.ok) {
      setMessage("error" in payload ? payload.error : "Unable to update project.");
      return;
    }

    const updated = payload as Project;
    setProject(updated);
    setConfigText(JSON.stringify(updated.config_json ?? {}, null, 2));
    setMessage("Saved.");
  };

  if (isLoading) return <p>Authenticating…</p>;
  if (error) return <p className="text-rose-300">{error}</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit Project</h1>
      {!project ? (
        <p className="text-slate-300">{message ?? "Loading project…"}</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">
            Slug is immutable: <span className="font-mono">{project.project_slug}</span>
          </p>
          <label className="block space-y-1">
            <span>Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
            />
          </label>
          <label className="block space-y-1">
            <span>config_json</span>
            <textarea
              value={configText}
              onChange={(event) => setConfigText(event.target.value)}
              className="h-64 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm"
            />
          </label>
          {message && <p className="text-sm text-slate-300">{message}</p>}
          <button type="submit" className="rounded-md bg-indigo-500 px-4 py-2 text-white">
            Save Draft
          </button>
        </form>
      )}
    </div>
  );
}
