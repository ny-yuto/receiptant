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
    category: v.string(), // 経費カテゴリ（交通費、会議費、消耗品費など）
    vendor: v.string(), // 支払先
    description: v.optional(v.string()),
    purpose: v.optional(v.string()), // 目的（確定申告用）
    paymentMethod: v.optional(v.string()), // 支払方法
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
    .index("by_category", ["userId", "category"])
    .index("by_status", ["userId", "status"]),

  // カテゴリマスターテーブル（ユーザー共通）
  expenseCategories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    taxDeductible: v.boolean(), // 控除対象かどうか
    sortOrder: v.float64(),
  })
    .index("by_name", ["name"]),

  // 収入データテーブル
  incomes: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD形式
    amount: v.float64(),
    category: v.string(), // 収入カテゴリ（業務委託料、印税、講演料など）
    client: v.string(), // クライアント名
    description: v.optional(v.string()),
    projectName: v.optional(v.string()), // プロジェクト名
    paymentMethod: v.optional(v.string()), // 受取方法（振込、現金など）
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
    .index("by_category", ["userId", "category"])
    .index("by_status", ["userId", "status"])
    .index("by_client", ["userId", "client"]),

  // 収入カテゴリマスターテーブル（ユーザー共通）
  incomeCategories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    withholding: v.boolean(), // 通常源泉徴収対象かどうか
    sortOrder: v.float64(),
  })
    .index("by_name", ["name"]),
});