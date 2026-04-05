import type { Metadata } from 'next';
import StockForm from '@/components/stock/StockForm';

export const metadata: Metadata = {
  title: 'Add Stock Item - Cabinet',
};

export default function NewStockPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Add Stock Item</h1>
        <p className="text-slate-600 mt-2">Create a new inventory item</p>
      </div>
      <StockForm />
    </div>
  );
}
