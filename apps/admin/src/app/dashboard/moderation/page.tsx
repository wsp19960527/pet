'use client';

import { useCallback, useEffect, useState } from 'react';
import { TOKEN_KEY, fetchModerationQueue, moderateAnimal } from '@/lib/api';

export default function ModerationPage() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof fetchModerationQueue>>['data']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchModerationQueue(token);
      setItems(res.data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(id: string, action: 'approve' | 'reject') {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    setActing(id);
    try {
      await moderateAnimal(token, id, action);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActing(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">审核队列</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && <p className="text-muted">加载中…</p>}
      {!loading && items.length === 0 && (
        <p className="text-muted">暂无待审核内容 🎉</p>
      )}
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-surface border border-border rounded-xl p-5 flex gap-4"
          >
            {item.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.coverUrl}
                alt=""
                className="w-24 h-24 rounded-lg object-cover bg-background"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-background flex items-center justify-center text-2xl">
                🐾
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium">
                {item.species} · {item.status}
              </div>
              <p className="text-sm text-muted mt-1 line-clamp-2">
                {item.description ?? '无描述'}
              </p>
              <p className="text-xs text-muted mt-2">
                {item.addressText ?? '未知地址'} · 上报人 {item.creatorPhone}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  disabled={acting === item.id}
                  onClick={() => void decide(item.id, 'approve')}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm disabled:opacity-50"
                >
                  通过
                </button>
                <button
                  disabled={acting === item.id}
                  onClick={() => void decide(item.id, 'reject')}
                  className="px-4 py-2 rounded-lg border border-border text-sm disabled:opacity-50"
                >
                  拒绝
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
