import type { Metadata } from 'next';
import Link from 'next/link';
import StockList from '@/components/stock/StockList';

export const metadata: Metadata = {
  title: 'Stock - Cabinet',
};

export default function StockPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Stock Management</h1>
          <p className="text-slate-600 mt-2">
            Manage inventory, track usage, and monitor stock levels
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/stock/restock" className="btn-secondary">
            Restock Orders
          </Link>
          <Link href="/stock/new" className="btn-primary">
            Add Stock Item
          </Link>
        </div>
      </div>

      <StockList />
    </div>
  );
}
