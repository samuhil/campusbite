import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";
import { formatSlot } from "@/lib/campusbite";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const updateStatusSchema = z.object({
  order_id: z.number().int().positive(),
  status: z.enum(["preparing", "ready", "collected"]),
});

const VALID_TRANSITIONS: Record<string, string> = {
  placed: "preparing",
  preparing: "ready",
  ready: "collected",
};

export async function GET() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("orders")
    .select(`
      id,
      student_id,
      status,
      total,
      created_at,
      wallets ( name ),
      pickup_slots ( slot_time ),
      order_items (
        quantity,
        price,
        menu_items ( name )
      )
    `)
    .in("status", ["placed", "preparing", "ready"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[GET /api/kitchen]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orders = (data || []).map((o: any) => {
    const studentName = Array.isArray(o.wallets)
      ? o.wallets[0]?.name
      : o.wallets?.name;

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
      student_id: o.student_id,
      student_name: studentName || o.student_id,
      status: o.status,
      total: o.total,
      pickup_time: formatSlot(slotTime || ""),
      created_at: o.created_at,
      items,
    };
  });

  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid status update", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { order_id, status: newStatus } = parsed.data;
  const sb = getSupabase();

  const { data: currentOrder, error: fetchError } = await sb
    .from("orders")
    .select("id, status")
    .eq("id", order_id)
    .single();

  if (fetchError || !currentOrder) {
    console.error("[POST /api/kitchen] order not found:", fetchError?.message);
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const expectedNext = VALID_TRANSITIONS[currentOrder.status];
  if (expectedNext !== newStatus) {
    console.error(`[POST /api/kitchen] invalid transition from ${currentOrder.status} to ${newStatus}`);
    return NextResponse.json(
      { error: `Cannot transition order ${order_id} from '${currentOrder.status}' to '${newStatus}'` },
      { status: 409 }
    );
  }

  const { data: updated, error: updateError } = await sb
    .from("orders")
    .update({ status: newStatus })
    .eq("id", order_id)
    .select()
    .single();

  if (updateError) {
    console.error("[POST /api/kitchen] update failed:", updateError.message);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ order: updated });
}
