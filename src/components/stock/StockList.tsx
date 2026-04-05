'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface StockItem {
  id: number;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: string;
  minStockLevel: number;
  category: string;
  supplier?: {
    name: string;
  };
}

interface StockListProps {
  category?: string;
  lowStockOnly?: boolean;
}

export default function StockList({ category, lowStockOnly = false }: StockListProps) {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState(category || '');
  const [showLowStockOnly, setShowLowStockOnly] = useState(lowStockOnly);
  const { data: session } = useSession();

  useEffect(() => {
    fetchStockItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, showLowStockOnly, searchTerm]);

  const fetchStockItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterCategory) params.append('category', filterCategory);
      if (showLowStockOnly) params.append('lowStock', 'true');

      const response = await fetch(`/api/stock?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stock items');
      }

      const result = await response.json();
      let data = result.data?.data || result.data || [];

      // Client-side search filter
      if (searchTerm) {
        data = data.filter(
          (item: StockItem) =>
            item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (item: StockItem) => {
    if (item.quantity <= 0) {
      return { status: 'out-of-stock', label: 'Out of Stock', color: 'text-red-600' };
    } else if (item.quantity <= item.minStockLevel) {
      return { status: 'low-stock', label: 'Low Stock', color: 'text-yellow-600' };
    } else {
      return { status: 'in-stock', label: 'In Stock', color: 'text-green-600' };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-slate-500">Loading stock items...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex gap-4 flex-wrap items-center">
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Search by item name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          <option value="consumables">Consumables</option>
          <option value="equipment">Equipment</option>
          <option value="supplies">Supplies</option>
          <option value="medications">Medications</option>
        </select>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showLowStockOnly}
            onChange={(e) => setShowLowStockOnly(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-slate-700">Low Stock Only</span>
        </label>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Stock Items Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    No stock items found
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const { label, color } = getStockStatus(item);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                        {item.itemName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">
                        ${parseFloat(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {item.supplier?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${color}`}>{label}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/stock/${item.id}`}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          View
                        </Link>
                        {session?.user && (
                          <>
                            <Link
                              href={`/stock/${item.id}/edit`}
                              className="text-blue-600 hover:text-blue-800 mr-3"
                            >
                              Edit
                            </Link>
                            <Link
                              href={`/stock/${item.id}/usage`}
                              className="text-green-600 hover:text-green-800"
                            >
                              Usage
                            </Link>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-slate-600">Total Items</div>
            <div className="text-2xl font-bold text-slate-900">{items.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-slate-600">Low Stock Items</div>
            <div className="text-2xl font-bold text-yellow-600">
              {items.filter((i) => i.quantity <= i.minStockLevel && i.quantity > 0).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-slate-600">Out of Stock</div>
            <div className="text-2xl font-bold text-red-600">
              {items.filter((i) => i.quantity <= 0).length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
