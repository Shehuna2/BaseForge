import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isValidSlug, isValidWallet, normalizeWallet } from "@/lib/utils/slug";

type ProjectRow = {
  id: string;
  owner_wallet: string;
  name: string;
  project_slug: string;
  plan_id: "basic" | "pro";
  status: "draft" | "published";
  config_json: Record<string, unknown>;
};

const jsonError = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function GET(
  _request: NextRequest,
  { params }: { params: { wallet: string; projectSlug: string } }
) {
  const wallet = normalizeWallet(params.wallet);
  const projectSlug = params.projectSlug.toLowerCase();

  if (!isValidWallet(wallet) || !isValidSlug(projectSlug)) {
    return jsonError("Project not found", 404);
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("id, owner_wallet, name, project_slug, plan_id, status, config_json")
    .eq("owner_wallet", wallet)
    .eq("project_slug", projectSlug)
    .maybeSingle<ProjectRow>();

  if (error || !data) {
    return jsonError("Project not found", 404);
  }

  if (data.status !== "published") {
    return jsonError("Not published yet", 403);
  }

  return NextResponse.json(data);
}
