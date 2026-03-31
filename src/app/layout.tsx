import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "JobOps — Job Application Automation",
  description: "Self-hosted job search automation: scrape, score, tailor, track.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full dark">
      <body className="min-h-full bg-zinc-950 text-zinc-100">
        <Providers>
          <div className="flex h-full min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-16 md:ml-56 min-h-screen overflow-auto">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
