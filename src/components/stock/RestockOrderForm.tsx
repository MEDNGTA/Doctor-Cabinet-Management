'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

interface StockItem {
  id: number;
  itemName: string;
  quantity: number;
  minStockLevel: number;
  reorderPoint: number;
  unit: string;
}

interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
}

interface RestockOrderForm {
  stockItemId: string;
  supplierId: string;
  quantity: string;
  unitPrice: string;
  expectedDeliveryDate: string;
  orderNotes: string;
}

export default function RestockOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemId = searchParams.get('itemId');

  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<RestockOrderForm>({
    stockItemId: itemId || '',
    supplierId: '',
    quantity: '',
    unitPrice: '',
    expectedDeliveryDate: '',
    orderNotes: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [itemsRes, suppliersRes] = await Promise.all([
          fetch('/api/stock'),
          fetch('/api/suppliers'),
        ]);

        if (!itemsRes.ok || !suppliersRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const itemsData = await itemsRes.json();
        const suppliersData = await suppliersRes.json();

        setStockItems(itemsData.data || []);
        setSuppliers(suppliersData.data || []);

        // Pre-select item if provided
        if (itemId) {
          const item = (itemsData.data || []).find(
            (i: StockItem) => i.id === parseInt(itemId)
          );
          if (item) {
            setSelectedItem(item);
            setFormData((prev) => ({
              ...prev,
              stockItemId: item.id.toString(),
              unitPrice: '', // Let user input
            }));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [itemId]);

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itemIdVal = e.target.value;
    setFormData((prev) => ({ ...prev, stockItemId: itemIdVal }));

    const item = stockItems.find((i) => i.id === parseInt(itemIdVal));
    setSelectedItem(item || null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!formData.stockItemId || !formData.supplierId || !formData.quantity || !formData.unitPrice) {
        throw new Error('Please fill in all required fields');
      }

      const response = await fetch('/api/stock/restock-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockItemId: parseInt(formData.stockItemId),
          supplierId: parseInt(formData.supplierId),
          quantity: parseInt(formData.quantity),
          unitPrice: parseFloat(formData.unitPrice),
          expectedDeliveryDate: formData.expectedDeliveryDate || null,
          orderNotes: formData.orderNotes || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create restock order');
      }

      router.push('/stock/restock');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-slate-500">Loading form data...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Create Restock Order</h2>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Stock Item */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Stock Item *
          </label>
          <select
            name="stockItemId"
            value={formData.stockItemId}
            onChange={handleItemChange}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select item</option>
            {stockItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.itemName} (Current: {item.quantity} {item.unit})
              </option>
            ))}
          </select>
        </div>

        {/* Selected Item Info */}
        {selectedItem && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-blue-600 font-medium">Current Stock</div>
                <div className="text-blue-900 font-bold">
                  {selectedItem.quantity} {selectedItem.unit}
                </div>
              </div>
              <div>
                <div className="text-blue-600 font-medium">Min Level</div>
                <div className="text-blue-900 font-bold">{selectedItem.minStockLevel}</div>
              </div>
              <div>
                <div className="text-blue-600 font-medium">Reorder Point</div>
                <div className="text-blue-900 font-bold">{selectedItem.reorderPoint}</div>
              </div>
              <div>
                <div className="text-blue-600 font-medium">Recommended Qty</div>
                <div className="text-blue-900 font-bold">
                  {Math.max(0, selectedItem.minStockLevel * 2 - selectedItem.quantity)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Supplier */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Supplier *
          </label>
          <select
            name="supplierId"
            value={formData.supplierId}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name} - {supplier.contactPerson || ''}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Quantity *
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
            min="1"
            placeholder="Enter quantity"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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

        {/* Total */}
        {formData.quantity && formData.unitPrice && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="text-sm text-slate-600">Estimated Total</div>
            <div className="text-3xl font-bold text-slate-900 mt-2">
              ${(parseInt(formData.quantity) * parseFloat(formData.unitPrice)).toFixed(2)}
            </div>
          </div>
        )}

        {/* Expected Delivery Date */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Expected Delivery Date
          </label>
          <input
            type="date"
            name="expectedDeliveryDate"
            value={formData.expectedDeliveryDate}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Order Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Order Notes
          </label>
          <textarea
            name="orderNotes"
            value={formData.orderNotes}
            onChange={handleChange}
            placeholder="Any special instructions or notes (optional)"
            rows={3}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {submitting ? 'Creating Order...' : 'Create Order'}
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
