'use client';

import { useEffect, useState } from 'react';
import { fetchDashboardStats, TOKEN_KEY } from '@/lib/api';

interface Stats {
  userCount: number;
  adminCount: number;
  pendingModeration: number;
  pendingReports: number;
  todayReports: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    fetchDashboardStats(token)
      .then((res) => setStats(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : '加载失败'));
  }, []);

  const cards = stats
    ? [
        { label: '注册用户', value: stats.userCount },
        { label: '待审核', value: stats.pendingModeration },
        { label: '待处理举报', value: stats.pendingReports },
        { label: '今日上报', value: stats.todayReports },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">概览看板</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-surface border border-border rounded-xl p-5">
            <div className="text-sm text-muted">{card.label}</div>
            <div className="text-3xl font-semibold mt-2 text-primary">{card.value}</div>
          </div>
        ))}
      </div>
      {!stats && !error && <p className="text-muted mt-4">加载统计数据…</p>}
    </div>
  );
}
