'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface RestockOrder {
  id: number;
  stockItem: {
    id: number;
    itemName: string;
  };
  supplier: {
    name: string;
    contactPerson: string;
    phone: string;
  };
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  status: string;
  orderedBy: {
    firstName: string;
    lastName: string;
  };
}

export default function RestockOrdersPage() {
  const [orders, setOrders] = useState<RestockOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchRestockOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchRestockOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/stock/restock-orders?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch restock orders');
      }

      const result = await response.json();
      setOrders(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const daysOverdue = (date: string) => {
    const days = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days > 0 ? days : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Restock Orders</h1>
          <p className="text-slate-600 mt-2">Manage inventory replenishment</p>
        </div>
        <Link href="/stock/restock/new" className="btn-primary">
          Create Restock Order
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <p className="text-slate-500">Loading restock orders...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Expected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                      No restock orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const overdue = order.expectedDeliveryDate
                      ? daysOverdue(order.expectedDeliveryDate)
                      : 0;
                    const isOverdue =
                      overdue > 0 && (order.status === 'pending' || order.status !== 'received');

                    return (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                          <Link
                            href={`/stock/${order.stockItem.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {order.stockItem.itemName}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-slate-900">
                          {order.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-slate-600">
                          ${parseFloat(order.unitPrice).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-900">
                          ${parseFloat(order.totalPrice).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          {order.supplier.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="text-slate-900">
                            {order.expectedDeliveryDate
                              ? new Date(order.expectedDeliveryDate).toLocaleDateString()
                              : '-'}
                          </div>
                          {isOverdue && (
                            <div className="text-red-600 text-xs font-medium">
                              {overdue} days overdue
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/stock/restock/${order.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {orders.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-slate-600">Total Orders</div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{orders.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-slate-600">Pending</div>
            <div className="text-2xl font-bold text-yellow-600 mt-2">
              {orders.filter((o) => o.status === 'pending').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-slate-600">Total Value</div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              $
              {orders
                .reduce((sum, o) => sum + parseFloat(o.totalPrice), 0)
                .toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
