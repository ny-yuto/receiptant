import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 経費カテゴリ一覧を取得
export const getExpenseCategories = query({
  handler: async (ctx) => {
    return await ctx.db.query("expense_categories").order("asc").collect();
  },
});

// カテゴリIDで経費カテゴリを取得
export const getExpenseCategoryByCategoryId = query({
  args: {
    categoryId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("expense_categories")
      .withIndex("by_category_id", (q) => q.eq("categoryId", args.categoryId))
      .first();
  },
});

// 初期経費カテゴリを作成（管理者用）
export const initializeExpenseCategories = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const existingCategories = await ctx.db
      .query("expense_categories")
      .collect();

    if (existingCategories.length > 0) {
      return { message: "Expense categories already initialized" };
    }

    const categories = [
      {
        categoryId: "EXP001",
        name: "交通費",
        description: "電車、バス、タクシー等",
        taxDeductible: true,
        sortOrder: 1,
      },
      {
        categoryId: "EXP002",
        name: "会議費",
        description: "打ち合わせ、接待等",
        taxDeductible: true,
        sortOrder: 2,
      },
      {
        categoryId: "EXP003",
        name: "消耗品費",
        description: "事務用品、備品等",
        taxDeductible: true,
        sortOrder: 3,
      },
      {
        categoryId: "EXP004",
        name: "通信費",
        description: "電話、インターネット等",
        taxDeductible: true,
        sortOrder: 4,
      },
      {
        categoryId: "EXP005",
        name: "図書研究費",
        description: "書籍、資料等",
        taxDeductible: true,
        sortOrder: 5,
      },
      {
        categoryId: "EXP006",
        name: "外注費",
        description: "業務委託、外部サービス等",
        taxDeductible: true,
        sortOrder: 6,
      },
      {
        categoryId: "EXP007",
        name: "広告宣伝費",
        description: "広告、PR活動等",
        taxDeductible: true,
        sortOrder: 7,
      },
      {
        categoryId: "EXP999",
        name: "その他",
        description: "上記に該当しない経費",
        taxDeductible: true,
        sortOrder: 99,
      },
    ];

    for (const category of categories) {
      await ctx.db.insert("expense_categories", category);
    }

    return { message: "Expense categories initialized successfully" };
  },
});
