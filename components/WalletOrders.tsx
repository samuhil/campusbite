"use client";

import { useEffect, useState, useCallback } from "react";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
};

type Order = {
  id: number;
  status: "placed" | "preparing" | "ready" | "collected" | "cancelled";
  total: number;
  pickup_time: string;
  created_at: string;
  items: OrderItem[];
};

type Wallet = {
  student_id: string;
  name: string;
  balance: number;
};

const STATUS_COLORS: Record<string, string> = {
  placed: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  preparing: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  ready: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  collected: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  cancelled: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

export default function WalletOrders({ refreshKey }: { refreshKey: number }) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      if (!res.ok) return;
      const data = await res.json();
      if (data.wallet) setWallet(data.wallet);
      if (data.orders) setOrders(data.orders);
    } catch (e) {
      console.error("Failed to load /api/me", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData, refreshKey]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-white shadow-sm">
      {/* Wallet Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Student Wallet</p>
          <h3 className="text-base font-semibold text-slate-100">
            {wallet ? `${wallet.name} (${wallet.student_id})` : "Loading..."}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Balance</p>
          <p className="text-xl font-bold text-emerald-400">
            {wallet !== null ? `Rs ${wallet.balance}` : "--"}
          </p>
        </div>
      </div>

      {/* Orders Section */}
      <div className="mt-3">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          My orders today
        </h4>

        {loading && orders.length === 0 ? (
          <p className="py-2 text-xs text-slate-500">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="py-2 text-xs text-slate-500">No orders placed yet today.</p>
        ) : (
          <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
            {orders.map((o) => (
              <div
                key={o.id}
                className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Order #{o.id}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                      STATUS_COLORS[o.status] || "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    {o.status}
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between text-slate-400">
                  <span>Pickup: {o.pickup_time || "Today"}</span>
                  <span className="font-semibold text-emerald-400">Rs {o.total}</span>
                </div>

                {o.items && o.items.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5 border-t border-slate-800/80 pt-1 text-[11px] text-slate-300">
                    {o.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-slate-400">Rs {item.price * item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
