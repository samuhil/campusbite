import "server-only";
import { z } from "zod";
import { defineTool, type AgentTool } from "./defineTool";
import { getSupabase } from "../supabase";
import { CURRENT_STUDENT_ID, formatSlot } from "../campusbite";

const getMenu = defineTool({
  name: "getMenu",
  description:
    "Use this when the student asks to see the canteen menu or food options. Can filter by category, veg_only, or max_price.",
  schema: z.object({
    category: z
      .enum(["meal", "snack", "drink", "sweet"])
      .optional()
      .describe("Filter by food category"),
    veg_only: z.boolean().optional().describe("If true, return only vegetarian items"),
    max_price: z.number().int().positive().optional().describe("Filter items with price <= max_price"),
  }),
  run: async ({ category, veg_only, max_price }) => {
    let query = getSupabase()
      .from("menu_items")
      .select("id, name, category, price, is_veg, stock, description")
      .gt("stock", 0)
      .order("category", { ascending: true })
      .order("price", { ascending: true });

    if (category) query = query.eq("category", category);
    if (veg_only) query = query.eq("is_veg", true);
    if (max_price !== undefined) query = query.lte("price", max_price);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { items: data };
  },
});

const getWalletBalance = defineTool({
  name: "getWalletBalance",
  description: "Use this when checking the student's current wallet balance and name.",
  schema: z.object({}),
  run: async () => {
    const { data, error } = await getSupabase()
      .from("wallets")
      .select("name, balance")
      .eq("student_id", CURRENT_STUDENT_ID)
      .single();

    if (error) throw new Error(error.message);
    return { name: data.name, balance: data.balance };
  },
});

const getPickupSlots = defineTool({
  name: "getPickupSlots",
  description: "Use this when finding available pickup slots today between 12:00 pm and 2:30 pm.",
  schema: z.object({}),
  run: async () => {
    const { data, error } = await getSupabase()
      .from("pickup_slots")
      .select("id, slot_time, capacity, booked")
      .order("slot_time", { ascending: true });

    if (error) throw new Error(error.message);

    const available = (data || [])
      .map((s) => ({
        slot_id: s.id,
        time: formatSlot(s.slot_time),
        free: s.capacity - s.booked,
      }))
      .filter((s) => s.free > 0);

    return { slots: available };
  },
});

const getMyOrders = defineTool({
  name: "getMyOrders",
  description: "Use this when checking the student's past or active orders today.",
  schema: z.object({}),
  run: async () => {
    const { data, error } = await getSupabase()
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
      .limit(10);

    if (error) throw new Error(error.message);

    const orders = (data || []).map((o: any) => {
      const slotTime = Array.isArray(o.pickup_slots)
        ? o.pickup_slots[0]?.slot_time
        : o.pickup_slots?.slot_time;

      const items = (o.order_items || []).map((item: any) => {
        const itemName = Array.isArray(item.menu_items)
          ? item.menu_items[0]?.name
          : item.menu_items?.name;
        return `${item.quantity}x ${itemName || "Item"} (Rs ${item.price})`;
      });

      return {
        id: o.id,
        status: o.status,
        total: o.total,
        pickup_time: formatSlot(slotTime || ""),
        items,
      };
    });

    return { count: orders.length, orders };
  },
});

const placeOrder = defineTool({
  name: "placeOrder",
  description:
    "Use this when placing a food order for the student. Call this only after checking menu items and available pickup slots.",
  writes: true,
  schema: z.object({
    items: z
      .array(
        z.object({
          menu_item_id: z.number().int().positive().describe("ID of the menu item"),
          quantity: z.number().int().min(1).max(5).describe("Quantity between 1 and 5"),
        })
      )
      .min(1)
      .describe("List of items to order (at least 1)"),
    slot_id: z.number().int().positive().describe("ID of the pickup slot"),
  }),
  run: async ({ items, slot_id }) => {
    const { data, error } = await getSupabase().rpc("place_order", {
      p_student_id: CURRENT_STUDENT_ID,
      p_slot_id: slot_id,
      p_items: items,
    });
    if (error) throw new Error(error.message);
    return data;
  },
});

const cancelOrder = defineTool({
  name: "cancelOrder",
  description: "Use this when the student explicitly asks to cancel an order.",
  writes: true,
  schema: z.object({
    order_id: z.number().int().positive().describe("ID of the order to cancel"),
  }),
  run: async ({ order_id }) => {
    const { data, error } = await getSupabase().rpc("cancel_order", {
      p_student_id: CURRENT_STUDENT_ID,
      p_order_id: order_id,
    });
    if (error) throw new Error(error.message);
    return data;
  },
});

export const tools: AgentTool[] = [
  getMenu,
  getWalletBalance,
  getPickupSlots,
  getMyOrders,
  placeOrder,
  cancelOrder,
];
