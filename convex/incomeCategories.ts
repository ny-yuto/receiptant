import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 収入カテゴリ一覧を取得
export const getIncomeCategories = query({
  handler: async (ctx) => {
    return await ctx.db.query("income_categories").order("asc").collect();
  },
});

// カテゴリIDで収入カテゴリを取得
export const getIncomeCategoryByCategoryId = query({
  args: {
    categoryId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("income_categories")
      .withIndex("by_category_id", (q) => q.eq("categoryId", args.categoryId))
      .first();
  },
});

// 初期収入カテゴリを作成（管理者用）
export const initializeIncomeCategories = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const existingCategories = await ctx.db
      .query("income_categories")
      .collect();

    if (existingCategories.length > 0) {
      return { message: "Income categories already initialized" };
    }

    const categories = [
      {
        categoryId: "INC001",
        name: "業務委託料",
        description: "請負・委任契約の報酬",
        withholding: true,
        sortOrder: 1,
      },
      {
        categoryId: "INC002",
        name: "原稿料",
        description: "執筆による報酬",
        withholding: true,
        sortOrder: 2,
      },
      {
        categoryId: "INC003",
        name: "講演料",
        description: "セミナー・講演の報酬",
        withholding: true,
        sortOrder: 3,
      },
      {
        categoryId: "INC004",
        name: "印税",
        description: "著作物による収入",
        withholding: false,
        sortOrder: 4,
      },
      {
        categoryId: "INC005",
        name: "広告収入",
        description: "アフィリエイト・広告収入",
        withholding: false,
        sortOrder: 5,
      },
      {
        categoryId: "INC006",
        name: "販売収入",
        description: "物品・サービスの販売",
        withholding: false,
        sortOrder: 6,
      },
      {
        categoryId: "INC007",
        name: "コンサルティング料",
        description: "助言・指導による報酬",
        withholding: true,
        sortOrder: 7,
      },
      {
        categoryId: "INC999",
        name: "その他",
        description: "上記に該当しない収入",
        withholding: false,
        sortOrder: 99,
      },
    ];

    for (const category of categories) {
      await ctx.db.insert("income_categories", category);
    }

    return { message: "Income categories initialized successfully" };
  },
});
