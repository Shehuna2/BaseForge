"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import {
  ButtonComponent,
  RuntimeComponent,
  TextComponent,
  WalletConnectComponent,
  buildConfigJson,
  sanitizeComponentsForPlan
} from "@/lib/runtime/components";

type Project = {
  id: string;
  owner_wallet: string;
  name: string;
  project_slug: string;
  plan_id: "basic" | "pro";
  config_json: Record<string, unknown>;
};

const createTextComponent = (): TextComponent => ({
  type: "text",
  content: "New text"
});

const createButtonComponent = (): ButtonComponent => ({
  type: "button",
  label: "Visit",
  url: "https://"
});

const createWalletConnectComponent = (): WalletConnectComponent => ({
  type: "wallet_connect"
});

export default function EditProjectPage() {
  const { wallet: authWallet, token, isLoading, error } = useAuth();
  const params = useParams<{ wallet: string; projectSlug: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [components, setComponents] = useState<RuntimeComponent[]>([]);
  const [configText, setConfigText] = useState("{}");
  const [showAdvancedJson, setShowAdvancedJson] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const configPreview = useMemo(() => JSON.stringify(buildConfigJson(components), null, 2), [components]);

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

      const safeComponents = sanitizeComponentsForPlan(match.config_json?.components, match.plan_id);
      setProject(match);
      setName(match.name);
      setComponents(safeComponents);
      setConfigText(JSON.stringify(match.config_json ?? {}, null, 2));
      setMessage(null);
    };

    void load();
  }, [authWallet, params.projectSlug, params.wallet, token]);

  const updateComponent = (index: number, value: RuntimeComponent) => {
    setComponents((current) => current.map((component, i) => (i === index ? value : component)));
  };

  const removeComponent = (index: number) => {
    setComponents((current) => current.filter((_, i) => i !== index));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project || !token) return;

    let configJson: Record<string, unknown>;

    if (showAdvancedJson) {
      try {
        const parsed = JSON.parse(configText) as Record<string, unknown>;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          setMessage("Advanced JSON must be an object.");
          return;
        }

        configJson = parsed;
      } catch {
        setMessage("config_json must be valid JSON");
        return;
      }
    } else {
      configJson = buildConfigJson(components);
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
    const safeComponents = sanitizeComponentsForPlan(updated.config_json?.components, updated.plan_id);
    setProject(updated);
    setComponents(safeComponents);
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
          <p className="text-sm text-slate-400">Plan: {project.plan_id}</p>

          <label className="block space-y-1">
            <span>Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
            />
          </label>

          <div className="space-y-3 rounded border border-slate-700 p-3">
            <p className="font-medium">Components</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setComponents((current) => [...current, createTextComponent()])}
                className="rounded bg-slate-700 px-3 py-1 text-sm"
              >
                Add Text
              </button>
              <button
                type="button"
                onClick={() => setComponents((current) => [...current, createButtonComponent()])}
                className="rounded bg-slate-700 px-3 py-1 text-sm"
              >
                Add Button
              </button>
              <button
                type="button"
                onClick={() => setComponents((current) => [...current, createWalletConnectComponent()])}
                className="rounded bg-slate-700 px-3 py-1 text-sm"
              >
                Add Wallet Connect
              </button>
            </div>

            <ul className="space-y-3">
              {components.map((component, index) => (
                <li key={`${component.type}-${index}`} className="rounded border border-slate-700 bg-slate-950 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm uppercase text-slate-400">{component.type}</p>
                    <button
                      type="button"
                      onClick={() => removeComponent(index)}
                      className="text-sm text-rose-300"
                    >
                      Remove
                    </button>
                  </div>

                  {component.type === "text" && (
                    <input
                      value={component.content}
                      onChange={(event) => updateComponent(index, { ...component, content: event.target.value })}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
                    />
                  )}

                  {component.type === "button" && (
                    <div className="space-y-2">
                      <input
                        value={component.label}
                        onChange={(event) => updateComponent(index, { ...component, label: event.target.value })}
                        placeholder="Label"
                        className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
                      />
                      <input
                        value={component.url}
                        onChange={(event) => updateComponent(index, { ...component, url: event.target.value })}
                        placeholder="https://example.com"
                        className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 rounded border border-slate-700 p-3">
            <button
              type="button"
              onClick={() => {
                setShowAdvancedJson((current) => !current);
                setConfigText(configPreview);
              }}
              className="text-sm text-indigo-300"
            >
              {showAdvancedJson ? "Hide Advanced JSON" : "Show Advanced JSON"}
            </button>
            {showAdvancedJson && (
              <textarea
                value={configText}
                onChange={(event) => setConfigText(event.target.value)}
                className="h-56 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm"
              />
            )}
          </div>

          {message && <p className="text-sm text-slate-300">{message}</p>}
          <button type="submit" className="rounded-md bg-indigo-500 px-4 py-2 text-white">
            Save Draft
          </button>
        </form>
      )}
    </div>
  );
}
