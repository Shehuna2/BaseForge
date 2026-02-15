"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";

type CreateResponse = {
  id: string;
  owner_wallet: string;
  project_slug: string;
};

export default function NewProjectPage() {
  const { token, wallet, isLoading, error } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [planId, setPlanId] = useState<"basic" | "pro">("basic");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !wallet) return;

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        project_slug: slug,
        plan_id: planId
      })
    });

    const payload = (await response.json()) as CreateResponse | { error: string };

    if (!response.ok) {
      setSubmitError("error" in payload ? payload.error : "Unable to create project.");
      return;
    }

    const project = payload as CreateResponse;
    router.push(`/dashboard/${project.owner_wallet}/${project.project_slug}/edit`);
  };

  if (isLoading) return <p>Authenticating…</p>;
  if (error || !token || !wallet) return <p className="text-rose-300">{error ?? "Unauthorized"}</p>;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Create Draft Project</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-800 bg-slate-900 p-4">
        <label className="block space-y-1">
          <span>Name</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
          />
        </label>

        <label className="block space-y-1">
          <span>Project Slug</span>
          <input
            required
            value={slug}
            onChange={(event) => setSlug(event.target.value.toLowerCase())}
            className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
          />
        </label>

        <label className="block space-y-1">
          <span>Plan</span>
          <select
            value={planId}
            onChange={(event) => setPlanId(event.target.value as "basic" | "pro")}
            className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
          >
            <option value="basic">basic</option>
            <option value="pro">pro</option>
          </select>
        </label>

        {submitError && <p className="text-rose-300">{submitError}</p>}

        <button type="submit" className="rounded-md bg-indigo-500 px-4 py-2 text-white">
          Create Project
        </button>
      </form>
    </div>
  );
}
