"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Link from "next/link";
import Image from "next/image";

export default function NewReceipt() {
  const router = useRouter();
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const saveReceipt = useMutation(api.storage.saveReceipt);
  const createExpense = useMutation(api.expenses.createExpense);
  const categories = useQuery(api.expenseCategories.getExpenseCategories) || [];
  const paymentMethods =
    useQuery(api.paymentMethods.getPaymentMethods, { type: "expense" }) || [];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [storageId, setStorageId] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [showQuickInput, setShowQuickInput] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    categoryId: "",
    vendor: "",
    description: "",
    purpose: "",
    paymentMethodId: "PM001",
    taxRate: "10",
    invoiceNumber: "",
    invoiceDate: "",
    projectCode: "",
    isDeductible: true,
  });

  const [recentVendors] = useState([
    "セブンイレブン",
    "ローソン",
    "ファミリーマート",
    "Amazon",
    "楽天市場",
  ]);

  const handleImageChange = (file: File) => {
    if (file) {
      setImageFile(file);
      
      // PDFの場合はプレビューを生成しない
      if (file.type === "application/pdf") {
        setImagePreview("pdf");
        setShowQuickInput(true);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
          setShowQuickInput(true);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) {
      handleImageChange(file);
    } else {
      alert("画像またはPDFファイルを選択してください");
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    setUploading(true);
    try {
      const url = await generateUploadUrl();
      const result = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": imageFile.type },
        body: imageFile,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();
      const receiptId = await saveReceipt({
        storageId,
        fileName: imageFile.name,
        mimeType: imageFile.type,
        size: imageFile.size,
      });

      setStorageId(storageId);
      return receiptId;
    } catch (error) {
      console.error("Upload error:", error);
      alert("画像のアップロードに失敗しました");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let receiptId = null;
    if (imageFile && !storageId) {
      receiptId = await uploadImage();
      if (!receiptId) return;
    }

    try {
      await createExpense({
        receiptId: receiptId || undefined,
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
      });

      router.push("/dashboard/expenses");
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

  return (
    <div className="py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">新規経費登録</h2>
              <Link
                href="/dashboard/expenses"
                className="text-sm text-white hover:text-green-100 transition-colors"
              >
                ✕ キャンセル
              </Link>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 左側: レシート画像とクイック入力 */}
              <div className="space-y-6">
                {/* 画像アップロード */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    レシート画像
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-lg transition-all ${
                      isDragging
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {imagePreview ? (
                      <div className="relative p-4">
                        <div className="relative h-96 w-full bg-gray-100 rounded-lg overflow-hidden">
                          {imageFile?.type === "application/pdf" ? (
                            <div className="flex flex-col items-center justify-center h-full">
                              <svg
                                className="w-24 h-24 text-red-600 mb-4"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10,17L8,15L10,13V14.5C10.5,14.5 14,14 14,10.5C14,10 13.95,9.53 13.86,9.1L15.83,9.5C15.94,10 16,10.5 16,11C16,15.5 11.5,16.5 10,16.5V17M14,12L16,14L14,16V14.5C13.5,14.5 10,15 10,18.5C10,19 10.05,19.47 10.14,19.9L8.17,19.5C8.06,19 8,18.5 8,18C8,13.5 12.5,12.5 14,12.5V12Z" />
                              </svg>
                              <p className="text-gray-700 font-medium">{imageFile.name}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                PDFファイル ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                              </p>
                            </div>
                          ) : (
                            <Image
                              src={imagePreview}
                              alt="レシート画像"
                              fill
                              className="object-contain"
                            />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview("");
                            setStorageId("");
                            setShowQuickInput(false);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          className="absolute top-6 right-6 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg transition-all"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <svg
                          className="mx-auto h-16 w-16 text-gray-400 mb-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-gray-600 mb-2">
                          レシート画像をドラッグ＆ドロップ
                        </p>
                        <p className="text-sm text-gray-500 mb-4">または</p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          ファイルを選択
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept="image/*,application/pdf"
                          onChange={handleFileInput}
                          disabled={uploading}
                        />
                        <p className="text-xs text-gray-500 mt-4">
                          PNG, JPG, HEIF, PDF など（最大10MB）
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* クイック入力パネル */}
                {showQuickInput && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 animate-fade-in">
                    <h3 className="text-sm font-medium text-yellow-800 mb-3">
                      💡 レシートから情報を読み取りますか？
                    </h3>
                    <p className="text-xs text-yellow-700 mb-3">
                      画像から自動で情報を抽出します（現在は手動入力のみ対応）
                    </p>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                        onClick={() => setShowQuickInput(false)}
                      >
                        手動で入力
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 右側: 入力フォーム */}
              <div className="space-y-6">
                {/* 基本情報 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    基本情報
                  </h3>

                  <div className="space-y-4">
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
                          className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                            className="w-full pl-8 pr-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                          className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                          className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        >
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
                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="店舗名・会社名"
                        list="vendor-suggestions"
                      />
                      <datalist id="vendor-suggestions">
                        {recentVendors.map((vendor) => (
                          <option key={vendor} value={vendor} />
                        ))}
                      </datalist>
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
                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                            <span>
                              ¥{taxDetails.beforeTax.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">消費税:</span>
                            <span>
                              ¥{taxDetails.taxAmount.toLocaleString()}
                            </span>
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
                          className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                          className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
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
                    className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="例：PRJ-2024-001"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    案件管理用のコード
                  </p>
                </div>
              </div>
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
                disabled={uploading}
                className="px-6 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? "アップロード中..." : "✓ 保存"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
