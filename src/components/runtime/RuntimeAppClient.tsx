"use client";

import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

import ComponentRenderer from "@/components/runtime/ComponentRenderer";
import { PlanId, RuntimeComponent, sanitizeComponentsForPlan } from "@/lib/runtime/components";
import { normalizeWallet } from "@/lib/utils/slug";

type RuntimeProject = {
  id: string;
  owner_wallet: string;
  name: string;
  project_slug: string;
  plan_id: PlanId;
  status: "draft" | "published";
  config_json: Record<string, unknown>;
};

type RuntimeState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "not_published" }
  | { status: "error"; message: string }
  | { status: "ready"; project: RuntimeProject; components: RuntimeComponent[] };

type RuntimeAppClientProps = {
  wallet: string;
  projectSlug: string;
};

const getComponentsFromConfig = (config: Record<string, unknown>, planId: PlanId): RuntimeComponent[] => {
  const components = config.components;
  return sanitizeComponentsForPlan(components, planId);
};

export default function RuntimeAppClient({ wallet, projectSlug }: RuntimeAppClientProps) {
  const [state, setState] = useState<RuntimeState>({ status: "loading" });

  useEffect(() => {
    const boot = async () => {
      try {
        const maybeSdk = sdk as unknown as {
          actions?: { ready?: () => Promise<void>; setFrameReady?: () => Promise<void> };
          miniApp?: { setFrameReady?: () => Promise<void> };
        };

        await maybeSdk.actions?.ready?.();

        if (maybeSdk.actions?.setFrameReady) {
          await maybeSdk.actions.setFrameReady();
        } else if (maybeSdk.miniApp?.setFrameReady) {
          await maybeSdk.miniApp.setFrameReady();
        }
      } catch {
        // no-op for non-frame environments
      }

      const walletParam = normalizeWallet(wallet);
      const slugParam = projectSlug.toLowerCase();
      const response = await fetch(`/api/public/projects/${walletParam}/${slugParam}`);

      if (response.status === 404) {
        setState({ status: "not_found" });
        return;
      }

      if (response.status === 403) {
        setState({ status: "not_published" });
        return;
      }

      const payload = (await response.json()) as RuntimeProject | { error: string };

      if (!response.ok) {
        setState({
          status: "error",
          message: "error" in payload ? payload.error : "Unable to load app"
        });
        return;
      }

      const project = payload as RuntimeProject;
      const components = getComponentsFromConfig(project.config_json ?? {}, project.plan_id);
      setState({ status: "ready", project, components });
    };

    void boot();
  }, [projectSlug, wallet]);

  if (state.status === "loading") {
    return <p className="text-slate-300">Loading app…</p>;
  }

  if (state.status === "not_found") {
    return <p className="rounded border border-slate-700 bg-slate-900 p-4 text-slate-200">Project not found.</p>;
  }

  if (state.status === "not_published") {
    return <p className="rounded border border-amber-700 bg-amber-900/30 p-4 text-amber-200">Not published yet.</p>;
  }

  if (state.status === "error") {
    return <p className="rounded border border-rose-700 bg-rose-900/30 p-4 text-rose-200">{state.message}</p>;
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">{state.project.name}</h1>
      <ComponentRenderer components={state.components} planId={state.project.plan_id} />
    </div>
  );
}
