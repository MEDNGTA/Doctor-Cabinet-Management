'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import StockUsageForm from '@/components/stock/StockUsageForm';

interface StockItem {
  id: number;
  itemName: string;
  quantity: number;
}

export default function StockUsagePage() {
  const params = useParams();
  const stockId = parseInt(params.id as string);

  const [stock, setStock] = useState<StockItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStockItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockId]);

  const fetchStockItem = async () => {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-slate-500">Loading stock item...</p>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">Error</h1>
        <p className="text-slate-600">{error || 'Stock item not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Record Stock Activity</h1>
        <p className="text-slate-600 mt-2">Track usage, returns, waste, or adjustments</p>
      </div>
      <StockUsageForm
        stockItemId={stock.id}
        itemName={stock.itemName}
        currentQuantity={stock.quantity}
      />
    </div>
  );
}
