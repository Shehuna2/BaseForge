import { createClient } from "@farcaster/quick-auth";
import { NextRequest } from "next/server";

import { isValidWallet, normalizeWallet } from "@/lib/utils/slug";

type QuickAuthClaims = {
  sub?: string;
  fid?: number;
  wallet_address?: string;
  address?: string;
  aud?: string;
};

type QuickAuthVerifier = {
  verifyJwt: (args: { token: string; domain: string }) => Promise<QuickAuthClaims>;
};

export type AuthContext = {
  wallet: string;
  fid: number;
};

const unauthorized = (message: string): never => {
  const error = new Error(message);
  error.name = "Unauthorized";
  throw error;
};

export const verifyQuickAuthFromRequest = async (request: NextRequest): Promise<AuthContext> => {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    unauthorized("Missing bearer token");
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    unauthorized("Missing bearer token");
  }

  const domain = process.env.QUICK_AUTH_DOMAIN;
  if (!domain) {
    unauthorized("Unauthorized");
  }

  const quickAuthClient = createClient() as QuickAuthVerifier;

  let claims: QuickAuthClaims | null = null;
  try {
    claims = await quickAuthClient.verifyJwt({ token, domain });
  } catch {
    unauthorized("Unauthorized");
  }

  if (!claims || (claims.aud && claims.aud !== domain)) {
    unauthorized("Unauthorized");
  }

  const fid = typeof claims.fid === "number" ? claims.fid : Number(claims.sub);
  if (!Number.isInteger(fid) || fid <= 0) {
    unauthorized("Unauthorized");
  }

  const wallet = normalizeWallet(String(claims.wallet_address ?? claims.address ?? ""));
  if (!isValidWallet(wallet)) {
    unauthorized("Unauthorized");
  }

  return {
    fid,
    wallet
  };
};
