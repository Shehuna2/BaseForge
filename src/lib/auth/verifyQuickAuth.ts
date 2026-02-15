import { verifyJwt } from "@farcaster/quick-auth";
import { NextRequest } from "next/server";

import { isValidWallet, normalizeWallet } from "@/lib/utils/slug";

type QuickAuthClaims = {
  sub?: string;
  fid?: number;
  wallet_address?: string;
  address?: string;
  aud?: string;
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
    throw new Error("Missing QUICK_AUTH_DOMAIN");
  }

  let claims: QuickAuthClaims | null = null;
  try {
    claims = (await verifyJwt({ token, domain })) as QuickAuthClaims;
  } catch {
    unauthorized("Invalid token");
  }

  if (claims === null || claims.aud !== domain) {
    unauthorized("Invalid token audience");
  }

  const fid = typeof claims.fid === "number" ? claims.fid : Number(claims.sub);
  const wallet = normalizeWallet(String(claims.wallet_address ?? claims.address ?? ""));

  if (!Number.isInteger(fid) || fid <= 0) {
    unauthorized("Invalid token claims");
  }

  if (!isValidWallet(wallet)) {
    unauthorized("Invalid token wallet");
  }

  return {
    wallet,
    fid
  };
};
