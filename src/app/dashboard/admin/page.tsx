"use client";

import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";

export default function AdminPage() {
  const initializeExpenseCategories = useMutation(
    api.expenseCategories.initializeExpenseCategories
  );
  const initializeIncomeCategories = useMutation(
    api.incomeCategories.initializeIncomeCategories
  );

  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleInitializeAll = async () => {
    setLoading(true);
    setStatus("初期化を開始します...");

    try {
      // 経費カテゴリの初期化
      setStatus("経費カテゴリを初期化中...");
      const expenseResult = await initializeExpenseCategories();
      console.log("経費カテゴリ:", expenseResult);

      // 収入カテゴリの初期化
      setStatus("収入カテゴリを初期化中...");
      const incomeResult = await initializeIncomeCategories();
      console.log("収入カテゴリ:", incomeResult);

      setStatus("✅ すべてのカテゴリの初期化が完了しました！");
    } catch (error) {
      console.error("初期化エラー:", error);
      setStatus(`❌ エラーが発生しました: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">管理者設定</h1>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            マスターデータ初期化
          </h2>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <p className="text-sm text-yellow-800">
              ⚠️ 注意: この操作はカテゴリマスターデータを初期化します。
              既にデータが存在する場合は実行されません。
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleInitializeAll}
              disabled={loading}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                loading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {loading ? "初期化中..." : "カテゴリを初期化"}
            </button>

            {status && (
              <div
                className={`mt-4 p-4 rounded-md ${
                  status.includes("✅")
                    ? "bg-green-50 text-green-800"
                    : status.includes("❌")
                      ? "bg-red-50 text-red-800"
                      : "bg-blue-50 text-blue-800"
                }`}
              >
                {status}
              </div>
            )}
          </div>

          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              初期化される内容
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">経費カテゴリ</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• EXP001: 交通費</li>
                  <li>• EXP002: 会議費</li>
                  <li>• EXP003: 消耗品費</li>
                  <li>• EXP004: 通信費</li>
                  <li>• EXP005: 図書研究費</li>
                  <li>• EXP006: 外注費</li>
                  <li>• EXP007: 広告宣伝費</li>
                  <li>• EXP999: その他</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">収入カテゴリ</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• INC001: 業務委託料</li>
                  <li>• INC002: 原稿料</li>
                  <li>• INC003: 講演料</li>
                  <li>• INC004: 印税</li>
                  <li>• INC005: 広告収入</li>
                  <li>• INC006: 販売収入</li>
                  <li>• INC007: コンサルティング料</li>
                  <li>• INC999: その他</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
