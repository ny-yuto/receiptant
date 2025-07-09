import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 支払方法一覧を取得
export const getPaymentMethods = query({
  args: {
    type: v.optional(v.string()), // expense, income, both
  },
  handler: async (ctx, args) => {
    if (args.type) {
      return await ctx.db
        .query("payment_methods")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .order("asc")
        .collect();
    }

    return await ctx.db.query("payment_methods").order("asc").collect();
  },
});

// 支払方法IDで取得
export const getPaymentMethodByMethodId = query({
  args: {
    methodId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payment_methods")
      .withIndex("by_method_id", (q) => q.eq("methodId", args.methodId))
      .first();
  },
});

// 初期支払方法を作成（管理者用）
export const initializePaymentMethods = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const existingMethods = await ctx.db.query("payment_methods").collect();

    if (existingMethods.length > 0) {
      return { message: "Payment methods already initialized" };
    }

    const paymentMethods = [
      { methodId: "PM001", name: "現金", type: "both", sortOrder: 1 },
      {
        methodId: "PM002",
        name: "クレジットカード",
        type: "expense",
        sortOrder: 2,
      },
      { methodId: "PM003", name: "電子マネー", type: "expense", sortOrder: 3 },
      { methodId: "PM004", name: "銀行振込", type: "both", sortOrder: 4 },
      {
        methodId: "PM005",
        name: "デビットカード",
        type: "expense",
        sortOrder: 5,
      },
      { methodId: "PM006", name: "口座引落", type: "expense", sortOrder: 6 },
      { methodId: "PM007", name: "PayPay", type: "expense", sortOrder: 7 },
      { methodId: "PM008", name: "その他", type: "both", sortOrder: 99 },
    ];

    for (const method of paymentMethods) {
      await ctx.db.insert("payment_methods", method);
    }

    return { message: "Payment methods initialized successfully" };
  },
});
