import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "CyberPredict — AI Network Attack Forecasting",
  description:
    "An AI-driven network security platform that learns evolving communication behavior and forecasts potential attack progression.",
  keywords: ["cybersecurity", "network security", "attack forecasting", "GNN", "threat intelligence"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0e1a] text-slate-100 min-h-screen">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden cyber-grid">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
