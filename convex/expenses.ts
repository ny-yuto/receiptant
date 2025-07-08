import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 経費を作成
export const createExpense = mutation({
  args: {
    receiptId: v.optional(v.id("receipts")),
    date: v.string(),
    amount: v.float64(),
    category: v.string(),
    vendor: v.string(),
    description: v.optional(v.string()),
    purpose: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    taxRate: v.optional(v.float64()),
    invoiceNumber: v.optional(v.string()),
    invoiceDate: v.optional(v.string()),
    projectCode: v.optional(v.string()),
    isDeductible: v.optional(v.boolean()),
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

    const expenseId = await ctx.db.insert("expenses", {
      userId: user._id,
      receiptId: args.receiptId,
      date: args.date,
      amount: args.amount,
      category: args.category,
      vendor: args.vendor,
      description: args.description,
      purpose: args.purpose,
      paymentMethod: args.paymentMethod,
      taxRate: args.taxRate,
      invoiceNumber: args.invoiceNumber,
      invoiceDate: args.invoiceDate,
      taxAmount,
      taxExcludedAmount,
      projectCode: args.projectCode,
      isDeductible: args.isDeductible !== undefined ? args.isDeductible : true,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // レシートと経費を関連付け
    if (args.receiptId) {
      await ctx.db.patch(args.receiptId, {
        expenseId,
      });
    }

    return expenseId;
  },
});

// ユーザーの経費一覧を取得
export const getUserExpenses = query({
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
        .query("expenses")
        .withIndex("by_status", (q) => 
          q.eq("userId", user._id).eq("status", args.status!)
        );
    } else {
      query = ctx.db
        .query("expenses")
        .withIndex("by_user", (q) => q.eq("userId", user._id));
    }

    const expenses = await query
      .order("desc")
      .take(args.limit || 50);

    // レシート情報も取得
    const expensesWithReceipts = await Promise.all(
      expenses.map(async (expense) => {
        const receipt = expense.receiptId
          ? await ctx.db.get(expense.receiptId)
          : null;
        return { ...expense, receipt };
      })
    );

    return expensesWithReceipts;
  },
});

// 今月の経費合計を取得
export const getMonthlyTotal = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return 0;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return 0;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDateStr = startOfMonth.toISOString().split('T')[0];

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_date", (q) => 
        q.eq("userId", user._id).gte("date", startDateStr)
      )
      .collect();

    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  },
});

