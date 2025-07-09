import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ユーザーテーブル（Clerkのユーザー情報と連携）
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  // レシート画像テーブル
  receipts: defineTable({
    userId: v.id("users"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    mimeType: v.string(),
    size: v.float64(),
    uploadedAt: v.float64(),
    expenseId: v.optional(v.id("expenses")),
  })
    .index("by_user", ["userId"])
    .index("by_expense", ["expenseId"]),

  // 経費データテーブル
  expenses: defineTable({
    userId: v.id("users"),
    receiptId: v.optional(v.id("receipts")),
    date: v.string(), // YYYY-MM-DD形式
    amount: v.float64(),
    categoryId: v.string(), // 経費カテゴリID（expense_categoriesテーブル参照）
    vendor: v.string(), // 支払先
    description: v.optional(v.string()),
    purpose: v.optional(v.string()), // 目的（確定申告用）
    paymentMethodId: v.optional(v.string()), // 支払方法ID（payment_methodsテーブル参照）
    taxRate: v.optional(v.float64()), // 消費税率
    // インボイス制度関連
    invoiceNumber: v.optional(v.string()), // 適格請求書発行事業者登録番号（T+13桁）
    invoiceDate: v.optional(v.string()), // 請求書日付
    // 税額計算用
    taxAmount: v.optional(v.float64()), // 消費税額
    taxExcludedAmount: v.optional(v.float64()), // 税抜金額
    // その他の確定申告用項目
    projectCode: v.optional(v.string()), // プロジェクトコード（案件管理用）
    isDeductible: v.optional(v.boolean()), // 控除対象かどうか
    status: v.string(), // "draft", "confirmed", "submitted"
    createdAt: v.float64(),
    updatedAt: v.float64(),
  })
    .index("by_user", ["userId"])
    .index("by_date", ["userId", "date"])
    .index("by_category", ["userId", "categoryId"])
    .index("by_status", ["userId", "status"]),

  // カテゴリマスターテーブル（ユーザー共通）
  expense_categories: defineTable({
    categoryId: v.string(), // 一意のカテゴリID（例: EXP001）
    name: v.string(),
    description: v.optional(v.string()),
    taxDeductible: v.boolean(), // 控除対象かどうか
    sortOrder: v.float64(),
  })
    .index("by_category_id", ["categoryId"])
    .index("by_name", ["name"]),

  // 支払方法マスター
  payment_methods: defineTable({
    methodId: v.string(), // 一意のID（例: PM001）
    name: v.string(), // 表示名
    type: v.string(), // 経費用(expense)、収入用(income)、両方(both)
    sortOrder: v.float64(),
  })
    .index("by_method_id", ["methodId"])
    .index("by_type", ["type"]),

  // 収入データテーブル
  incomes: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD形式
    amount: v.float64(),
    categoryId: v.string(), // 収入カテゴリID（income_categoriesテーブル参照）
    client: v.string(), // クライアント名
    description: v.optional(v.string()),
    projectName: v.optional(v.string()), // プロジェクト名
    paymentMethodId: v.optional(v.string()), // 受取方法ID（payment_methodsテーブル参照）
    // 源泉徴収関連
    withholding: v.optional(v.boolean()), // 源泉徴収ありかどうか
    withholdingAmount: v.optional(v.float64()), // 源泉徴収額
    withholdingRate: v.optional(v.float64()), // 源泉徴収率
    // インボイス制度関連
    invoiceNumber: v.optional(v.string()), // 自身の適格請求書発行事業者登録番号
    invoiceIssued: v.optional(v.boolean()), // 適格請求書を発行したか
    invoiceDate: v.optional(v.string()), // 請求書発行日
    // 税額計算用
    taxRate: v.optional(v.float64()), // 消費税率（該当する場合）
    taxAmount: v.optional(v.float64()), // 消費税額
    taxExcludedAmount: v.optional(v.float64()), // 税抜金額
    // その他の確定申告用項目
    projectCode: v.optional(v.string()), // プロジェクトコード（案件管理用）
    status: v.string(), // "draft", "confirmed", "received"
    receivedDate: v.optional(v.string()), // 実際の入金日
    createdAt: v.float64(),
    updatedAt: v.float64(),
  })
    .index("by_user", ["userId"])
    .index("by_date", ["userId", "date"])
    .index("by_category", ["userId", "categoryId"])
    .index("by_status", ["userId", "status"])
    .index("by_client", ["userId", "client"]),

  // 収入カテゴリマスターテーブル（ユーザー共通）
  income_categories: defineTable({
    categoryId: v.string(), // 一意のカテゴリID（例: INC001）
    name: v.string(),
    description: v.optional(v.string()),
    withholding: v.boolean(), // 通常源泉徴収対象かどうか
    sortOrder: v.float64(),
  })
    .index("by_category_id", ["categoryId"])
    .index("by_name", ["name"]),
});
