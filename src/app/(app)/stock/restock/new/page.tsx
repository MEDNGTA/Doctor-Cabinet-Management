import type { Metadata } from 'next';
import RestockOrderForm from '@/components/stock/RestockOrderForm';

export const metadata: Metadata = {
  title: 'Create Restock Order - Cabinet',
};

export default function NewRestockOrderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Create Restock Order</h1>
        <p className="text-slate-600 mt-2">Order stock items from suppliers</p>
      </div>
      <RestockOrderForm />
    </div>
  );
}