// 高度な検索・フィルタリング
export const searchExpenses = query({
  args: {
    // 検索条件
    searchText: v.optional(v.string()),
    category: v.optional(v.string()),
    status: v.optional(v.string()),
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
    amountMin: v.optional(v.float64()),
    amountMax: v.optional(v.float64()),
    paymentMethod: v.optional(v.string()),
    projectCode: v.optional(v.string()),
    hasReceipt: v.optional(v.boolean()),
    isDeductible: v.optional(v.boolean()),
    // ページネーション
    limit: v.optional(v.float64()),
    cursor: v.optional(v.string()),
    // ソート
    sortBy: v.optional(v.string()), // "date", "amount", "vendor"
    sortOrder: v.optional(v.string()), // "asc", "desc"
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { expenses: [], hasMore: false, nextCursor: null };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return { expenses: [], hasMore: false, nextCursor: null };
    }

    // 全経費を取得（後でフィルタリング）
    const allExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // フィルタリング
    let filteredExpenses = allExpenses;

    // テキスト検索（vendor, description, purpose, invoiceNumberを対象）
    if (args.searchText) {
      const searchLower = args.searchText.toLowerCase();
      filteredExpenses = filteredExpenses.filter(expense => 
        expense.vendor.toLowerCase().includes(searchLower) ||
        (expense.description && expense.description.toLowerCase().includes(searchLower)) ||
        (expense.purpose && expense.purpose.toLowerCase().includes(searchLower)) ||
        (expense.invoiceNumber && expense.invoiceNumber.toLowerCase().includes(searchLower))
      );
    }

    // カテゴリフィルタ
    if (args.category) {
      filteredExpenses = filteredExpenses.filter(expense => 
        expense.category === args.category
      );
    }

    // ステータスフィルタ
    if (args.status) {
      filteredExpenses = filteredExpenses.filter(expense => 
        expense.status === args.status
      );
    }

    // 日付範囲フィルタ
    if (args.dateFrom) {
      filteredExpenses = filteredExpenses.filter(expense => 
        expense.date >= args.dateFrom!
      );
    }
    if (args.dateTo) {
      filteredExpenses = filteredExpenses.filter(expense => 
        expense.date <= args.dateTo!
      );
    }

    // 金額範囲フィルタ
    if (args.amountMin !== undefined) {
      filteredExpenses = filteredExpenses.filter(expense => 
        expense.amount >= args.amountMin!
      );
    }
    if (args.amountMax !== undefined) {
      filteredExpenses = filteredExpenses.filter(expense => 
        expense.amount <= args.amountMax!
      );
    }

    // 支払方法フィルタ
    if (args.paymentMethod) {
      filteredExpenses = filteredExpenses.filter(expense => 
        expense.paymentMethod === args.paymentMethod
      );
    }

    // プロジェクトコードフィルタ
    if (args.projectCode) {
      filteredExpenses = filteredExpenses.filter(expense => 
        expense.projectCode === args.projectCode
      );
    }

    // レシート有無フィルタ
    if (args.hasReceipt !== undefined) {
      filteredExpenses = filteredExpenses.filter(expense => 
        args.hasReceipt ? expense.receiptId !== undefined : expense.receiptId === undefined
      );
    }

    // 控除対象フィルタ
    if (args.isDeductible !== undefined) {
      filteredExpenses = filteredExpenses.filter(expense => 
        expense.isDeductible === args.isDeductible
      );
    }

    // ソート
    const sortBy = args.sortBy || "date";
    const sortOrder = args.sortOrder || "desc";
    filteredExpenses.sort((a, b) => {
      let compareValue = 0;
      switch (sortBy) {
        case "date":
          compareValue = a.date.localeCompare(b.date);
          break;
        case "amount":
          compareValue = a.amount - b.amount;
          break;
        case "vendor":
          compareValue = a.vendor.localeCompare(b.vendor);
          break;
        default:
          compareValue = b.createdAt - a.createdAt;
      }
      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    // ページネーション
    const limit = args.limit || 20;
    const startIndex = args.cursor ? parseInt(args.cursor) : 0;
    const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < filteredExpenses.length;
    const nextCursor = hasMore ? String(startIndex + limit) : null;

    // レシート情報を追加
    const expensesWithReceipts = await Promise.all(
      paginatedExpenses.map(async (expense) => {
        const receipt = expense.receiptId
          ? await ctx.db.get(expense.receiptId)
          : null;
        return { ...expense, receipt };
      })
    );

    return {
      expenses: expensesWithReceipts,
      hasMore,
      nextCursor,
      totalCount: filteredExpenses.length,
    };
  },
});

// 集計データを取得
export const getExpensesSummary = query({
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

    let expenses = await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // 日付範囲フィルタ
    if (args.dateFrom) {
      expenses = expenses.filter(expense => expense.date >= args.dateFrom!);
    }
    if (args.dateTo) {
      expenses = expenses.filter(expense => expense.date <= args.dateTo!);
    }

    // カテゴリ別集計
    const categoryTotals = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = { count: 0, amount: 0 };
      }
      acc[expense.category].count += 1;
      acc[expense.category].amount += expense.amount;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    // 支払方法別集計
    const paymentMethodTotals = expenses.reduce((acc, expense) => {
      const method = expense.paymentMethod || "未設定";
      if (!acc[method]) {
        acc[method] = { count: 0, amount: 0 };
      }
      acc[method].count += 1;
      acc[method].amount += expense.amount;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    return {
      totalAmount: expenses.reduce((sum, expense) => sum + expense.amount, 0),
      totalCount: expenses.length,
      categoryTotals,
      paymentMethodTotals,
      deductibleAmount: expenses
        .filter(expense => expense.isDeductible !== false)
        .reduce((sum, expense) => sum + expense.amount, 0),
    };
  },
});

// 経費を更新
export const updateExpense = mutation({
  args: {
    id: v.id("expenses"),
    date: v.optional(v.string()),
    amount: v.optional(v.float64()),
    category: v.optional(v.string()),
    vendor: v.optional(v.string()),
    description: v.optional(v.string()),
    purpose: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    taxRate: v.optional(v.float64()),
    invoiceNumber: v.optional(v.string()),
    invoiceDate: v.optional(v.string()),
    projectCode: v.optional(v.string()),
    isDeductible: v.optional(v.boolean()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const expense = await ctx.db.get(args.id);
    if (!expense) {
      throw new Error("Expense not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || expense.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...updateData } = args;

    // 税額再計算
    let taxExcludedAmount = undefined;
    let taxAmount = undefined;
    if (updateData.amount !== undefined || updateData.taxRate !== undefined) {
      const amount = updateData.amount ?? expense.amount;
      const taxRate = updateData.taxRate ?? expense.taxRate;
      if (taxRate && taxRate > 0) {
        taxExcludedAmount = amount / (1 + taxRate / 100);
        taxAmount = amount - taxExcludedAmount;
      }
    }

    await ctx.db.patch(args.id, {
      ...updateData,
      ...(taxExcludedAmount !== undefined && { taxExcludedAmount }),
      ...(taxAmount !== undefined && { taxAmount }),
      updatedAt: Date.now(),
    });
  },
});

// 経費を削除
export const deleteExpense = mutation({
  args: {
    id: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const expense = await ctx.db.get(args.id);
    if (!expense) {
      throw new Error("Expense not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || expense.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // レシートとの関連を解除
    if (expense.receiptId) {
      const receipt = await ctx.db.get(expense.receiptId);
      if (receipt) {
        await ctx.db.patch(expense.receiptId, {
          expenseId: undefined,
        });
      }
    }

    await ctx.db.delete(args.id);
  },
});