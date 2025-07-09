import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 収入を作成
export const createIncome = mutation({
  args: {
    date: v.string(),
    amount: v.float64(),
    categoryId: v.string(),
    client: v.string(),
    description: v.optional(v.string()),
    projectName: v.optional(v.string()),
    paymentMethodId: v.optional(v.string()),
    withholding: v.optional(v.boolean()),
    withholdingAmount: v.optional(v.float64()),
    withholdingRate: v.optional(v.float64()),
    invoiceNumber: v.optional(v.string()),
    invoiceIssued: v.optional(v.boolean()),
    invoiceDate: v.optional(v.string()),
    taxRate: v.optional(v.float64()),
    projectCode: v.optional(v.string()),
    receivedDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // 税額計算
    let taxAmount = undefined;
    let taxExcludedAmount = undefined;
    if (args.taxRate !== undefined && args.taxRate > 0) {
      taxExcludedAmount = args.amount / (1 + args.taxRate / 100);
      taxAmount = args.amount - taxExcludedAmount;
    }

    // 源泉徴収額の計算（指定がない場合）
    let withholdingAmount = args.withholdingAmount;
    if (args.withholding && !withholdingAmount && args.withholdingRate) {
      withholdingAmount = args.amount * (args.withholdingRate / 100);
    }

    const incomeId = await ctx.db.insert("incomes", {
      userId: user._id,
      date: args.date,
      amount: args.amount,
      categoryId: args.categoryId,
      client: args.client,
      description: args.description,
      projectName: args.projectName,
      paymentMethodId: args.paymentMethodId,
      withholding: args.withholding,
      withholdingAmount,
      withholdingRate: args.withholdingRate,
      invoiceNumber: args.invoiceNumber,
      invoiceIssued: args.invoiceIssued,
      invoiceDate: args.invoiceDate,
      taxRate: args.taxRate,
      taxAmount,
      taxExcludedAmount,
      projectCode: args.projectCode,
      status: args.receivedDate ? "received" : "confirmed",
      receivedDate: args.receivedDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return incomeId;
  },
});

// ユーザーの収入一覧を取得
export const getUserIncomes = query({
  args: {
    limit: v.optional(v.float64()),
    status: v.optional(v.string()),
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

    let query;
    if (args.status) {
      query = ctx.db
        .query("incomes")
        .withIndex("by_status", (q) =>
          q.eq("userId", user._id).eq("status", args.status!)
        );
    } else {
      query = ctx.db
        .query("incomes")
        .withIndex("by_user", (q) => q.eq("userId", user._id));
    }

    const incomes = await query.order("desc").take(args.limit || 50);

    return incomes;
  },
});

// 今月の収入合計を取得
export const getMonthlyTotal = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { total: 0, withholdingTotal: 0, netTotal: 0 };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return { total: 0, withholdingTotal: 0, netTotal: 0 };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDateStr = startOfMonth.toISOString().split("T")[0];

    const incomes = await ctx.db
      .query("incomes")
      .withIndex("by_date", (q) =>
        q.eq("userId", user._id).gte("date", startDateStr)
      )
      .collect();

    const total = incomes.reduce((sum, income) => sum + income.amount, 0);
    const withholdingTotal = incomes.reduce(
      (sum, income) => sum + (income.withholdingAmount || 0),
      0
    );

    return {
      total,
      withholdingTotal,
      netTotal: total - withholdingTotal,
    };
  },
});

