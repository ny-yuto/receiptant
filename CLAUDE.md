# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Receiptant は日本のフリーランサー・個人事業主向けの経費管理アプリケーションです。レシート画像のアップロード、経費の詳細管理、確定申告に必要な集計機能を提供します。

## 技術スタック

- **フレームワーク**: Next.js 15.3.5 (App Router, Turbopack)
- **言語**: TypeScript
- **認証**: Clerk
- **データベース**: Convex (リアルタイムデータベース)
- **スタイリング**: Tailwind CSS v4
- **UI**: React 19

## 開発コマンド

```bash
# 開発サーバー起動（Turbopack使用）
npm run dev

# ビルド
npm run build

# Lint実行
npm run lint

# Convex開発環境起動（別ターミナルで実行）
npx convex dev
```

## アーキテクチャ

### ディレクトリ構造

- `convex/` - バックエンドロジック（スキーマ、ミューテーション、クエリ）
  - `schema.ts` - データベーススキーマ定義
  - `users.ts` - ユーザー管理
  - `expenses.ts` - 経費データ管理
  - `storage.ts` - ファイルストレージ
  - `categories.ts` - カテゴリマスター
- `src/app/` - Next.js App Router のページとレイアウト
  - `dashboard/` - 認証必須エリア
    - `expenses/` - 経費一覧・検索
    - `receipt/` - レシート登録
- `src/middleware.ts` - Clerk認証ミドルウェア
- `src/providers/` - React Context プロバイダー

### データフロー

1. **認証**: Clerk → middleware.ts → 各ページで保護
2. **データ操作**: React コンポーネント → Convex hooks → Convex functions
3. **リアルタイム同期**: Convex が自動的にデータの変更を購読・反映

### 主要な型定義

Convex のスキーマ (`convex/schema.ts`) が全体の型安全性を担保。以下の主要テーブル：
- `users` - ユーザー情報
- `expenses` - 経費データ（金額、カテゴリ、税情報など）
- `receiptImages` - アップロードされたレシート画像
- `categories` - 経費カテゴリマスター

### 日本の税制対応

- インボイス制度対応（適格請求書フラグ）
- 消費税計算（8%/10%、軽減税率）
- 確定申告用の控除対象フラグ
- カテゴリ別・支払方法別の集計機能

## 開発時の注意点

1. **Convex の変更時**: スキーマ変更は `convex/schema.ts` で行い、`npx convex dev` で自動反映
2. **新しいページ追加時**: `src/middleware.ts` で認証要否を確認
3. **型エラー**: Convex の自動生成型を活用（`convex/_generated/` は編集不可）
4. **環境変数**: `.env.local` に Clerk と Convex の認証情報を設定

## よく使うパターン

### Convex クエリの使用
```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const data = useQuery(api.expenses.list);
```

### Convex ミューテーションの使用
```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const createExpense = useMutation(api.expenses.create);
await createExpense({ /* データ */ });
```