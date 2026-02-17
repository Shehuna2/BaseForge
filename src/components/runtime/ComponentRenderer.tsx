"use client";

import WalletConnectCard from "@/components/runtime/WalletConnectCard";
import { PlanId, RuntimeComponent, isHttpsUrl } from "@/lib/runtime/components";

type ComponentRendererProps = {
  components: RuntimeComponent[];
  planId: PlanId;
};

export default function ComponentRenderer({ components, planId }: ComponentRendererProps) {
  return (
    <div className="space-y-4">
      {components.map((component, index) => {
        if (component.type === "text") {
          return (
            <p key={`${component.type}-${index}`} className="text-base leading-relaxed text-slate-100">
              {component.content}
            </p>
          );
        }

        if (component.type === "button") {
          if (!isHttpsUrl(component.url)) {
            return null;
          }

          return (
            <a
              key={`${component.type}-${index}`}
              href={component.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-md bg-indigo-500 px-4 py-2 font-medium text-white"
            >
              {component.label}
            </a>
          );
        }

        if (component.type === "wallet_connect") {
          return planId === "pro" ? (
            <WalletConnectCard key={`${component.type}-${index}`} />
          ) : (
            <p key={`${component.type}-${index}`} className="rounded border border-amber-700 bg-amber-900/30 p-3 text-amber-200">
              Pro required for wallet connect.
            </p>
          );
        }

        return null;
      })}
    </div>
  );
}
