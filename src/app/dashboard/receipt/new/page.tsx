"use client";

import { useState } from "react";
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
  const categories = useQuery(api.categories.getCategories) || [];

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [storageId, setStorageId] = useState<string>("");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    category: "",
    vendor: "",
    description: "",
    purpose: "",
    paymentMethod: "現金",
    taxRate: "10",
    invoiceNumber: "",
    invoiceDate: "",
    projectCode: "",
    isDeductible: true,
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
        category: formData.category,
        vendor: formData.vendor,
        description: formData.description || undefined,
        purpose: formData.purpose || undefined,
        paymentMethod: formData.paymentMethod || undefined,
        taxRate: formData.taxRate ? parseFloat(formData.taxRate) : undefined,
        invoiceNumber: formData.invoiceNumber || undefined,
        invoiceDate: formData.invoiceDate || undefined,
        projectCode: formData.projectCode || undefined,
        isDeductible: formData.isDeductible,
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Save error:", error);
      alert("保存に失敗しました");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">新規レシート登録</h2>
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                キャンセル
              </Link>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 画像アップロード */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                レシート画像
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="relative">
                      <div className="relative h-64 w-full">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-contain rounded"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview("");
                          setStorageId("");
                        }}
                        className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                          <span>ファイルを選択</span>
                          <input
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageChange}
                            disabled={uploading}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 日付 */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                日付 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                value={formData.date}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* 金額 */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                金額 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">¥</span>
                </div>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  required
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="pl-7 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="0"
                />
              </div>
            </div>

            {/* カテゴリ */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                カテゴリ <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">選択してください</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 支払先 */}
            <div>
              <label htmlFor="vendor" className="block text-sm font-medium text-gray-700">
                支払先 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="vendor"
                name="vendor"
                required
                value={formData.vendor}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="株式会社〇〇"
              />
            </div>

            {/* 支払方法 */}
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                支払方法
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="現金">現金</option>
                <option value="クレジットカード">クレジットカード</option>
                <option value="銀行振込">銀行振込</option>
                <option value="電子マネー">電子マネー</option>
                <option value="その他">その他</option>
              </select>
            </div>

            {/* 消費税率 */}
            <div>
              <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700">
                消費税率
              </label>
              <select
                id="taxRate"
                name="taxRate"
                value={formData.taxRate}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="10">10%</option>
                <option value="8">8%（軽減税率）</option>
                <option value="0">0%（非課税）</option>
              </select>
            </div>

            {/* 備考 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                備考
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="メモや詳細情報"
              />
            </div>

            {/* 目的（確定申告用） */}
            <div>
              <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
                目的（確定申告用）
              </label>
              <input
                type="text"
                id="purpose"
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="例：クライアントとの打ち合わせ"
              />
            </div>

            {/* インボイス制度関連 */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium text-gray-900">インボイス制度関連</h3>
              
              {/* 適格請求書発行事業者登録番号 */}
              <div>
                <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700">
                  適格請求書発行事業者登録番号
                </label>
                <input
                  type="text"
                  id="invoiceNumber"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="T1234567890123"
                  pattern="T\d{13}"
                  maxLength={14}
                />
                <p className="mt-1 text-xs text-gray-500">T + 13桁の数字</p>
              </div>

              {/* 請求書日付 */}
              <div>
                <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700">
                  請求書日付
                </label>
                <input
                  type="date"
                  id="invoiceDate"
                  name="invoiceDate"
                  value={formData.invoiceDate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* その他の管理項目 */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium text-gray-900">その他の管理項目</h3>
              
              {/* プロジェクトコード */}
              <div>
                <label htmlFor="projectCode" className="block text-sm font-medium text-gray-700">
                  プロジェクトコード
                </label>
                <input
                  type="text"
                  id="projectCode"
                  name="projectCode"
                  value={formData.projectCode}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="例：PRJ-2024-001"
                />
                <p className="mt-1 text-xs text-gray-500">案件管理用のコード</p>
              </div>

              {/* 控除対象 */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDeductible"
                  name="isDeductible"
                  checked={formData.isDeductible}
                  onChange={(e) => setFormData({ ...formData, isDeductible: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isDeductible" className="ml-2 block text-sm text-gray-900">
                  控除対象経費として計上する
                </label>
              </div>
            </div>

            {/* ボタン */}
            <div className="flex justify-end space-x-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "アップロード中..." : "保存"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}