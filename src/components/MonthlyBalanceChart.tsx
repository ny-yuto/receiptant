"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export function MonthlyBalanceChart() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const monthlyBalances = useQuery(api.balances.getMonthlyBalances, {
    year: selectedYear,
  });


  if (!monthlyBalances) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  // データが空の場合の処理
  if (monthlyBalances.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">月別収支推移</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedYear(selectedYear - 1)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
              {selectedYear}年
            </span>
            <button
              onClick={() => setSelectedYear(selectedYear + 1)}
              className="p-1 rounded hover:bg-gray-100"
              disabled={selectedYear >= new Date().getFullYear()}
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="text-center py-12 text-gray-500">
          {selectedYear}年のデータがありません
        </div>
      </div>
    );
  }

  const maxValue = Math.max(
    ...monthlyBalances.map((m) =>
      Math.max(m.netIncome, m.expenses, Math.abs(m.balance))
    ),
    1 // 最小値を1に設定
  );

  const formatMonth = (monthStr: string) => {
    const [, month] = monthStr.split("-");
    return `${parseInt(month)}月`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">月別収支推移</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedYear(selectedYear - 1)}
            className="p-1 rounded hover:bg-gray-100"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
            {selectedYear}年
          </span>
          <button
            onClick={() => setSelectedYear(selectedYear + 1)}
            className="p-1 rounded hover:bg-gray-100"
            disabled={selectedYear >= new Date().getFullYear()}
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* グラフエリア */}
      <div className="mb-8">
        <div className="relative" style={{ height: "300px" }}>
          {/* グリッド線 */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 25, 50, 75, 100].map((percent) => (
              <div key={percent} className="relative">
                <div className="absolute inset-x-0 border-t border-gray-200"></div>
              </div>
            ))}
          </div>
          
          {/* バーチャート */}
          <div className="absolute inset-0 flex items-end justify-around px-4 pb-6">
            {monthlyBalances.map((month, index) => {
              // 高さを250px基準で計算
              const incomeHeight = month.netIncome > 0 ? (month.netIncome / maxValue) * 250 : 0;
              const expenseHeight = month.expenses > 0 ? (month.expenses / maxValue) * 250 : 0;
              const balanceHeight = month.balance !== 0 ? (Math.abs(month.balance) / maxValue) * 250 : 0;
              const isPositive = month.balance >= 0;

              return (
                <div
                  key={month.month}
                  className="flex flex-col items-center"
                  style={{ width: `${100 / 12}%` }}
                >
                  <div className="flex items-end justify-center space-x-0.5 w-full" style={{ height: "250px" }}>
                    {/* 手取り収入 */}
                    <div className="relative group">
                      <div
                        className="w-4 bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600"
                        style={{ 
                          height: `${incomeHeight}px`,
                          minHeight: incomeHeight > 0 ? "2px" : "0px"
                        }}
                      ></div>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        手取り: ¥{month.netIncome.toLocaleString()}
                      </div>
                    </div>
                    
                    {/* 経費 */}
                    <div className="relative group">
                      <div
                        className="w-4 bg-red-500 rounded-t transition-all duration-300 hover:bg-red-600"
                        style={{ 
                          height: `${expenseHeight}px`,
                          minHeight: expenseHeight > 0 ? "2px" : "0px"
                        }}
                      ></div>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        経費: ¥{month.expenses.toLocaleString()}
                      </div>
                    </div>
                    
                    {/* 収支 */}
                    <div className="relative group">
                      <div
                        className={`w-4 rounded-t transition-all duration-300 ${
                          isPositive
                            ? "bg-blue-500 hover:bg-blue-600"
                            : "bg-orange-500 hover:bg-orange-600"
                        }`}
                        style={{ 
                          height: `${balanceHeight}px`,
                          minHeight: balanceHeight > 0 ? "2px" : "0px"
                        }}
                      ></div>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        収支: ¥{month.balance.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  {/* 月ラベル */}
                  <div className="mt-2 text-xs text-gray-600">
                    {formatMonth(month.month)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 凡例 */}
      <div className="mt-6 flex justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
          <span className="text-gray-700">手取り収入</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
          <span className="text-gray-700">経費</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
          <span className="text-gray-700">収支（黒字）</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
          <span className="text-gray-700">収支（赤字）</span>
        </div>
      </div>

      {/* データテーブル */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                月
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                手取り収入
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                経費
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                収支
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {monthlyBalances.map((month) => (
              <tr key={month.month} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-sm text-gray-900">
                  {formatMonth(month.month)}
                </td>
                <td className="px-3 py-2 text-sm text-right text-gray-900">
                  ¥{month.netIncome.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-sm text-right text-gray-900">
                  ¥{month.expenses.toLocaleString()}
                </td>
                <td
                  className={`px-3 py-2 text-sm text-right font-medium ${
                    month.balance >= 0 ? "text-blue-600" : "text-orange-600"
                  }`}
                >
                  ¥{month.balance.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50">
              <td className="px-3 py-2 text-sm font-medium text-gray-900">
                合計
              </td>
              <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">
                ¥
                {monthlyBalances
                  .reduce((sum, m) => sum + m.netIncome, 0)
                  .toLocaleString()}
              </td>
              <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">
                ¥
                {monthlyBalances
                  .reduce((sum, m) => sum + m.expenses, 0)
                  .toLocaleString()}
              </td>
              <td
                className={`px-3 py-2 text-sm text-right font-medium ${
                  monthlyBalances.reduce((sum, m) => sum + m.balance, 0) >= 0
                    ? "text-blue-600"
                    : "text-orange-600"
                }`}
              >
                ¥
                {monthlyBalances
                  .reduce((sum, m) => sum + m.balance, 0)
                  .toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}