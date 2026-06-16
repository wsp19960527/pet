'use client';

import { AnimalModerationStatus } from '@pet/shared';
import { useCallback, useEffect, useState } from 'react';
import { TOKEN_KEY, fetchAdminAnimals, removeAnimal } from '@/lib/api';

export default function AnimalsPage() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof fetchAdminAnimals>>['data']>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchAdminAnimals(token, {
        moderationStatus: filter || undefined,
      });
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRemove(id: string) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || !confirm('确认强制下架该动物？')) return;
    try {
      await removeAnimal(token, id);
      setItems((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, moderationStatus: AnimalModerationStatus.REMOVED }
            : a,
        ),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">动物管理</h1>
      <div className="flex gap-2 mb-4">
        {['', 'approved', 'pending', 'removed'].map((value) => (
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
            className="bg-surface border border-border rounded-xl p-4 flex justify-between items-center"
          >
            <div>
              <div className="font-medium">
                {item.species} · {item.status} · {item.moderationStatus}
              </div>
              <div className="text-sm text-muted mt-1">
                {item.cityCode} · {item.addressText ?? '—'} · {item.viewCount} 浏览
              </div>
            </div>
            {item.moderationStatus !== 'removed' && (
              <button
                onClick={() => void handleRemove(item.id)}
                className="text-sm text-red-600 px-3 py-1.5 border border-red-200 rounded-lg"
              >
                下架
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
