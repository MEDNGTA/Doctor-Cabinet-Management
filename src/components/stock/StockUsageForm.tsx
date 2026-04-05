'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface StockUsageFormProps {
  stockItemId: number;
  itemName: string;
  currentQuantity: number;
  onSuccess?: () => void;
}

type TransactionType = 'usage' | 'return' | 'adjustment' | 'waste';

export default function StockUsageForm({
  stockItemId,
  itemName,
  currentQuantity,
  onSuccess,
}: StockUsageFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'usage' as TransactionType,
    quantityChange: '',
    reason: '',
    referenceId: '',
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const quantityChange = parseInt(formData.quantityChange);

      if (isNaN(quantityChange) || quantityChange === 0) {
        throw new Error('Please enter a valid quantity');
      }

      // Validate quantity won't go negative
      const newQuantity = currentQuantity - (formData.type === 'usage' || formData.type === 'waste' ? quantityChange : -quantityChange);
      
      if (newQuantity < 0 && formData.type !== 'return') {
        throw new Error('Insufficient stock for this operation');
      }

      const response = await fetch(`/api/stock/${stockItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          quantityChange: formData.type === 'usage' || formData.type === 'waste' ? -quantityChange : quantityChange,
          reason: formData.reason || null,
          referenceId: formData.referenceId ? parseInt(formData.referenceId) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to record usage');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/stock/${stockItemId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Record Stock Activity</h2>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Item Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium">Item</div>
          <div className="text-lg font-bold text-blue-900">{itemName}</div>
          <div className="text-sm text-blue-700 mt-2">
            Current Quantity: <span className="font-bold">{currentQuantity}</span>
          </div>
        </div>

        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Transaction Type *
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="usage">Usage (Decrease)</option>
            <option value="return">Return (Increase)</option>
            <option value="waste">Waste (Decrease)</option>
            <option value="adjustment">Adjustment (Manual)</option>
          </select>
          <p className="text-sm text-slate-500 mt-1">
            {formData.type === 'usage' &&
              'Record when stock is used in patient care'}
            {formData.type === 'return' &&
              'Record when items are returned to stock'}
            {formData.type === 'waste' &&
              'Record when items are damaged or expired'}
            {formData.type === 'adjustment' &&
              'Manual adjustment for inventory discrepancies'}
          </p>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Quantity *
          </label>
          <input
            type="number"
            name="quantityChange"
            value={formData.quantityChange}
            onChange={handleChange}
            required
            min="1"
            placeholder="Enter quantity"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {formData.quantityChange && (
            <p className="text-sm text-slate-600 mt-2">
              New quantity will be: <span className="font-bold">
                {currentQuantity -
                  (formData.type === 'usage' || formData.type === 'waste'
                    ? parseInt(formData.quantityChange) || 0
                    : -parseInt(formData.quantityChange) || 0)}
              </span>
            </p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Reason
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            placeholder="Reason for this activity (optional)"
            rows={3}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Reference ID */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Reference ID
          </label>
          <input
            type="number"
            name="referenceId"
            value={formData.referenceId}
            onChange={handleChange}
            placeholder="Optional: Link to test, appointment, or restock order ID"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Recording...' : 'Record Activity'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
