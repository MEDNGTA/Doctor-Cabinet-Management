'use client';

import { useEffect, useState } from 'react';

interface PerformedBy {
  firstName: string;
  lastName: string;
  id: number;
}

interface StockTransaction {
  id: number;
  stockItemId: number;
  transactionType: string;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  referenceId?: number;
  createdAt: string;
  performedBy: PerformedBy;
  stockItem: {
    itemName: string;
  };
}

interface TransactionHistoryProps {
  stockItemId?: number;
  limit?: number;
}

export default function TransactionHistory({
  stockItemId,
  limit = 50,
}: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    offset: 0,
    total: 0,
    hasMore: false,
  });

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTransactions = async (offset = 0) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (stockItemId) params.append('stockItemId', stockItemId.toString());
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await fetch(`/api/stock/transactions?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const result = await response.json();
      setTransactions(result.data.data || []);
      setPagination({
        offset,
        total: result.data.pagination.total,
        hasMore: result.data.pagination.hasMore,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'bg-green-100 text-green-800';
      case 'usage':
        return 'bg-blue-100 text-blue-800';
      case 'return':
        return 'bg-purple-100 text-purple-800';
      case 'waste':
        return 'bg-red-100 text-red-800';
      case 'adjustment':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getQuantityChange = (transaction: StockTransaction) => {
    const change = transaction.newQuantity - transaction.previousQuantity;
    return change > 0 ? `+${change}` : change.toString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-slate-500">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Before
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                  After
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Performed By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(transaction.createdAt).toLocaleDateString()} at{' '}
                      {new Date(transaction.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(
                          transaction.transactionType
                        )}`}
                      >
                        {transaction.transactionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      <span
                        className={
                          parseInt(getQuantityChange(transaction)) > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {getQuantityChange(transaction)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">
                      {transaction.previousQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900">
                      {transaction.newQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {transaction.performedBy.firstName} {transaction.performedBy.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                      {transaction.reason || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => fetchTransactions(pagination.offset + limit)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Load More
          </button>
        </div>
      )}

      {pagination.total > 0 && (
        <div className="text-sm text-slate-600">
          Showing {transactions.length} of {pagination.total} transactions
        </div>
      )}
    </div>
  );
}
