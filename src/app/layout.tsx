import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BaseForge v2",
  description: "Phase 0 dashboard and draft project builder"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto min-h-screen max-w-4xl p-6">{children}</main>
      </body>
    </html>
  );
}
