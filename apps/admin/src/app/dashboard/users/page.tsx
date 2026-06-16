'use client';

import { UserStatus } from '@pet/shared';
import { useCallback, useEffect, useState } from 'react';
import { TOKEN_KEY, banUser, fetchAdminUsers } from '@/lib/api';

export default function UsersPage() {
  const [users, setUsers] = useState<Awaited<ReturnType<typeof fetchAdminUsers>>['data']>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchAdminUsers(token);
      setUsers(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleBan(id: string, current: UserStatus) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    const next =
      current === UserStatus.BANNED ? UserStatus.ACTIVE : UserStatus.BANNED;
    if (!confirm(next === UserStatus.BANNED ? '确认封禁该用户？' : '确认解封该用户？')) return;
    setActing(id);
    try {
      await banUser(token, id, next);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: next } : u)),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActing(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">用户管理</h1>
      {loading && <p className="text-muted">加载中…</p>}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-background border-b border-border">
            <tr>
              <th className="text-left p-3 font-medium">手机号</th>
              <th className="text-left p-3 font-medium">昵称</th>
              <th className="text-left p-3 font-medium">上报数</th>
              <th className="text-left p-3 font-medium">状态</th>
              <th className="text-left p-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="p-3">{user.phone}</td>
                <td className="p-3">{user.nickname ?? '—'}</td>
                <td className="p-3">{user.reportCount}</td>
                <td className="p-3">
                  <span
                    className={
                      user.status === UserStatus.BANNED ? 'text-red-600' : 'text-primary'
                    }
                  >
                    {user.status === UserStatus.BANNED ? '已封禁' : '正常'}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    disabled={acting === user.id}
                    onClick={() => void toggleBan(user.id, user.status)}
                    className="text-sm text-primary disabled:opacity-50"
                  >
                    {user.status === UserStatus.BANNED ? '解封' : '封禁'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
