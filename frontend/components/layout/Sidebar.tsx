'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CheckSquare, LayoutGrid, MessageCircle, Plus, Repeat, Zap } from 'lucide-react';
import clsx from 'clsx';

type TenantItem = {
  id: string;
  name: string;
};

type SidebarProps = {
  tenantName: string;
  onNewChat?: () => void;
};

export function Sidebar({ tenantName, onNewChat }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [tenantList, setTenantList] = useState<TenantItem[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantItem | null>(null);

  useEffect(() => {
    const tenantValue = localStorage.getItem('tenant_id');
    const tenantNameValue = localStorage.getItem('tenant_name');
    const stored = localStorage.getItem('tenant_list');
    const list = stored ? (JSON.parse(stored) as TenantItem[]) : [];

    const current = tenantValue && tenantNameValue ? { id: tenantValue, name: tenantNameValue } : null;
    const merged = current ? [current, ...list.filter((item) => item.id !== current.id)] : list;

    setTenantList(merged);
    setSelectedTenant(current);
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      localStorage.setItem('tenant_list', JSON.stringify(tenantList));
      localStorage.setItem('tenant_id', selectedTenant.id);
      localStorage.setItem('tenant_name', selectedTenant.name);
    }
  }, [selectedTenant, tenantList]);

  const navItems = useMemo(
    () => [
      { href: '/chat', label: 'Chat', icon: MessageCircle },
      { href: '/leads', label: 'Leads', icon: CheckSquare },
      { href: '/onboarding', label: 'Onboarding', icon: LayoutGrid },
    ],
    [],
  );

  const handleTenantChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const tenant = tenantList.find((item) => item.id === event.target.value);
    if (tenant) {
      setSelectedTenant(tenant);
      router.push('/chat');
    }
  };

  return (
    <aside
      className={clsx(
        'relative flex min-h-[calc(100vh-3rem)] flex-col gap-6 rounded-[2rem] border border-white/10 bg-slate-900/90 p-4 shadow-soft transition-all',
        collapsed && 'w-20',
      )}
    >
      <div className="flex items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-200 ring-1 ring-violet-500/15">
            <Zap className="h-5 w-5" />
          </div>
          {!collapsed ? (
            <div>
              <p className="text-sm font-semibold text-white">{tenantName || 'Your agent'}</p>
              <p className="text-xs text-slate-400">Tenant context</p>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Toggle sidebar"
          onClick={() => setCollapsed((value) => !value)}
          className="rounded-full border border-white/10 bg-slate-950/80 p-2 text-slate-300 transition hover:border-violet-400/40 hover:text-white"
        >
          <Repeat className="h-4 w-4" />
        </button>
      </div>

      <div className={clsx('space-y-4 px-2', collapsed && 'hidden')}>
        <label className="block text-xs uppercase tracking-[0.28em] text-slate-500">Tenant</label>
        <select
          className="w-full rounded-[1.5rem] border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-400/20"
          value={selectedTenant?.id ?? ''}
          onChange={handleTenantChange}
        >
          {tenantList.length > 0 ? (
            tenantList.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))
          ) : (
            <option value="">No tenant configured</option>
          )}
        </select>
      </div>

      <nav className={clsx('flex flex-col gap-2 px-2', collapsed && 'space-y-2')}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 rounded-[1.5rem] px-4 py-3 text-sm font-medium transition',
                active
                  ? 'bg-violet-500/15 text-violet-100 ring-1 ring-violet-500/20'
                  : 'text-slate-200 hover:bg-white/5 hover:text-white',
                collapsed && 'justify-center px-2',
              )}
            >
              <Icon className="h-4 w-4" />
              {!collapsed ? item.label : null}
            </Link>
          );
        })}
      </nav>

      <div className={clsx('mt-auto px-2', collapsed && 'hidden')}>
        <button
          type="button"
          onClick={onNewChat}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[1.5rem] bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
        >
          <Plus className="h-4 w-4" />
          New chat
        </button>
      </div>
    </aside>
  );
}
