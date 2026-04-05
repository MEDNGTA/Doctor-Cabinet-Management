'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import TransactionHistory from '@/components/stock/TransactionHistory';

interface StockDetail {
  id: number;
  itemName: string;
  description?: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: string;
  minStockLevel: number;
  maxStockLevel?: number;
  reorderPoint: number;
  supplier?: {
    id: number;
    name: string;
    contactPerson: string;
    phone: string;
  };
  lastRestockDate?: string;
  createdAt: string;
  updatedAt: string;
}

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const stockId = parseInt(params.id as string);

  const [stock, setStock] = useState<StockDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchStockDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockId]);

  const fetchStockDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stock/${stockId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch stock item');
      }

      const result = await response.json();
      setStock(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!stock) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/stock/${stock.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete stock item');
      }

      router.push('/stock');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      setDeleting(false);
    }
  };

  const getStockStatus = () => {
    if (!stock) return null;

    if (stock.quantity <= 0) {
      return { status: 'out-of-stock', label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    } else if (stock.quantity <= stock.minStockLevel) {
      return {
        status: 'low-stock',
        label: 'Low Stock',
        color: 'bg-yellow-100 text-yellow-800',
      };
    } else {
      return { status: 'in-stock', label: 'In Stock', color: 'bg-green-100 text-green-800' };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-slate-500">Loading stock details...</p>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">Stock Item Not Found</h1>
        <p className="text-slate-600">The stock item you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/stock" className="text-blue-600 hover:text-blue-800">
          Back to Stock List
        </Link>
      </div>
    );
  }

  const statusInfo = getStockStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">{stock.itemName}</h1>
          <p className="text-slate-600 mt-2">{stock.description}</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/stock/${stock.id}/edit`} className="btn-secondary">
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Delete Stock Item?</h2>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete <strong>{stock.itemName}</strong>? This action
              cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-slate-600 font-medium">Current Quantity</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{stock.quantity}</div>
          <div className="text-sm text-slate-500 mt-1">{stock.unit}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-slate-600 font-medium">Status</div>
          <div className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${statusInfo?.color}`}>
            {statusInfo?.label}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-slate-600 font-medium">Unit Price</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">
            ${parseFloat(stock.unitPrice).toFixed(2)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-slate-600 font-medium">Total Value</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">
            ${(stock.quantity * parseFloat(stock.unitPrice)).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Details Sections */}
      <div className="grid grid-cols-2 gap-6">
        {/* Stock Levels */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Stock Levels</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-slate-600">Current Quantity</span>
              <span className="font-bold text-slate-900">{stock.quantity}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-slate-600">Min Level</span>
              <span className="font-bold text-slate-900">{stock.minStockLevel}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-slate-600">Max Level</span>
              <span className="font-bold text-slate-900">{stock.maxStockLevel || 'Not set'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Reorder Point</span>
              <span className="font-bold text-slate-900">{stock.reorderPoint}</span>
            </div>
          </div>
        </div>

        {/* Item Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Item Details</h2>
          <div className="space-y-4">
            <div className="pb-3 border-b">
              <div className="text-sm text-slate-600">Category</div>
              <div className="font-medium text-slate-900">{stock.category}</div>
            </div>
            <div className="pb-3 border-b">
              <div className="text-sm text-slate-600">Unit</div>
              <div className="font-medium text-slate-900">{stock.unit}</div>
            </div>
            <div className="pb-3 border-b">
              <div className="text-sm text-slate-600">Supplier</div>
              <div className="font-medium text-slate-900">
                {stock.supplier ? (
                  <Link
                    href={`/suppliers/${stock.supplier.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {stock.supplier.name}
                  </Link>
                ) : (
                  'Not assigned'
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-600">Last Restock</div>
              <div className="font-medium text-slate-900">
                {stock.lastRestockDate
                  ? new Date(stock.lastRestockDate).toLocaleDateString()
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href={`/stock/${stock.id}/usage`}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-medium"
          >
            Record Usage
          </Link>
          <Link
            href={`/stock/restock?itemId=${stock.id}`}
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center font-medium"
          >
            Restock Order
          </Link>
          <Link
            href={`/stock/${stock.id}/edit`}
            className="px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 text-center font-medium"
          >
            Edit Details
          </Link>
          <Link
            href="/stock"
            className="px-4 py-3 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 text-center font-medium"
          >
            Back to List
          </Link>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Transaction History</h2>
        <TransactionHistory stockItemId={stock.id} limit={20} />
      </div>
    </div>
  );
}
