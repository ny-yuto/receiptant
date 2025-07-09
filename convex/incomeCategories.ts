import { mutation, query } from "./_generated/server";

// 収入カテゴリーの取得
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("incomeCategories")
      .order("asc")
      .collect();
  },
});

// 初期カテゴリーの作成（初回セットアップ用）
export const initializeCategories = mutation({
  args: {},
  handler: async (ctx) => {
    // 既存のカテゴリーがあるか確認
    const existing = await ctx.db.query("incomeCategories").first();
    if (existing) {
      return { message: "Categories already initialized" };
    }

    // フリーランス・個人事業主向けの収入カテゴリ
    const categories = [
      { name: "業務委託料", description: "クライアントからの業務委託報酬", withholding: true, sortOrder: 1 },
      { name: "コンサルティング料", description: "コンサルティング業務の報酬", withholding: true, sortOrder: 2 },
      { name: "開発報酬", description: "システム開発・プログラミングの報酬", withholding: true, sortOrder: 3 },
      { name: "デザイン料", description: "デザイン制作の報酬", withholding: true, sortOrder: 4 },
      { name: "執筆料", description: "記事執筆・ライティングの報酬", withholding: true, sortOrder: 5 },
      { name: "講演料", description: "セミナー・講演の報酬", withholding: true, sortOrder: 6 },
      { name: "印税", description: "出版物の印税収入", withholding: true, sortOrder: 7 },
      { name: "広告収入", description: "ブログ・YouTube等の広告収入", withholding: false, sortOrder: 8 },
      { name: "アフィリエイト収入", description: "アフィリエイト報酬", withholding: false, sortOrder: 9 },
      { name: "商品販売", description: "物品販売による収入", withholding: false, sortOrder: 10 },
      { name: "サブスクリプション", description: "月額課金サービスの収入", withholding: false, sortOrder: 11 },
      { name: "ロイヤリティ", description: "知的財産権のロイヤリティ収入", withholding: true, sortOrder: 12 },
      { name: "助成金・補助金", description: "公的機関からの助成金・補助金", withholding: false, sortOrder: 13 },
      { name: "その他収入", description: "上記以外の収入", withholding: false, sortOrder: 99 },
    ];

    // カテゴリーを一括挿入
    for (const category of categories) {
      await ctx.db.insert("incomeCategories", category);
    }

    return { message: "Income categories initialized successfully", count: categories.length };
  },
});