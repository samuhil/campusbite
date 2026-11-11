"use client";

import { useState } from "react";
import Link from "next/link";
import AgentChat from "@/components/AgentChat";
import WalletOrders from "@/components/WalletOrders";
import MenuPanel from "@/components/MenuPanel";

export default function HomePage() {
  // Changes every time the agent writes data, so the components on the right reload.
  const [refreshKey, setRefreshKey] = useState(0);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">CampusBite</h1>
          <p className="text-sm text-slate-500">SRM canteen ordering agent</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/kitchen"
            target="_blank"
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800"
          >
            Open kitchen screen &rarr;
          </Link>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-900">
            Log out
          </button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-5">
        <section className="md:col-span-3">
          <AgentChat onDataChanged={() => setRefreshKey((k) => k + 1)} />
        </section>
        <section className="space-y-4 md:col-span-2">
          <WalletOrders refreshKey={refreshKey} />
          <MenuPanel refreshKey={refreshKey} />
        </section>
      </div>
    </main>
  );
}
