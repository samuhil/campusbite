"use client";

import { useEffect, useState, useCallback } from "react";

type MenuItem = {
  id: number;
  name: string;
  category: "meal" | "snack" | "drink" | "sweet";
  price: number;
  is_veg: boolean;
  stock: number;
  prep_minutes: number;
  description: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  meal: "Meals",
  snack: "Snacks",
  sweet: "Sweets",
  drink: "Drinks",
};

const CATEGORY_ORDER = ["meal", "snack", "sweet", "drink"];

export default function MenuPanel({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch("/api/menu");
      if (!res.ok) return;
      const data = await res.json();
      if (data.items) setItems(data.items);
    } catch (e) {
      console.error("Failed to load /api/menu", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
    const interval = setInterval(fetchMenu, 5000);
    return () => clearInterval(interval);
  }, [fetchMenu, refreshKey]);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat] || cat,
    items: items.filter((item) => item.category === cat),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="font-semibold text-slate-800">Today's Menu</h3>
        <span className="text-xs text-slate-400">Live stock</span>
      </div>

      {loading && items.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-400">Loading menu...</p>
      ) : (
        <div className="max-h-[380px] space-y-4 overflow-y-auto pr-1">
          {grouped.map((group) => (
            <div key={group.category}>
              <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                {group.label}
              </h4>
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50/70"
                  >
                    <div className="flex items-center gap-2">
                      {/* Veg / Non-veg dot */}
                      <span
                        className={`inline-flex h-3 w-3 items-center justify-center rounded-sm border ${
                          item.is_veg ? "border-emerald-600" : "border-rose-600"
                        }`}
                        title={item.is_veg ? "Vegetarian" : "Non-Vegetarian"}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.is_veg ? "bg-emerald-600" : "bg-rose-600"
                          }`}
                        />
                      </span>

                      <div>
                        <span className="font-medium text-slate-800">{item.name}</span>
                        {item.stock === 0 ? (
                          <span className="ml-2 inline-flex items-center rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
                            Sold out
                          </span>
                        ) : item.stock <= 3 ? (
                          <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                            Only {item.stock} left
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="font-semibold text-slate-700">
                      Rs {item.price}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