// 高度な検索・フィルタリング
export const searchIncomes = query({
  args: {
    // 検索条件
    searchText: v.optional(v.string()),
    categoryId: v.optional(v.string()),
    status: v.optional(v.string()),
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
    amountMin: v.optional(v.float64()),
    amountMax: v.optional(v.float64()),
    client: v.optional(v.string()),
    projectCode: v.optional(v.string()),
    withholding: v.optional(v.boolean()),
    invoiceIssued: v.optional(v.boolean()),
    // ページネーション
    limit: v.optional(v.float64()),
    cursor: v.optional(v.string()),
    // ソート
    sortBy: v.optional(v.string()), // "date", "amount", "client"
    sortOrder: v.optional(v.string()), // "asc", "desc"
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { incomes: [], hasMore: false, nextCursor: null };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return { incomes: [], hasMore: false, nextCursor: null };
    }

    // 全収入を取得（後でフィルタリング）
    const allIncomes = await ctx.db
      .query("incomes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // フィルタリング
    let filteredIncomes = allIncomes;

    // テキスト検索
    if (args.searchText) {
      const searchLower = args.searchText.toLowerCase();
      filteredIncomes = filteredIncomes.filter(
        (income) =>
          income.client.toLowerCase().includes(searchLower) ||
          (income.description &&
            income.description.toLowerCase().includes(searchLower)) ||
          (income.projectName &&
            income.projectName.toLowerCase().includes(searchLower)) ||
          (income.invoiceNumber &&
            income.invoiceNumber.toLowerCase().includes(searchLower))
      );
    }

    // カテゴリフィルタ
    if (args.categoryId) {
      filteredIncomes = filteredIncomes.filter(
        (income) => income.categoryId === args.categoryId
      );
    }

    // ステータスフィルタ
    if (args.status) {
      filteredIncomes = filteredIncomes.filter(
        (income) => income.status === args.status
      );
    }

    // 日付範囲フィルタ
    if (args.dateFrom) {
      filteredIncomes = filteredIncomes.filter(
        (income) => income.date >= args.dateFrom!
      );
    }
    if (args.dateTo) {
      filteredIncomes = filteredIncomes.filter(
        (income) => income.date <= args.dateTo!
      );
    }

    // 金額範囲フィルタ
    if (args.amountMin !== undefined) {
      filteredIncomes = filteredIncomes.filter(
        (income) => income.amount >= args.amountMin!
      );
    }
    if (args.amountMax !== undefined) {
      filteredIncomes = filteredIncomes.filter(
        (income) => income.amount <= args.amountMax!
      );
    }

    // クライアントフィルタ
    if (args.client) {
      filteredIncomes = filteredIncomes.filter(
        (income) => income.client === args.client
      );
    }

    // プロジェクトコードフィルタ
    if (args.projectCode) {
      filteredIncomes = filteredIncomes.filter(
        (income) => income.projectCode === args.projectCode
      );
    }

    // 源泉徴収フィルタ
    if (args.withholding !== undefined) {
      filteredIncomes = filteredIncomes.filter(
        (income) => income.withholding === args.withholding
      );
    }

    // インボイス発行フィルタ
    if (args.invoiceIssued !== undefined) {
      filteredIncomes = filteredIncomes.filter(
        (income) => income.invoiceIssued === args.invoiceIssued
      );
    }

    // ソート
    const sortBy = args.sortBy || "date";
    const sortOrder = args.sortOrder || "desc";
    filteredIncomes.sort((a, b) => {
      let compareValue = 0;
      switch (sortBy) {
        case "date":
          compareValue = a.date.localeCompare(b.date);
          break;
        case "amount":
          compareValue = a.amount - b.amount;
          break;
        case "client":
          compareValue = a.client.localeCompare(b.client);
          break;
        default:
          compareValue = b.createdAt - a.createdAt;
      }
      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    // ページネーション
    const limit = args.limit || 20;
    const startIndex = args.cursor ? parseInt(args.cursor) : 0;
    const paginatedIncomes = filteredIncomes.slice(
      startIndex,
      startIndex + limit
    );
    const hasMore = startIndex + limit < filteredIncomes.length;
    const nextCursor = hasMore ? String(startIndex + limit) : null;

    return {
      incomes: paginatedIncomes,
      hasMore,
      nextCursor,
      totalCount: filteredIncomes.length,
    };
  },
});

// 集計データを取得
export const getIncomesSummary = query({
  args: {
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return null;
    }

    let incomes = await ctx.db
      .query("incomes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // 日付範囲フィルタ
    if (args.dateFrom) {
      incomes = incomes.filter((income) => income.date >= args.dateFrom!);
    }
    if (args.dateTo) {
      incomes = incomes.filter((income) => income.date <= args.dateTo!);
    }

    // カテゴリ別集計
    const categoryTotals = incomes.reduce(
      (acc, income) => {
        if (!acc[income.categoryId]) {
          acc[income.categoryId] = {
            count: 0,
            amount: 0,
            withholdingAmount: 0,
          };
        }
        acc[income.categoryId].count += 1;
        acc[income.categoryId].amount += income.amount;
        acc[income.categoryId].withholdingAmount +=
          income.withholdingAmount || 0;
        return acc;
      },
      {} as Record<
        string,
        { count: number; amount: number; withholdingAmount: number }
      >
    );

    // クライアント別集計
    const clientTotals = incomes.reduce(
      (acc, income) => {
        if (!acc[income.client]) {
          acc[income.client] = { count: 0, amount: 0, withholdingAmount: 0 };
        }
        acc[income.client].count += 1;
        acc[income.client].amount += income.amount;
        acc[income.client].withholdingAmount += income.withholdingAmount || 0;
        return acc;
      },
      {} as Record<
        string,
        { count: number; amount: number; withholdingAmount: number }
      >
    );

    const totalAmount = incomes.reduce((sum, income) => sum + income.amount, 0);
    const totalWithholdingAmount = incomes.reduce(
      (sum, income) => sum + (income.withholdingAmount || 0),
      0
    );

    return {
      totalAmount,
      totalWithholdingAmount,
      netAmount: totalAmount - totalWithholdingAmount,
      totalCount: incomes.length,
      categoryTotals,
      clientTotals,
    };
  },
});

// 収入を更新
export const updateIncome = mutation({
  args: {
    id: v.id("incomes"),
    date: v.optional(v.string()),
    amount: v.optional(v.float64()),
    categoryId: v.optional(v.string()),
    client: v.optional(v.string()),
    description: v.optional(v.string()),
    projectName: v.optional(v.string()),
    paymentMethodId: v.optional(v.string()),
    withholding: v.optional(v.boolean()),
    withholdingAmount: v.optional(v.float64()),
    withholdingRate: v.optional(v.float64()),
    invoiceNumber: v.optional(v.string()),
    invoiceIssued: v.optional(v.boolean()),
    invoiceDate: v.optional(v.string()),
    taxRate: v.optional(v.float64()),
    projectCode: v.optional(v.string()),
    status: v.optional(v.string()),
    receivedDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const income = await ctx.db.get(args.id);
    if (!income) {
      throw new Error("Income not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || income.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...updateData } = args;

    // 税額再計算
    let taxExcludedAmount = undefined;
    let taxAmount = undefined;
    if (updateData.amount !== undefined || updateData.taxRate !== undefined) {
      const amount = updateData.amount ?? income.amount;
      const taxRate = updateData.taxRate ?? income.taxRate;
      if (taxRate && taxRate > 0) {
        taxExcludedAmount = amount / (1 + taxRate / 100);
        taxAmount = amount - taxExcludedAmount;
      }
    }

    // 源泉徴収額再計算
    let withholdingAmount = updateData.withholdingAmount;
    if (
      updateData.withholding !== undefined ||
      updateData.withholdingRate !== undefined ||
      updateData.amount !== undefined
    ) {
      const withholding = updateData.withholding ?? income.withholding;
      const withholdingRate =
        updateData.withholdingRate ?? income.withholdingRate;
      const amount = updateData.amount ?? income.amount;
      if (withholding && !withholdingAmount && withholdingRate) {
        withholdingAmount = amount * (withholdingRate / 100);
      }
    }

    await ctx.db.patch(args.id, {
      ...updateData,
      ...(taxExcludedAmount !== undefined && { taxExcludedAmount }),
      ...(taxAmount !== undefined && { taxAmount }),
      ...(withholdingAmount !== undefined && { withholdingAmount }),
      updatedAt: Date.now(),
    });
  },
});

// 収入を削除
export const deleteIncome = mutation({
  args: {
    id: v.id("incomes"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const income = await ctx.db.get(args.id);
    if (!income) {
      throw new Error("Income not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || income.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

// 収支計算（収入 - 経費）
export const getBalanceSummary = query({
  args: {
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return null;
    }

    // 収入を取得
    let incomes = await ctx.db
      .query("incomes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // 経費を取得
    let expenses = await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // 日付範囲フィルタ
    if (args.dateFrom) {
      incomes = incomes.filter((income) => income.date >= args.dateFrom!);
      expenses = expenses.filter((expense) => expense.date >= args.dateFrom!);
    }
    if (args.dateTo) {
      incomes = incomes.filter((income) => income.date <= args.dateTo!);
      expenses = expenses.filter((expense) => expense.date <= args.dateTo!);
    }

    // 集計
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    const totalWithholding = incomes.reduce(
      (sum, income) => sum + (income.withholdingAmount || 0),
      0
    );
    const netIncome = totalIncome - totalWithholding;
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const balance = netIncome - totalExpenses;

    // 月別集計
    const monthlyData: Record<
      string,
      {
        income: number;
        withholding: number;
        expenses: number;
        balance: number;
      }
    > = {};

    // 収入の月別集計
    incomes.forEach((income) => {
      const month = income.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = {
          income: 0,
          withholding: 0,
          expenses: 0,
          balance: 0,
        };
      }
      monthlyData[month].income += income.amount;
      monthlyData[month].withholding += income.withholdingAmount || 0;
    });

    // 経費の月別集計
    expenses.forEach((expense) => {
      const month = expense.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = {
          income: 0,
          withholding: 0,
          expenses: 0,
          balance: 0,
        };
      }
      monthlyData[month].expenses += expense.amount;
    });

    // 月別収支計算
    Object.keys(monthlyData).forEach((month) => {
      const data = monthlyData[month];
      data.balance = data.income - data.withholding - data.expenses;
    });

    return {
      totalIncome,
      totalWithholding,
      netIncome,
      totalExpenses,
      balance,
      incomeCount: incomes.length,
      expenseCount: expenses.length,
      monthlyData,
    };
  },
});
