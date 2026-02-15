import { NextRequest, NextResponse } from "next/server";

import { verifyQuickAuthFromRequest } from "@/lib/auth/verifyQuickAuth";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ProjectRow = {
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

const jsonError = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyQuickAuthFromRequest(request);
    const body = (await request.json()) as {
      name?: string;
      config_json?: Record<string, unknown>;
      status?: string;
      project_slug?: string;
    };

    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", params.id)
      .single<ProjectRow>();

    if (projectError || !project) {
      return jsonError("Project not found", 404);
    }

    if (project.owner_wallet !== auth.wallet) {
      return jsonError("Forbidden", 401);
    }

    if (project.status !== "draft") {
      return jsonError("Only draft projects can be edited", 400);
    }

    if (body.status && body.status !== "draft") {
      return jsonError("Status must remain draft", 400);
    }

    if (body.project_slug && body.project_slug !== project.project_slug) {
      return jsonError("Slug is immutable", 400);
    }

    const name = body.name?.trim();
    if (!name) {
      return jsonError("Name is required", 400);
    }

    const configJson = body.config_json;
    if (!configJson || typeof configJson !== "object" || Array.isArray(configJson)) {
      return jsonError("config_json must be an object", 400);
    }

    const { data, error } = await supabaseAdmin
      .from("projects")
      .update({
        name,
        config_json: configJson,
        status: "draft"
      })
      .eq("id", params.id)
      .eq("owner_wallet", auth.wallet)
      .eq("status", "draft")
      .select("*")
      .single<ProjectRow>();

    if (error) {
      return jsonError(error.message, 400);
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error && error.name === "Unauthorized" ? error.message : "Unauthorized";
    return jsonError(message, 401);
  }
}
