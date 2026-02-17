export type PlanId = "basic" | "pro";

export type TextComponent = {
  type: "text";
  content: string;
};

export type ButtonComponent = {
  type: "button";
  label: string;
  url: string;
};

export type WalletConnectComponent = {
  type: "wallet_connect";
};

export type RuntimeComponent = TextComponent | ButtonComponent | WalletConnectComponent;

const PLAN_COMPONENT_LIMITS: Record<PlanId, number> = {
  basic: 5,
  pro: 25
};

export const isHttpsUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const parseComponent = (value: unknown): RuntimeComponent | null => {
  const obj = asRecord(value);
  if (!obj || typeof obj.type !== "string") {
    return null;
  }

  if (obj.type === "text" && typeof obj.content === "string" && obj.content.trim().length > 0) {
    return { type: "text", content: obj.content };
  }

  if (
    obj.type === "button" &&
    typeof obj.label === "string" &&
    obj.label.trim().length > 0 &&
    typeof obj.url === "string" &&
    isHttpsUrl(obj.url)
  ) {
    return { type: "button", label: obj.label, url: obj.url };
  }

  if (obj.type === "wallet_connect") {
    return { type: "wallet_connect" };
  }

  return null;
};

export const sanitizeComponentsForPlan = (components: unknown, planId: PlanId): RuntimeComponent[] => {
  if (!Array.isArray(components)) {
    return [];
  }

  const limit = PLAN_COMPONENT_LIMITS[planId] ?? PLAN_COMPONENT_LIMITS.basic;
  const safeComponents: RuntimeComponent[] = [];

  for (const rawComponent of components) {
    if (safeComponents.length >= limit) {
      break;
    }

    const parsed = parseComponent(rawComponent);
    if (parsed) {
      safeComponents.push(parsed);
    }
  }

  return safeComponents;
};

export const buildConfigJson = (components: RuntimeComponent[]): Record<string, unknown> => {
  return {
    components
  };
};
