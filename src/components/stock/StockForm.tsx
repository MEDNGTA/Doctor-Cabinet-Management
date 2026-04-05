'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Supplier {
  id: number;
  name: string;
}

interface StockItem {
  id?: number;
  itemName: string;
  description?: string;
  category: string;
  unit: string;
  minStockLevel: number;
  maxStockLevel?: number;
  unitPrice: string;
  supplierId?: number;
  reorderPoint?: number;
  initialQuantity?: number;
}

interface StockFormProps {
  item?: StockItem;
  onSuccess?: () => void;
}

export default function StockForm({ item, onSuccess }: StockFormProps) {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<StockItem>(
    item || {
      itemName: '',
      description: '',
      category: '',
      unit: '',
      minStockLevel: 10,
      maxStockLevel: undefined,
      unitPrice: '',
      supplierId: undefined,
      reorderPoint: 10,
      initialQuantity: 0,
    }
  );

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers');
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      const result = await response.json();
      setSuppliers(result.data || []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'number'
          ? value === ''
            ? undefined
            : parseInt(value)
          : type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const method = item?.id ? 'PUT' : 'POST';
      const endpoint = item?.id
        ? `/api/stock/${item.id}`
        : '/api/stock';

      const payload = item?.id
        ? {
            itemName: formData.itemName,
            description: formData.description,
            category: formData.category,
            unit: formData.unit,
            minStockLevel: formData.minStockLevel,
            maxStockLevel: formData.maxStockLevel,
            unitPrice: formData.unitPrice,
            supplierId: formData.supplierId,
            reorderPoint: formData.reorderPoint,
          }
        : {
            ...formData,
            supplierId: formData.supplierId || null,
          };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save stock item');
      }

      const result = await response.json();
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/stock/${result.data.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Item Name */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Item Name *
          </label>
          <input
            type="text"
            name="itemName"
            value={formData.itemName}
            onChange={handleChange}
            required
            placeholder="e.g., Syringes 10ml"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            placeholder="Optional description"
            rows={3}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select category</option>
            <option value="consumables">Consumables</option>
            <option value="equipment">Equipment</option>
            <option value="supplies">Supplies</option>
            <option value="medications">Medications</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Unit */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Unit *
          </label>
          <select
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select unit</option>
            <option value="Box">Box</option>
            <option value="Bottle">Bottle</option>
            <option value="Units">Units</option>
            <option value="Ml">Ml</option>
            <option value="Grams">Grams</option>
            <option value="Pieces">Pieces</option>
          </select>
        </div>

        {/* Unit Price */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Unit Price *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-2 text-slate-600">$</span>
            <input
              type="number"
              name="unitPrice"
              value={formData.unitPrice}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Stock Levels */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Min Stock Level
            </label>
            <input
              type="number"
              name="minStockLevel"
              value={formData.minStockLevel}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Max Stock Level
            </label>
            <input
              type="number"
              name="maxStockLevel"
              value={formData.maxStockLevel || ''}
              onChange={handleChange}
              min="0"
              placeholder="Optional"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Reorder Point
            </label>
            <input
              type="number"
              name="reorderPoint"
              value={formData.reorderPoint}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Supplier */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Supplier
          </label>
          <select
            name="supplierId"
            value={formData.supplierId || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select supplier (optional)</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        {/* Initial Quantity (Create only) */}
        {!item?.id && (
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Initial Quantity
            </label>
            <input
              type="number"
              name="initialQuantity"
              value={formData.initialQuantity || 0}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Saving...' : item?.id ? 'Update Item' : 'Create Item'}
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
