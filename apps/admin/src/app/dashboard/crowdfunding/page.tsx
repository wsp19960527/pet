'use client';

import { useCallback, useEffect, useState } from 'react';
import { TOKEN_KEY, fetchAdminCrowdfunding } from '@/lib/api';

export default function AdminCrowdfundingPage() {
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof fetchAdminCrowdfunding>>['data']
  >([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchAdminCrowdfunding(token, filter || undefined);
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">众筹管理</h1>
      <div className="flex gap-2 mb-4">
        {['', 'active', 'completed', 'cancelled'].map((value) => (
          <button
            key={value || 'all'}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${
              filter === value
                ? 'bg-primary/10 border-primary text-primary'
                : 'border-border'
            }`}
          >
            {value === '' ? '全部' : value}
          </button>
        ))}
      </div>
      {loading && <p className="text-muted">加载中…</p>}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-surface border border-border rounded-xl p-4"
          >
            <div className="font-medium">{item.title}</div>
            <div className="text-sm text-muted mt-1">
              ¥{(item.raisedAmountCents / 100).toFixed(0)} / ¥
              {(item.goalAmountCents / 100).toFixed(0)} · {item.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
