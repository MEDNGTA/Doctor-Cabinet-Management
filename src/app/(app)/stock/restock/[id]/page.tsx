'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface RestockOrderDetail {
  id: number;
  stockItem: {
    id: number;
    itemName: string;
  };
  supplier: {
    id: number;
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
  };
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  status: string;
  orderNotes?: string;
  orderedBy: {
    firstName: string;
    lastName: string;
  };
}

export default function RestockOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = parseInt(params.id as string);

  const [order, setOrder] = useState<RestockOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchOrderDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stock/restock-orders/${orderId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch restock order');
      }

      const result = await response.json();
      setOrder(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/stock/restock-orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          actualDeliveryDate: newStatus === 'received' ? new Date().toISOString() : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      const result = await response.json();
      setOrder(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!order) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/stock/restock-orders/${order.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      router.push('/stock/restock');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete order');
      setUpdating(false);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-slate-500">Loading restock order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">Restock Order Not Found</h1>
        <p className="text-slate-600">The restock order you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/stock/restock" className="text-blue-600 hover:text-blue-800">
          Back to Restock Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Restock Order #{order.id}</h1>
          <p className="text-slate-600 mt-2">
            {new Date(order.orderDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-3">
          {order.status === 'pending' && (
            <>
              <button
                onClick={() => handleStatusChange('received')}
                disabled={updating}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {updating ? 'Updating...' : 'Mark as Received'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Cancel Order
              </button>
            </>
          )}
          <Link href="/stock/restock" className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 font-medium">
            Back
          </Link>
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
            <h2 className="text-xl font-bold text-slate-900 mb-4">Cancel Order?</h2>
            <p className="text-slate-600 mb-6">
              Are you sure you want to cancel this restock order? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300"
              >
                Keep Order
              </button>
              <button
                onClick={handleDelete}
                disabled={updating}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {updating ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Info Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-slate-600 font-medium">Status</div>
          <div className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {order.status}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-slate-600 font-medium">Total Amount</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">
            ${parseFloat(order.totalPrice).toFixed(2)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-slate-600 font-medium">Quantity</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{order.quantity}</div>
        </div>
      </div>

      {/* Details Sections */}
      <div className="grid grid-cols-2 gap-6">
        {/* Item Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Item Details</h2>
          <div className="space-y-4">
            <div className="pb-3 border-b">
              <div className="text-sm text-slate-600">Item Name</div>
              <div className="font-medium text-slate-900">
                <Link
                  href={`/stock/${order.stockItem.id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {order.stockItem.itemName}
                </Link>
              </div>
            </div>
            <div className="pb-3 border-b">
              <div className="text-sm text-slate-600">Quantity Ordered</div>
              <div className="font-medium text-slate-900">{order.quantity}</div>
            </div>
            <div className="pb-3 border-b">
              <div className="text-sm text-slate-600">Unit Price</div>
              <div className="font-medium text-slate-900">
                ${parseFloat(order.unitPrice).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-600">Total Price</div>
              <div className="font-medium text-slate-900 text-lg">
                ${parseFloat(order.totalPrice).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Supplier Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Supplier Details</h2>
          <div className="space-y-4">
            <div className="pb-3 border-b">
              <div className="text-sm text-slate-600">Supplier Name</div>
              <div className="font-medium text-slate-900">{order.supplier.name}</div>
            </div>
            <div className="pb-3 border-b">
              <div className="text-sm text-slate-600">Contact Person</div>
              <div className="font-medium text-slate-900">
                {order.supplier.contactPerson || '-'}
              </div>
            </div>
            <div className="pb-3 border-b">
              <div className="text-sm text-slate-600">Phone</div>
              <a
                href={`tel:${order.supplier.phone}`}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {order.supplier.phone || '-'}
              </a>
            </div>
            <div>
              <div className="text-sm text-slate-600">Email</div>
              <a
                href={`mailto:${order.supplier.email}`}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {order.supplier.email || '-'}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Delivery Details</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-slate-600 font-medium">Order Date</div>
            <div className="font-medium text-slate-900">
              {new Date(order.orderDate).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-600 font-medium">Expected Delivery</div>
            <div className="font-medium text-slate-900">
              {order.expectedDeliveryDate
                ? new Date(order.expectedDeliveryDate).toLocaleDateString()
                : '-'}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-600 font-medium">Actual Delivery</div>
            <div className="font-medium text-slate-900">
              {order.actualDeliveryDate
                ? new Date(order.actualDeliveryDate).toLocaleDateString()
                : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Order Notes */}
      {order.orderNotes && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Order Notes</h2>
          <p className="text-slate-600 whitespace-pre-wrap">{order.orderNotes}</p>
        </div>
      )}

      {/* Order Metadata */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Order Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-slate-600 font-medium">Order ID</div>
            <div className="font-medium text-slate-900">#{order.id}</div>
          </div>
          <div>
            <div className="text-sm text-slate-600 font-medium">Ordered By</div>
            <div className="font-medium text-slate-900">
              {order.orderedBy.firstName} {order.orderedBy.lastName}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
