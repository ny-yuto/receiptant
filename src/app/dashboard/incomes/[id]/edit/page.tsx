"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import Link from "next/link";
import { Id } from "../../../../../../convex/_generated/dataModel";

export default function EditIncome() {
  const router = useRouter();
  const params = useParams();
  const incomeId = params.id as Id<"incomes">;

  const updateIncome = useMutation(api.incomes.updateIncome);
  const categories = useQuery(api.incomeCategories.getIncomeCategories) || [];
  const paymentMethods =
    useQuery(api.paymentMethods.getPaymentMethods, {}) || [];

  // 既存の収入データを取得
  const incomes = useQuery(api.incomes.searchIncomes, {
    limit: 100,
  });
  
  const income = incomes?.incomes.find((i) => i._id === incomeId);

  const [formData, setFormData] = useState({
    date: "",
    amount: "",
    categoryId: "",
    client: "",
    description: "",
    projectName: "",
    paymentMethodId: "",
    withholding: false,
    withholdingAmount: "",
    withholdingRate: "",
    invoiceNumber: "",
    invoiceIssued: false,
    invoiceDate: "",
    taxRate: "",
    projectCode: "",
    status: "draft",
    receivedDate: "",
  });

  // 収入データが読み込まれたら、フォームにセット
  useEffect(() => {
    if (income) {
      setFormData({
        date: income.date,
        amount: income.amount.toString(),
        categoryId: income.categoryId,
        client: income.client,
        description: income.description || "",
        projectName: income.projectName || "",
        paymentMethodId: income.paymentMethodId || "",
        withholding: income.withholding || false,
        withholdingAmount: income.withholdingAmount?.toString() || "",
        withholdingRate: income.withholdingRate?.toString() || "",
        invoiceNumber: income.invoiceNumber || "",
        invoiceIssued: income.invoiceIssued || false,
        invoiceDate: income.invoiceDate || "",
        taxRate: income.taxRate?.toString() || "10",
        projectCode: income.projectCode || "",
        status: income.status,
        receivedDate: income.receivedDate || "",
      });
    }
  }, [income]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateIncome({
        id: incomeId,
        date: formData.date,
        amount: parseFloat(formData.amount),
        categoryId: formData.categoryId,
        client: formData.client,
        description: formData.description || undefined,
        projectName: formData.projectName || undefined,
        paymentMethodId: formData.paymentMethodId || undefined,
        withholding: formData.withholding,
        withholdingAmount: formData.withholdingAmount
          ? parseFloat(formData.withholdingAmount)
          : undefined,
        withholdingRate:
          formData.withholding && formData.withholdingRate
            ? parseFloat(formData.withholdingRate)
            : undefined,
        invoiceNumber: formData.invoiceNumber || undefined,
        invoiceIssued: formData.invoiceIssued,
        invoiceDate: formData.invoiceDate || undefined,
        taxRate: formData.taxRate ? parseFloat(formData.taxRate) : undefined,
        projectCode: formData.projectCode || undefined,
        status: formData.status,
        receivedDate: formData.receivedDate || undefined,
      });

      router.push("/dashboard/incomes");
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
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const calculateWithholding = () => {
    if (
      formData.amount &&
      formData.withholding &&
      formData.withholdingRate &&
      !formData.withholdingAmount
    ) {
      const amount = parseFloat(formData.amount);
      const rate = parseFloat(formData.withholdingRate);
      const withholdingAmount = Math.floor(amount * (rate / 100));
      setFormData({
        ...formData,
        withholdingAmount: withholdingAmount.toString(),
      });
    }
  };

  if (!income) {
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
              <h2 className="text-xl font-semibold text-white">収入情報編集</h2>
              <Link
                href="/dashboard/incomes"
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
                      <option value="received">入金済み</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 日付 */}
                    <div>
                      <label
                        htmlFor="date"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        発生日 <span className="text-red-500">*</span>
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

                    {/* 金額 */}
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
                          onBlur={calculateWithholding}
                          className="w-full pl-8 pr-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* カテゴリ */}
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

                  {/* クライアント */}
                  <div>
                    <label
                      htmlFor="client"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      クライアント名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="client"
                      name="client"
                      required
                      value={formData.client}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="株式会社〇〇"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* プロジェクト名 */}
                    <div>
                      <label
                        htmlFor="projectName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        プロジェクト名
                      </label>
                      <input
                        type="text"
                        id="projectName"
                        name="projectName"
                        value={formData.projectName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="〇〇サイト制作"
                      />
                    </div>

                    {/* 受取方法 */}
                    <div>
                      <label
                        htmlFor="paymentMethodId"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        受取方法
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
                              method.type === "both" || method.type === "income"
                          )
                          .map((method) => (
                            <option key={method._id} value={method.methodId}>
                              {method.name}
                            </option>
                          ))}
                      </select>
                    </div>
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
                      rows={3}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="メモや詳細情報"
                    />
                  </div>
                </div>
              </div>

              {/* 源泉徴収・税務 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  源泉徴収・税務情報
                </h3>

                <div className="space-y-4">
                  {/* 源泉徴収 */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="withholding"
                      name="withholding"
                      checked={formData.withholding}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="withholding"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      源泉徴収あり
                    </label>
                  </div>

                  {formData.withholding && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label
                          htmlFor="withholdingRate"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          源泉徴収率（%）
                        </label>
                        <input
                          type="number"
                          id="withholdingRate"
                          name="withholdingRate"
                          step="0.01"
                          value={formData.withholdingRate}
                          onChange={handleInputChange}
                          onBlur={calculateWithholding}
                          className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="10.21"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          通常は10.21%（復興特別所得税含む）
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor="withholdingAmount"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          源泉徴収額
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500">¥</span>
                          </div>
                          <input
                            type="number"
                            id="withholdingAmount"
                            name="withholdingAmount"
                            value={formData.withholdingAmount}
                            onChange={handleInputChange}
                            className="w-full pl-8 pr-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="自動計算されます"
                          />
                        </div>
                        {formData.amount && formData.withholdingAmount && (
                          <p className="mt-1 text-xs text-gray-500">
                            手取り額: ¥
                            {(
                              parseFloat(formData.amount) -
                              parseFloat(formData.withholdingAmount)
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* インボイス制度 */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="invoiceIssued"
                        name="invoiceIssued"
                        checked={formData.invoiceIssued}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="invoiceIssued"
                        className="ml-2 block text-sm text-gray-900"
                      >
                        適格請求書を発行した
                      </label>
                    </div>

                    {formData.invoiceIssued && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label
                            htmlFor="invoiceNumber"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            登録番号（自身の番号）
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
                            請求書発行日
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
                    )}
                  </div>

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
                      <option value="10">10%</option>
                      <option value="8">8%（軽減税率）</option>
                      <option value="0">0%（非課税）</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* その他の管理項目 */}
              <div className="space-y-4">
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
                  <p className="mt-1 text-xs text-gray-500">
                    案件管理用のコード
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="receivedDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    入金日
                  </label>
                  <input
                    type="date"
                    id="receivedDate"
                    name="receivedDate"
                    value={formData.receivedDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    実際に入金された日付
                  </p>
                </div>
              </div>
            </div>

            {/* 送信ボタン */}
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
              <Link
                href="/dashboard/incomes"
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