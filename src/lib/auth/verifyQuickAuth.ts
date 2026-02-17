import { createClient } from "@farcaster/quick-auth";
import { NextRequest } from "next/server";

import { isValidWallet, normalizeWallet } from "@/lib/utils/slug";

type JwtClaims = {
  sub?: string | number;
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

  if (authHeader === null || !authHeader.startsWith("Bearer ")) {
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

  const quickAuthClient = createClient();

  let claims: JwtClaims | null = null;
  try {
    claims = (await quickAuthClient.verifyJwt({ token, domain })) as JwtClaims;
  } catch {
    unauthorized("Unauthorized");
  }

  if (!claims || (claims.aud && claims.aud !== domain)) {
    unauthorized("Unauthorized");
  }

  const verifiedClaims = claims;

  const fid =
    typeof verifiedClaims.fid === "number"
      ? verifiedClaims.fid
      : typeof verifiedClaims.sub === "number"
        ? verifiedClaims.sub
        : Number(verifiedClaims.sub);

  if (!Number.isInteger(fid) || fid <= 0) {
    unauthorized("Unauthorized");
  }

  const wallet = normalizeWallet(String(verifiedClaims.wallet_address ?? verifiedClaims.address ?? ""));
  if (!isValidWallet(wallet)) {
    unauthorized("Unauthorized");
  }

  return {
    fid,
    wallet
  };
};
