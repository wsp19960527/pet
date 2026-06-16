'use client';

import { useCallback, useEffect, useState } from 'react';
import { TOKEN_KEY, fetchAdminWithdrawals } from '@/lib/api';

export default function WithdrawalsPage() {
  const [items, setItems] = useState<
    Awaited<ReturnType<typeof fetchAdminWithdrawals>>['data']
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchAdminWithdrawals(token);
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">提现审核</h1>
      {loading && <p className="text-muted">加载中…</p>}
      {items.length === 0 && !loading && (
        <p className="text-muted">暂无提现申请</p>
      )}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-surface border border-border rounded-xl p-4 flex justify-between"
          >
            <div>
              <div className="font-medium">
                ¥{(item.amountCents / 100).toFixed(2)} · {item.status}
              </div>
              <div className="text-sm text-muted">
                {item.requesterPhone} · {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
