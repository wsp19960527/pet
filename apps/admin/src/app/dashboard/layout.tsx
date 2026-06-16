'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TOKEN_KEY } from '@/lib/api';

const NAV = [
  { href: '/dashboard', label: '概览' },
  { href: '/dashboard/moderation', label: '审核队列' },
  { href: '/dashboard/animals', label: '动物管理' },
  { href: '/dashboard/users', label: '用户管理' },
  { href: '/dashboard/finance', label: '捐赠流水' },
  { href: '/dashboard/crowdfunding', label: '众筹管理' },
  { href: '/dashboard/withdrawals', label: '提现审核' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [router]);

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    router.push('/login');
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">加载中…</div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-surface border-r border-border flex flex-col">
        <div className="p-5 border-b border-border">
          <div className="font-semibold">小流浪 Admin</div>
          <div className="text-xs text-muted mt-1">运营管理系统</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm ${
                pathname === item.href
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-foreground hover:bg-background'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={logout}
          className="m-3 px-3 py-2 text-sm text-muted hover:text-foreground text-left"
        >
          退出登录
        </button>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-surface flex items-center px-6">
          <span className="text-sm text-muted">小流浪城市地图</span>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
