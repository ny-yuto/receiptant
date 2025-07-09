"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const upsertUser = useMutation(api.users.upsertUser);
  const monthlyExpenseTotal = useQuery(api.expenses.getMonthlyTotal) || 0;
  const monthlyIncomeTotal = useQuery(api.incomes.getMonthlyTotal) || { total: 0, withholdingTotal: 0, netTotal: 0 };
  const recentExpenses = useQuery(api.expenses.getUserExpenses, { limit: 5 }) || [];
  const recentIncomes = useQuery(api.incomes.getUserIncomes, { limit: 5 }) || [];
  const balanceSummary = useQuery(api.incomes.getBalanceSummary, {}) || null;
  const initCategories = useMutation(api.categories.initializeCategories);
  const initIncomeCategories = useMutation(api.incomeCategories.initializeCategories);

  useEffect(() => {
    if (isLoaded && !user) {
      redirect("/");
    }

    if (user && !currentUser) {
      upsertUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || undefined,
      });
    }
  }, [user, isLoaded, currentUser, upsertUser]);

  useEffect(() => {
    // カテゴリマスターを初期化（初回のみ）
    if (currentUser) {
      initCategories().catch(() => {});
      initIncomeCategories().catch(() => {});
    }
  }, [currentUser, initCategories, initIncomeCategories]);

  if (!isLoaded || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* 統計カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-700 truncate">今月の収入</dt>
                    <dd className="text-lg font-medium text-gray-900">¥{monthlyIncomeTotal.total.toLocaleString()}</dd>
                    <dd className="text-xs text-gray-700">手取り: ¥{monthlyIncomeTotal.netTotal.toLocaleString()}</dd>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-700 truncate">今月の経費</dt>
                    <dd className="text-lg font-medium text-gray-900">¥{monthlyExpenseTotal.toLocaleString()}</dd>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-700 truncate">今月の収支</dt>
                    <dd className={`text-lg font-medium ${balanceSummary && balanceSummary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {balanceSummary ? `¥${balanceSummary.balance.toLocaleString()}` : '¥0'}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-700 truncate">取引件数</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {recentExpenses.length + recentIncomes.length}件
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/dashboard/incomes/new" className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 group-hover:bg-green-100">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  新規収入登録
                </h3>
                <p className="mt-2 text-sm text-gray-700">
                  報酬・売上などの収入を登録
                </p>
              </div>
            </Link>

            <Link href="/dashboard/expenses/new" className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div>
                <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 group-hover:bg-blue-100">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  新規経費登録
                </h3>
                <p className="mt-2 text-sm text-gray-700">
                  レシート画像をアップロードして経費を登録
                </p>
              </div>
            </Link>

            <button className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-purple-500 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div>
                <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 group-hover:bg-purple-100">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  レポート作成
                </h3>
                <p className="mt-2 text-sm text-gray-700">
                  確定申告用のレポートを生成
                </p>
              </div>
            </button>
          </div>

          {/* 最近の収入・経費リスト */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 最近の収入 */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">最近の収入</h3>
                <Link href="/dashboard/incomes" className="text-sm text-green-600 hover:text-green-900">
                  すべて見る →
                </Link>
              </div>
              <div className="border-t border-gray-200">
                {recentIncomes.length === 0 ? (
                  <div className="px-4 py-5 sm:p-6">
                    <p className="text-gray-700 text-center">まだ収入が登録されていません</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {recentIncomes.map((income) => (
                      <li key={income._id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{income.client}</div>
                              <div className="text-sm text-gray-700">{income.category} • {income.date}</div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">¥{income.amount.toLocaleString()}</div>
                              {income.withholding && income.withholdingAmount && (
                                <div className="text-xs text-gray-700">源泉: ¥{income.withholdingAmount.toLocaleString()}</div>
                              )}
                            </div>
                            <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              income.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
                              income.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {income.status === 'draft' ? '下書き' : 
                               income.status === 'confirmed' ? '確認済み' : 
                               '入金済み'}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* 最近の経費 */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">最近の経費</h3>
                <Link href="/dashboard/expenses" className="text-sm text-blue-600 hover:text-blue-900">
                  すべて見る →
                </Link>
              </div>
              <div className="border-t border-gray-200">
                {recentExpenses.length === 0 ? (
                  <div className="px-4 py-5 sm:p-6">
                    <p className="text-gray-700 text-center">まだ経費が登録されていません</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {recentExpenses.map((expense) => (
                      <li key={expense._id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              {expense.receipt ? (
                                <svg className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              ) : (
                                <svg className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{expense.vendor}</div>
                              <div className="text-sm text-gray-700">{expense.category} • {expense.date}</div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">¥{expense.amount.toLocaleString()}</div>
                            <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              expense.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
                              expense.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {expense.status === 'draft' ? '下書き' : 
                               expense.status === 'confirmed' ? '確認済み' : 
                               '提出済み'}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}