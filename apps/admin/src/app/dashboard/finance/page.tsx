'use client';

import { useCallback, useEffect, useState } from 'react';
import { TOKEN_KEY, fetchAdminLedger } from '@/lib/api';

export default function FinancePage() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof fetchAdminLedger>>['data']>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchAdminLedger(token);
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function exportCsv() {
    const header = 'id,amount,type,donor,createdAt\n';
    const rows = items
      .map(
        (item) =>
          `${item.id},${item.amountCents / 100},${item.type},${item.donorPhone ?? ''},${item.createdAt}`,
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ledger.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">捐赠流水</h1>
        <button
          onClick={exportCsv}
          className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-background"
        >
          导出 CSV
        </button>
      </div>
      {loading && <p className="text-muted">加载中…</p>}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-background border-b border-border">
            <tr>
              <th className="text-left p-3">金额</th>
              <th className="text-left p-3">类型</th>
              <th className="text-left p-3">捐赠人</th>
              <th className="text-left p-3">时间</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="p-3">¥{(item.amountCents / 100).toFixed(2)}</td>
                <td className="p-3">{item.type}</td>
                <td className="p-3">{item.donorPhone ?? '—'}</td>
                <td className="p-3">{new Date(item.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
