"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { Id } from "../../../../convex/_generated/dataModel";

export default function IncomesList() {
  const categories = useQuery(api.incomeCategories.getIncomeCategories) || [];

  // フィルター状態
  const [filters, setFilters] = useState({
    searchText: "",
    category: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: "",
    client: "",
    withholding: "",
    invoiceIssued: "",
    sortBy: "date",
    sortOrder: "desc",
  });

  const [showFilters, setShowFilters] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);

  // 検索クエリを実行
  const searchResult = useQuery(api.incomes.searchIncomes, {
    searchText: filters.searchText || undefined,
    categoryId: filters.category || undefined,
    status: filters.status || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    amountMin: filters.amountMin ? parseFloat(filters.amountMin) : undefined,
    amountMax: filters.amountMax ? parseFloat(filters.amountMax) : undefined,
    client: filters.client || undefined,
    withholding:
      filters.withholding === "" ? undefined : filters.withholding === "true",
    invoiceIssued:
      filters.invoiceIssued === ""
        ? undefined
        : filters.invoiceIssued === "true",
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    cursor: cursor || undefined,
    limit: 20,
  });

  // 集計データを取得
  const summary = useQuery(api.incomes.getIncomesSummary, {
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  });

  const deleteIncome = useMutation(api.incomes.deleteIncome);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
    setCursor(null); // フィルター変更時はページネーションをリセット
  };

  const handleDelete = async (id: Id<"incomes">) => {
    if (window.confirm("この収入を削除してもよろしいですか？")) {
      try {
        await deleteIncome({ id });
      } catch {
        alert("削除に失敗しました");
      }
    }
  };

  const clearFilters = () => {
    setFilters({
      searchText: "",
      category: "",
      status: "",
      dateFrom: "",
      dateTo: "",
      amountMin: "",
      amountMax: "",
      client: "",
      withholding: "",
      invoiceIssued: "",
      sortBy: "date",
      sortOrder: "desc",
    });
    setCursor(null);
  };

  if (!searchResult || !summary) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">収入一覧</h1>
          <Link
            href="/dashboard/incomes/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            新規登録
          </Link>
        </div>
      </div>

      {/* 集計情報 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-700 truncate">
              総収入
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              ¥{summary.totalAmount.toLocaleString()}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-700 truncate">
              源泉徴収額
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              ¥{summary.totalWithholdingAmount.toLocaleString()}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-700 truncate">
              手取り額
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              ¥{summary.netAmount.toLocaleString()}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <dt className="text-sm font-medium text-gray-700 truncate">件数</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {summary.totalCount}件
            </dd>
          </div>
        </div>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <input
              type="text"
              name="searchText"
              value={filters.searchText}
              onChange={handleFilterChange}
              placeholder="クライアント名、プロジェクト名、備考で検索..."
              className="flex-1 mr-4 px-4 py-2 border text-gray-900 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {showFilters ? "フィルターを隠す" : "詳細フィルター"}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="px-6 py-4 bg-gray-50">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* カテゴリ */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  カテゴリ
                </label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">すべて</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat.categoryId}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ステータス */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ステータス
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">すべて</option>
                  <option value="draft">下書き</option>
                  <option value="confirmed">確認済み</option>
                  <option value="received">入金済み</option>
                </select>
              </div>

              {/* クライアント */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  クライアント
                </label>
                <input
                  type="text"
                  name="client"
                  value={filters.client}
                  onChange={handleFilterChange}
                  placeholder="クライアント名"
                  className="mt-1 block w-full text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* 日付範囲 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  開始日
                </label>
                <input
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  終了日
                </label>
                <input
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* 金額範囲 */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  最小金額
                </label>
                <input
                  type="number"
                  name="amountMin"
                  value={filters.amountMin}
                  onChange={handleFilterChange}
                  placeholder="0"
                  className="mt-1 block w-full text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  最大金額
                </label>
                <input
                  type="number"
                  name="amountMax"
                  value={filters.amountMax}
                  onChange={handleFilterChange}
                  placeholder="999999"
                  className="mt-1 block w-full text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* その他のフィルター */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  源泉徴収
                </label>
                <select
                  name="withholding"
                  value={filters.withholding}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">すべて</option>
                  <option value="true">あり</option>
                  <option value="false">なし</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  インボイス発行
                </label>
                <select
                  name="invoiceIssued"
                  value={filters.invoiceIssued}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">すべて</option>
                  <option value="true">発行済み</option>
                  <option value="false">未発行</option>
                </select>
              </div>

              {/* ソート */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  並び順
                </label>
                <div className="mt-1 flex space-x-2">
                  <select
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={handleFilterChange}
                    className="block w-full text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="date">日付</option>
                    <option value="amount">金額</option>
                    <option value="client">クライアント</option>
                  </select>
                  <select
                    name="sortOrder"
                    value={filters.sortOrder}
                    onChange={handleFilterChange}
                    className="block w-full text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="desc">降順</option>
                    <option value="asc">昇順</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                フィルターをクリア
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 収入一覧 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {searchResult.incomes.length === 0 ? (
            <li className="px-6 py-12 text-center text-gray-700">
              該当する収入が見つかりません
            </li>
          ) : (
            searchResult.incomes.map((income) => (
              <li key={income._id}>
                <div className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {income.client}
                          </p>
                          <p className="text-sm text-gray-700">
                            {categories.find(
                              (c) => c.categoryId === income.categoryId
                            )?.name || income.categoryId}{" "}
                            • {income.date}
                            {income.projectName && ` • ${income.projectName}`}
                          </p>
                          {income.description && (
                            <p className="text-sm text-gray-800 mt-1">
                              {income.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            ¥{income.amount.toLocaleString()}
                          </p>
                          {income.withholding && income.withholdingAmount && (
                            <p className="text-xs text-gray-700">
                              源泉徴収: ¥
                              {income.withholdingAmount.toLocaleString()}
                            </p>
                          )}
                          {income.taxRate && (
                            <p className="text-xs text-gray-700">
                              税込（{income.taxRate}%）
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              income.status === "draft"
                                ? "bg-gray-100 text-gray-800"
                                : income.status === "confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {income.status === "draft"
                              ? "下書き"
                              : income.status === "confirmed"
                                ? "確認済み"
                                : "入金済み"}
                          </span>
                          {income.withholding && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              源泉徴収あり
                            </span>
                          )}
                          {income.invoiceIssued && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              インボイス発行済み
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/dashboard/incomes/${income._id}/edit`}
                            className="text-sm text-blue-600 hover:text-blue-900"
                          >
                            編集
                          </Link>
                          <button
                            onClick={() => handleDelete(income._id)}
                            className="text-sm text-red-600 hover:text-red-900"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* ページネーション */}
      {(searchResult.hasMore || cursor) && (
        <div className="mt-6 flex justify-center space-x-2">
          {cursor && (
            <button
              onClick={() => setCursor(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              最初のページ
            </button>
          )}
          {searchResult.hasMore && (
            <button
              onClick={() => setCursor(searchResult.nextCursor)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              次のページ
            </button>
          )}
        </div>
      )}
    </div>
  );
}
