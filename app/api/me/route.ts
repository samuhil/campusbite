import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { CURRENT_STUDENT_ID, formatSlot } from "@/lib/campusbite";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const sb = getSupabase();

  const { data: wallet, error: walletError } = await sb
    .from("wallets")
    .select("student_id, name, balance")
    .eq("student_id", CURRENT_STUDENT_ID)
    .single();

  if (walletError) {
    console.error("[GET /api/me] wallet error:", walletError.message);
    return NextResponse.json({ error: walletError.message }, { status: 500 });
  }

  const { data: orders, error: ordersError } = await sb
    .from("orders")
    .select(`
      id,
      status,
      total,
      created_at,
      pickup_slots ( slot_time ),
      order_items (
        quantity,
        price,
        menu_items ( name )
      )
    `)
    .eq("student_id", CURRENT_STUDENT_ID)
    .order("created_at", { ascending: false })
    .limit(5);

  if (ordersError) {
    console.error("[GET /api/me] orders error:", ordersError.message);
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }

  const formattedOrders = (orders || []).map((o: any) => {
    const slotTime = Array.isArray(o.pickup_slots)
      ? o.pickup_slots[0]?.slot_time
      : o.pickup_slots?.slot_time;

    const items = (o.order_items || []).map((item: any) => {
      const itemName = Array.isArray(item.menu_items)
        ? item.menu_items[0]?.name
        : item.menu_items?.name;
      return {
        name: itemName || "Unknown item",
        quantity: item.quantity,
        price: item.price,
      };
    });

    return {
      id: o.id,
      status: o.status,
      total: o.total,
      pickup_time: formatSlot(slotTime || ""),
      created_at: o.created_at,
      items,
    };
  });

  return NextResponse.json({
    wallet,
    orders: formattedOrders,
  });
}
