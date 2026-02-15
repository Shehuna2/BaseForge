"use client";

import { useCallback, useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

import { isValidWallet, normalizeWallet } from "@/lib/utils/slug";

type AuthState = {
  isLoading: boolean;
  token: string | null;
  wallet: string | null;
  fid: number | null;
  error: string | null;
};

const initialState: AuthState = {
  isLoading: true,
  token: null,
  wallet: null,
  fid: null,
  error: null
};

export const useAuth = () => {
  const [state, setState] = useState<AuthState>(initialState);

  const refresh = useCallback(async () => {
    try {
      setState((current) => ({ ...current, isLoading: true, error: null }));

      await sdk.actions.ready();
      const [token, context] = await Promise.all([
        sdk.quickAuth.getToken(),
        sdk.context.getContext()
      ]);

      const wallet = context.user?.verifiedAddresses?.ethAddresses?.[0];
      const fid = context.user?.fid ?? null;

      const normalizedWallet = normalizeWallet(wallet ?? "");

      if (!token || !fid || !isValidWallet(normalizedWallet)) {
        setState({ ...initialState, isLoading: false, error: "Unable to authenticate via Farcaster." });
        return;
      }

      setState({
        isLoading: false,
        token,
        wallet: normalizedWallet,
        fid,
        error: null
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed.";
      setState({ ...initialState, isLoading: false, error: message });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    ...state,
    refresh
  };
};
