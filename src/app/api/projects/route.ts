import { NextRequest, NextResponse } from "next/server";

import { verifyQuickAuthFromRequest } from "@/lib/auth/verifyQuickAuth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isValidSlug, isValidWallet, normalizeWallet } from "@/lib/utils/slug";

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

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyQuickAuthFromRequest(request);
    const body = (await request.json()) as {
      name?: string;
      project_slug?: string;
      plan_id?: "basic" | "pro";
    };

    const name = body.name?.trim();
    const slug = body.project_slug?.trim();
    const planId = body.plan_id;

    if (!name || !slug || !planId) {
      return jsonError("Missing required fields", 400);
    }

    if (!isValidSlug(slug)) {
      return jsonError("Invalid slug", 400);
    }

    if (planId !== "basic" && planId !== "pro") {
      return jsonError("Invalid plan_id", 400);
    }

    const { error: userError } = await supabaseAdmin
      .from("users")
      .upsert({ wallet_address: auth.wallet }, { onConflict: "wallet_address" });

    if (userError) {
      return jsonError(userError.message, 500);
    }

    const { data, error } = await supabaseAdmin
      .from("projects")
      .insert({
        owner_wallet: auth.wallet,
        name,
        project_slug: slug,
        plan_id: planId,
        status: "draft",
        config_json: {}
      })
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

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyQuickAuthFromRequest(request);
    const wallet = normalizeWallet(request.nextUrl.searchParams.get("wallet") ?? "");

    if (!isValidWallet(wallet)) {
      return jsonError("Invalid wallet", 400);
    }

    if (wallet !== auth.wallet) {
      return jsonError("Wallet mismatch", 401);
    }

    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("owner_wallet", wallet)
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    const message = error instanceof Error && error.name === "Unauthorized" ? error.message : "Unauthorized";
    return jsonError(message, 401);
  }
}
