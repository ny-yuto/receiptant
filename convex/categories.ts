import { mutation, query } from "./_generated/server";

// カテゴリ一覧を取得
export const getCategories = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("expenseCategories")
      .order("asc")
      .collect();
  },
});

// 初期カテゴリを作成（管理者用）
export const initializeCategories = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const existingCategories = await ctx.db
      .query("expenseCategories")
      .collect();

    if (existingCategories.length > 0) {
      return { message: "Categories already initialized" };
    }

    const categories = [
      { name: "交通費", description: "電車、バス、タクシー等", taxDeductible: true, sortOrder: 1 },
      { name: "会議費", description: "打ち合わせ、接待等", taxDeductible: true, sortOrder: 2 },
      { name: "消耗品費", description: "事務用品、備品等", taxDeductible: true, sortOrder: 3 },
      { name: "通信費", description: "電話、インターネット等", taxDeductible: true, sortOrder: 4 },
      { name: "図書研究費", description: "書籍、資料等", taxDeductible: true, sortOrder: 5 },
      { name: "外注費", description: "業務委託、外部サービス等", taxDeductible: true, sortOrder: 6 },
      { name: "広告宣伝費", description: "広告、PR活動等", taxDeductible: true, sortOrder: 7 },
      { name: "その他", description: "上記に該当しない経費", taxDeductible: true, sortOrder: 99 },
    ];

    for (const category of categories) {
      await ctx.db.insert("expenseCategories", category);
    }

    return { message: "Categories initialized successfully" };
  },
});