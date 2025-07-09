"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import Link from "next/link";
import { Id } from "../../../../../../convex/_generated/dataModel";

export default function EditExpense() {
  const router = useRouter();
  const params = useParams();
  const expenseId = params.id as Id<"expenses">;

  const updateExpense = useMutation(api.expenses.updateExpense);
  const categories = useQuery(api.expenseCategories.getExpenseCategories) || [];
  const paymentMethods =
    useQuery(api.paymentMethods.getPaymentMethods, { type: "expense" }) || [];

  // 既存の経費データを取得
  const expenses = useQuery(api.expenses.searchExpenses, {
    limit: 1,
  });

  const expense = expenses?.expenses.find((e) => e._id === expenseId);

  const [formData, setFormData] = useState({
    date: "",
    amount: "",
    categoryId: "",
    vendor: "",
    description: "",
    purpose: "",
    paymentMethodId: "",
    taxRate: "",
    invoiceNumber: "",
    invoiceDate: "",
    projectCode: "",
    isDeductible: true,
    status: "draft",
  });

  // 経費データが読み込まれたら、フォームにセット
  useEffect(() => {
    if (expense) {
      setFormData({
        date: expense.date,
        amount: expense.amount.toString(),
        categoryId: expense.categoryId,
        vendor: expense.vendor,
        description: expense.description || "",
        purpose: expense.purpose || "",
        paymentMethodId: expense.paymentMethodId || "",
        taxRate: expense.taxRate?.toString() || "10",
        invoiceNumber: expense.invoiceNumber || "",
        invoiceDate: expense.invoiceDate || "",
        projectCode: expense.projectCode || "",
        isDeductible: expense.isDeductible !== false,
        status: expense.status,
      });
    }
  }, [expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateExpense({
        id: expenseId,
        date: formData.date,
        amount: parseFloat(formData.amount),
        categoryId: formData.categoryId,
        vendor: formData.vendor,
        description: formData.description || undefined,
        purpose: formData.purpose || undefined,
        paymentMethodId: formData.paymentMethodId || undefined,
        taxRate: formData.taxRate ? parseFloat(formData.taxRate) : undefined,
        invoiceNumber: formData.invoiceNumber || undefined,
        invoiceDate: formData.invoiceDate || undefined,
        projectCode: formData.projectCode || undefined,
        isDeductible: formData.isDeductible,
        status: formData.status,
      });

      router.push("/dashboard/expenses");
    } catch (error) {
      console.error("Update error:", error);
      alert("更新に失敗しました");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const calculateTaxDetails = () => {
    if (!formData.amount || !formData.taxRate) return null;

    const amount = parseFloat(formData.amount);
    const taxRate = parseFloat(formData.taxRate);
    const taxAmount = Math.floor((amount * taxRate) / (100 + taxRate));
    const beforeTax = amount - taxAmount;

    return {
      beforeTax,
      taxAmount,
      total: amount,
    };
  };

  const taxDetails = calculateTaxDetails();

  if (!expense) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">経費情報編集</h2>
              <Link
                href="/dashboard/expenses"
                className="text-sm text-white hover:text-blue-100 transition-colors"
              >
                ✕ キャンセル
              </Link>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* 基本情報 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  基本情報
                </h3>

                <div className="space-y-4">
                  {/* ステータス */}
                  <div>
                    <label
                      htmlFor="status"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      ステータス
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="draft">下書き</option>
                      <option value="confirmed">確認済み</option>
                      <option value="submitted">提出済み</option>
                    </select>
                  </div>

                  {/* 日付と金額 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="date"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        日付 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        required
                        value={formData.date}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="amount"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        金額（税込） <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">¥</span>
                        </div>
                        <input
                          type="number"
                          id="amount"
                          name="amount"
                          required
                          value={formData.amount}
                          onChange={handleInputChange}
                          className="w-full pl-8 pr-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* カテゴリと支払方法 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="categoryId"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        カテゴリ <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="categoryId"
                        name="categoryId"
                        required
                        value={formData.categoryId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">選択してください</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat.categoryId}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="paymentMethodId"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        支払方法
                      </label>
                      <select
                        id="paymentMethodId"
                        name="paymentMethodId"
                        value={formData.paymentMethodId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">未設定</option>
                        {paymentMethods
                          .filter(
                            (method) =>
                              method.type === "both" ||
                              method.type === "expense"
                          )
                          .map((method) => (
                            <option key={method._id} value={method.methodId}>
                              {method.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* 支払先 */}
                  <div>
                    <label
                      htmlFor="vendor"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      支払先 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="vendor"
                      name="vendor"
                      required
                      value={formData.vendor}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="店舗名・会社名"
                    />
                  </div>

                  {/* 目的 */}
                  <div>
                    <label
                      htmlFor="purpose"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      利用目的（確定申告用）
                    </label>
                    <input
                      type="text"
                      id="purpose"
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="例：クライアントとの打ち合わせ"
                    />
                  </div>

                  {/* 備考 */}
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      備考
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={2}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="メモや詳細情報"
                    />
                  </div>
                </div>
              </div>

              {/* 税務情報 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  税務情報
                </h3>

                <div className="space-y-4">
                  {/* 消費税率 */}
                  <div>
                    <label
                      htmlFor="taxRate"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      消費税率
                    </label>
                    <select
                      id="taxRate"
                      name="taxRate"
                      value={formData.taxRate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="10">10%（標準税率）</option>
                      <option value="8">8%（軽減税率）</option>
                      <option value="0">0%（非課税）</option>
                    </select>
                  </div>

                  {/* 税額内訳 */}
                  {taxDetails && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">税抜金額:</span>
                          <span>¥{taxDetails.beforeTax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">消費税:</span>
                          <span>¥{taxDetails.taxAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-medium pt-1 border-t">
                          <span>合計:</span>
                          <span>¥{taxDetails.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* インボイス情報 */}
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="invoiceNumber"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        適格請求書発行事業者登録番号
                      </label>
                      <input
                        type="text"
                        id="invoiceNumber"
                        name="invoiceNumber"
                        value={formData.invoiceNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="T1234567890123"
                        pattern="T\d{13}"
                        maxLength={14}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        T + 13桁の数字
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="invoiceDate"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        請求書日付
                      </label>
                      <input
                        type="date"
                        id="invoiceDate"
                        name="invoiceDate"
                        value={formData.invoiceDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* 控除対象 */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isDeductible"
                      name="isDeductible"
                      checked={formData.isDeductible}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isDeductible: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="isDeductible"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      控除対象経費として計上する
                    </label>
                  </div>
                </div>
              </div>

              {/* プロジェクト管理 */}
              <div>
                <label
                  htmlFor="projectCode"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  プロジェクトコード
                </label>
                <input
                  type="text"
                  id="projectCode"
                  name="projectCode"
                  value={formData.projectCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例：PRJ-2024-001"
                />
                <p className="mt-1 text-xs text-gray-500">案件管理用のコード</p>
              </div>

              {/* レシート情報 */}
              {expense.receipt && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">
                    添付レシート
                  </h3>
                  <p className="text-sm text-blue-700">
                    {expense.receipt.fileName}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {new Date(expense.receipt.uploadedAt).toLocaleString()}
                    にアップロード
                  </p>
                </div>
              )}
            </div>

            {/* 送信ボタン */}
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
              <Link
                href="/dashboard/expenses"
                className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                className="px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                ✓ 更新
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
