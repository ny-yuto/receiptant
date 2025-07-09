"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Link from "next/link";

export default function NewIncome() {
  const router = useRouter();
  const createIncome = useMutation(api.incomes.createIncome);
  const categories = useQuery(api.incomeCategories.getIncomeCategories) || [];
  const paymentMethods =
    useQuery(api.paymentMethods.getPaymentMethods, { type: "income" }) || [];

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    categoryId: "",
    client: "",
    description: "",
    projectName: "",
    paymentMethodId: "PM004",
    withholding: false,
    withholdingAmount: "",
    withholdingRate: "10.21",
    invoiceNumber: "",
    invoiceIssued: false,
    invoiceDate: "",
    taxRate: "10",
    projectCode: "",
    receivedDate: "",
  });

  const steps = [
    { id: 1, name: "基本情報", icon: "📝" },
    { id: 2, name: "源泉徴収・税務", icon: "📊" },
    { id: 3, name: "その他", icon: "📋" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createIncome({
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
        receivedDate: formData.receivedDate || undefined,
      });

      router.push("/dashboard/incomes");
    } catch (error) {
      console.error("Save error:", error);
      alert("保存に失敗しました");
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

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return (
          formData.date &&
          formData.amount &&
          formData.categoryId &&
          formData.client
        );
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">新規収入登録</h2>
              <Link
                href="/dashboard/incomes"
                className="text-sm text-white hover:text-blue-100 transition-colors"
              >
                ✕ キャンセル
              </Link>
            </div>
          </div>

          {/* プログレスバー */}
          <div className="px-6 pt-6">
            <div className="flex items-center justify-between mb-8">
              {steps.map((step, index) => (
                <div key={step.id} className="flex-1">
                  <div className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                        currentStep >= step.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      <span className="text-lg">{step.icon}</span>
                    </div>
                    <div className="flex-1 ml-3">
                      <p
                        className={`text-sm font-medium ${
                          currentStep >= step.id
                            ? "text-gray-900"
                            : "text-gray-500"
                        }`}
                      >
                        {step.name}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-2 transition-all ${
                          currentStep > step.id ? "bg-blue-600" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={
              currentStep === 3 ? handleSubmit : (e) => e.preventDefault()
            }
            className="px-6 pb-6"
          >
            {/* ステップ1: 基本情報 */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 日付 */}
                  <div>
                    <label
                      htmlFor="date"
                      className="block text-sm font-medium text-gray-700 mb-2"
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
                      className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  {/* 金額 */}
                  <div>
                    <label
                      htmlFor="amount"
                      className="block text-sm font-medium text-gray-700 mb-2"
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
                        className="w-full pl-8 pr-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* カテゴリ */}
                <div>
                  <label
                    htmlFor="categoryId"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    カテゴリ <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    required
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                    className="block text-sm font-medium text-gray-700 mb-2"
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
                    className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="株式会社〇〇"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* プロジェクト名 */}
                  <div>
                    <label
                      htmlFor="projectName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      プロジェクト名
                    </label>
                    <input
                      type="text"
                      id="projectName"
                      name="projectName"
                      value={formData.projectName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="〇〇サイト制作"
                    />
                  </div>

                  {/* 受取方法 */}
                  <div>
                    <label
                      htmlFor="paymentMethodId"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      受取方法
                    </label>
                    <select
                      id="paymentMethodId"
                      name="paymentMethodId"
                      value={formData.paymentMethodId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
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
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    備考
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="メモや詳細情報"
                  />
                </div>
              </div>
            )}

            {/* ステップ2: 源泉徴収・税務 */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                {/* 源泉徴収 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    源泉徴収
                  </h3>

                  <div className="space-y-4">
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
                            className="block text-sm font-medium text-gray-700 mb-2"
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
                            className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="10.21"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            通常は10.21%（復興特別所得税含む）
                          </p>
                        </div>

                        <div>
                          <label
                            htmlFor="withholdingAmount"
                            className="block text-sm font-medium text-gray-700 mb-2"
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
                              className="w-full pl-8 pr-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  </div>
                </div>

                {/* インボイス制度 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    インボイス制度
                  </h3>

                  <div className="space-y-4">
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
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            登録番号（自身の番号）
                          </label>
                          <input
                            type="text"
                            id="invoiceNumber"
                            name="invoiceNumber"
                            value={formData.invoiceNumber}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            請求書発行日
                          </label>
                          <input
                            type="date"
                            id="invoiceDate"
                            name="invoiceDate"
                            value={formData.invoiceDate}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 消費税率 */}
                <div>
                  <label
                    htmlFor="taxRate"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    消費税率
                  </label>
                  <select
                    id="taxRate"
                    name="taxRate"
                    value={formData.taxRate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="10">10%</option>
                    <option value="8">8%（軽減税率）</option>
                    <option value="0">0%（非課税）</option>
                  </select>
                </div>
              </div>
            )}

            {/* ステップ3: その他 */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    その他の管理項目
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="projectCode"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        プロジェクトコード
                      </label>
                      <input
                        type="text"
                        id="projectCode"
                        name="projectCode"
                        value={formData.projectCode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="例：PRJ-2024-001"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        案件管理用のコード
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="receivedDate"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        入金日
                      </label>
                      <input
                        type="date"
                        id="receivedDate"
                        name="receivedDate"
                        value={formData.receivedDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        実際に入金された日付
                      </p>
                    </div>
                  </div>
                </div>

                {/* サマリー */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    入力内容の確認
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">発生日:</span>
                      <span className="font-medium">{formData.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">金額:</span>
                      <span className="font-medium">
                        ¥
                        {formData.amount
                          ? parseInt(formData.amount).toLocaleString()
                          : 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">クライアント:</span>
                      <span className="font-medium">{formData.client}</span>
                    </div>
                    {formData.withholding && formData.withholdingAmount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">手取り額:</span>
                        <span className="font-medium text-green-600">
                          ¥
                          {(
                            parseFloat(formData.amount) -
                            parseFloat(formData.withholdingAmount)
                          ).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ナビゲーションボタン */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
                  currentStep === 1
                    ? "invisible"
                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                }`}
              >
                ← 前へ
              </button>

              <div className="flex space-x-3">
                <Link
                  href="/dashboard/incomes"
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                >
                  キャンセル
                </Link>

                {currentStep < 3 && (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!isStepValid(currentStep)}
                    className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
                      isStepValid(currentStep)
                        ? "text-white bg-blue-600 hover:bg-blue-700"
                        : "text-gray-400 bg-gray-200 cursor-not-allowed"
                    }`}
                  >
                    次へ →
                  </button>
                )}
                {currentStep >= 3 && (
                  <button
                    type="submit"
                    className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all"
                  >
                    ✓ 保存
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
