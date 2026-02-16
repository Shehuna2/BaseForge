"use client";

import { useCallback, useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

import { isValidWallet, normalizeWallet } from "@/lib/utils/slug";

export const BASE_APP_AUTH_MESSAGE = "Open BaseForge inside the Base app to authenticate.";

type AuthState = {
  isLoading: boolean;
  token: string | null;
  wallet: string | null;
  fid: number | null;
  error: string | null;
};

type MiniAppContext = {
  user?: {
    fid?: number;
    verifiedAddresses?: {
      ethAddresses?: string[];
    };
  };
};

type MiniAppSdkLike = {
  actions?: {
    ready?: () => Promise<void>;
  };
  quickAuth?: {
    getToken?: () => Promise<string | null | undefined>;
  };
  context?:
    | {
        getContext?: () => Promise<MiniAppContext | null | undefined>;
      }
    | Promise<MiniAppContext | null | undefined>;
};

const initialState: AuthState = {
  isLoading: true,
  token: null,
  wallet: null,
  fid: null,
  error: null
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object";
};

const shouldShowBaseAppMessage = (error: unknown): boolean => {
  if (!isRecord(error) || typeof error.message !== "string") {
    return true;
  }

  return /result|miniapp|farcaster|context|undefined/i.test(error.message);
};

const getMiniAppContext = async (sdkLike: MiniAppSdkLike): Promise<MiniAppContext | null> => {
  const contextField = sdkLike.context;

  if (!contextField) {
    return null;
  }

  if (typeof (contextField as { getContext?: unknown }).getContext === "function") {
    const context = await (contextField as { getContext: () => Promise<MiniAppContext | null | undefined> }).getContext();
    return context ?? null;
  }

  if (typeof (contextField as Promise<MiniAppContext | null | undefined>).then === "function") {
    const context = await (contextField as Promise<MiniAppContext | null | undefined>);
    return context ?? null;
  }

  return null;
};

export const useAuth = () => {
  const [state, setState] = useState<AuthState>(initialState);

  const refresh = useCallback(async () => {
    try {
      setState((current) => ({ ...current, isLoading: true, error: null }));

      const sdkLike = sdk as unknown as MiniAppSdkLike;

      await sdkLike.actions?.ready?.();

      const [tokenRaw, context] = await Promise.all([
        sdkLike.quickAuth?.getToken?.(),
        getMiniAppContext(sdkLike)
      ]);

      const token = typeof tokenRaw === "string" ? tokenRaw : null;
      const wallet = context?.user?.verifiedAddresses?.ethAddresses?.[0] ?? null;
      const fid = context?.user?.fid ?? null;
      const normalizedWallet = normalizeWallet(wallet ?? "");

      if (!token || !fid || !isValidWallet(normalizedWallet)) {
        setState({ ...initialState, isLoading: false, error: BASE_APP_AUTH_MESSAGE });
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
      const message = shouldShowBaseAppMessage(error)
        ? BASE_APP_AUTH_MESSAGE
        : error instanceof Error
          ? error.message
          : "Authentication failed.";
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
