import { query } from "./_generated/server";
import { v } from "convex/values";

// 月別収支データを取得
export const getMonthlyBalances = query({
  args: {
    year: v.optional(v.float64()),
    limit: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    // 対象年を決定（指定がなければ今年）
    const targetYear = args.year || new Date().getFullYear();
    const startDate = `${targetYear}-01-01`;
    const endDate = `${targetYear}-12-31`;

    // 収入を取得
    const incomes = await ctx.db
      .query("incomes")
      .withIndex("by_date", (q) =>
        q.eq("userId", user._id).gte("date", startDate)
      )
      .filter((q) => q.lte(q.field("date"), endDate))
      .collect();

    // 経費を取得
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_date", (q) =>
        q.eq("userId", user._id).gte("date", startDate)
      )
      .filter((q) => q.lte(q.field("date"), endDate))
      .collect();

    // 月別に集計
    const monthlyData: Record<
      string,
      {
        month: string;
        income: number;
        withholdingAmount: number;
        netIncome: number;
        expenses: number;
        balance: number;
      }
    > = {};

    // 12ヶ月分のデータを初期化
    for (let month = 1; month <= 12; month++) {
      const monthStr = `${targetYear}-${month.toString().padStart(2, "0")}`;
      monthlyData[monthStr] = {
        month: monthStr,
        income: 0,
        withholdingAmount: 0,
        netIncome: 0,
        expenses: 0,
        balance: 0,
      };
    }

    // 収入の月別集計
    incomes.forEach((income) => {
      const month = income.date.substring(0, 7); // YYYY-MM
      if (monthlyData[month]) {
        monthlyData[month].income += income.amount;
        monthlyData[month].withholdingAmount += income.withholdingAmount || 0;
      }
    });

    // 経費の月別集計
    expenses.forEach((expense) => {
      const month = expense.date.substring(0, 7); // YYYY-MM
      if (monthlyData[month]) {
        monthlyData[month].expenses += expense.amount;
      }
    });

    // 手取り収入と収支を計算
    Object.keys(monthlyData).forEach((month) => {
      const data = monthlyData[month];
      data.netIncome = data.income - data.withholdingAmount;
      data.balance = data.netIncome - data.expenses;
    });

    // 配列に変換してソート（古い月から新しい月へ）
    const result = Object.values(monthlyData).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    // limitが指定されていれば制限
    if (args.limit) {
      return result.slice(0, args.limit);
    }

    return result;
  },
});

// 年別収支データを取得
export const getYearlyBalances = query({
  args: {
    years: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    const yearsToShow = args.years || 3;
    const currentYear = new Date().getFullYear();
    const yearlyData: Array<{
      year: number;
      income: number;
      withholdingAmount: number;
      netIncome: number;
      expenses: number;
      balance: number;
    }> = [];

    for (let i = 0; i < yearsToShow; i++) {
      const year = currentYear - i;
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      // 収入を取得
      const incomes = await ctx.db
        .query("incomes")
        .withIndex("by_date", (q) =>
          q.eq("userId", user._id).gte("date", startDate)
        )
        .filter((q) => q.lte(q.field("date"), endDate))
        .collect();

      // 経費を取得
      const expenses = await ctx.db
        .query("expenses")
        .withIndex("by_date", (q) =>
          q.eq("userId", user._id).gte("date", startDate)
        )
        .filter((q) => q.lte(q.field("date"), endDate))
        .collect();

      // 集計
      const totalIncome = incomes.reduce(
        (sum, income) => sum + income.amount,
        0
      );
      const totalWithholding = incomes.reduce(
        (sum, income) => sum + (income.withholdingAmount || 0),
        0
      );
      const totalExpenses = expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
      const netIncome = totalIncome - totalWithholding;
      const balance = netIncome - totalExpenses;

      yearlyData.push({
        year,
        income: totalIncome,
        withholdingAmount: totalWithholding,
        netIncome,
        expenses: totalExpenses,
        balance,
      });
    }

    return yearlyData;
  },
});