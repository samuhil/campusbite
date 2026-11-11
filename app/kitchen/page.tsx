"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type KitchenOrderItem = {
  name: string;
  quantity: number;
  price: number;
};

type KitchenOrder = {
  id: number;
  student_id: string;
  student_name: string;
  status: "placed" | "preparing" | "ready" | "collected";
  total: number;
  pickup_time: string;
  created_at: string;
  items: KitchenOrderItem[];
};

export default function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/kitchen");
      if (!res.ok) return;
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch (e) {
      console.error("Failed to load /api/kitchen", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  async function updateStatus(orderId: number, nextStatus: "preparing" | "ready" | "collected") {
    setUpdatingId(orderId);
    try {
      const res = await fetch("/api/kitchen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, status: nextStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        console.error("Status update failed:", err);
      }
      await fetchOrders();
    } catch (e) {
      console.error("Error updating order status:", e);
    } finally {
      setUpdatingId(null);
    }
  }

  const placedOrders = orders.filter((o) => o.status === "placed");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Kitchen Live Board</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          &larr; Back to Student Screen
        </Link>
      </header>

      {/* 3 Columns Board */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Column 1: New orders */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col">
          <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="font-semibold text-blue-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              New Orders ({placedOrders.length})
            </h2>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {placedOrders.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">No new orders waiting</p>
            ) : (
              placedOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-lg border border-slate-800 bg-slate-950 p-3 shadow-sm hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-100">Order #{order.id}</span>
                    <span className="rounded bg-blue-950 px-2 py-0.5 text-xs font-medium text-blue-300">
                      {order.pickup_time || "Today"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-400 font-medium">
                    Student: <span className="text-slate-200">{order.student_name}</span>
                  </p>

                  <div className="my-2 border-t border-slate-800/80 pt-2 space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-300">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-slate-500">Rs {item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span className="text-xs font-semibold text-slate-300">
                      Total: Rs {order.total}
                    </span>
                    <button
                      disabled={updatingId === order.id}
                      onClick={() => updateStatus(order.id, "preparing")}
                      className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 transition disabled:opacity-50"
                    >
                      {updatingId === order.id ? "Updating..." : "Start preparing"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Column 2: Preparing */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col">
          <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="font-semibold text-amber-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Preparing ({preparingOrders.length})
            </h2>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {preparingOrders.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">No orders cooking</p>
            ) : (
              preparingOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-lg border border-slate-800 bg-slate-950 p-3 shadow-sm hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-100">Order #{order.id}</span>
                    <span className="rounded bg-amber-950 px-2 py-0.5 text-xs font-medium text-amber-300">
                      {order.pickup_time || "Today"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-400 font-medium">
                    Student: <span className="text-slate-200">{order.student_name}</span>
                  </p>

                  <div className="my-2 border-t border-slate-800/80 pt-2 space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-300">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-slate-500">Rs {item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span className="text-xs font-semibold text-slate-300">
                      Total: Rs {order.total}
                    </span>
                    <button
                      disabled={updatingId === order.id}
                      onClick={() => updateStatus(order.id, "ready")}
                      className="rounded bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500 transition disabled:opacity-50"
                    >
                      {updatingId === order.id ? "Updating..." : "Mark ready"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Column 3: Ready for pickup */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col">
          <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="font-semibold text-emerald-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Ready for Pickup ({readyOrders.length})
            </h2>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {readyOrders.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">No orders ready for pickup</p>
            ) : (
              readyOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-lg border border-slate-800 bg-slate-950 p-3 shadow-sm hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-100">Order #{order.id}</span>
                    <span className="rounded bg-emerald-950 px-2 py-0.5 text-xs font-medium text-emerald-300">
                      {order.pickup_time || "Today"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-400 font-medium">
                    Student: <span className="text-slate-200">{order.student_name}</span>
                  </p>

                  <div className="my-2 border-t border-slate-800/80 pt-2 space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-300">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-slate-500">Rs {item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span className="text-xs font-semibold text-slate-300">
                      Total: Rs {order.total}
                    </span>
                    <button
                      disabled={updatingId === order.id}
                      onClick={() => updateStatus(order.id, "collected")}
                      className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition disabled:opacity-50"
                    >
                      {updatingId === order.id ? "Updating..." : "Collected"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
