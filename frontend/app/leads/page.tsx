'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Filter, Search, Sparkles, Edit3, Check, X } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { fetchLeads, updateLead, Lead } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';

const sortOptions = [
  { value: 'timestamp', label: 'Captured time' },
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'score', label: 'Score' },
];

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'closed', label: 'Closed' },
  { value: 'lost', label: 'Lost' },
];

const scoreOptions = [
  { value: '', label: 'All Scores' },
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
];

type SortKey = 'timestamp' | 'name' | 'email' | 'score';

export default function LeadsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState('Your Business');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState('');
  const [scoreFilter, setScoreFilter] = useState('');
  const [editingLead, setEditingLead] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    const storedTenant = localStorage.getItem('tenant_id');
    const storedName = localStorage.getItem('tenant_name');

    if (!storedTenant) {
      router.push('/onboarding');
      return;
    }

    setTenantId(storedTenant);
    setTenantName(storedName || 'Your Business');
  }, [router]);

  useEffect(() => {
    if (!tenantId) return;

    setIsLoading(true);
    setError(null);

    fetchLeads(tenantId)
      .then((items) => setLeads(items))
      .catch((err) => setError(err.message || 'Unable to load leads.'))
      .finally(() => setIsLoading(false));
  }, [tenantId]);

  const filteredLeads = useMemo(() => {
    const filtered = leads.filter((lead) => {
      const query = search.toLowerCase();
      const matchesSearch = [lead.name, lead.email, lead.platform].some((value) => value.toLowerCase().includes(query));
      const matchesStatus = !statusFilter || lead.status === statusFilter;
      const matchesScore = !scoreFilter || lead.score === scoreFilter;
      return matchesSearch && matchesStatus && matchesScore;
    });

    return filtered.sort((a, b) => {
      const order = sortDirection === 'asc' ? 1 : -1;
      if (sortKey === 'timestamp') {
        return (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) * order;
      }
      if (sortKey === 'score') {
        const scoreOrder = { hot: 3, warm: 2, cold: 1 };
        return (scoreOrder[a.score] - scoreOrder[b.score]) * order;
      }
      return a[sortKey].localeCompare(b[sortKey]) * order;
    });
  }, [leads, search, sortDirection, sortKey, statusFilter, scoreFilter]);

  const exportCsv = () => {
    const rows = [['Name', 'Email', 'Phone', 'Platform', 'Intent', 'Score', 'Status', 'Notes', 'Captured', 'Updated']];
    filteredLeads.forEach((lead) => {
      rows.push([
        lead.name,
        lead.email,
        lead.phone,
        lead.platform,
        lead.intent,
        lead.score,
        lead.status,
        lead.notes,
        new Date(lead.timestamp).toISOString(),
        new Date(lead.updated_at).toISOString()
      ]);
    });
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-${tenantId || 'data'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead.lead_id);
    setEditStatus(lead.status);
    setEditNotes(lead.notes);
  };

  const handleSave = async (leadId: string) => {
    if (!tenantId) return;

    try {
      await updateLead(tenantId, leadId, {
        status: editStatus as any,
        notes: editNotes
      });

      // Update local state
      setLeads(leads.map(lead =>
        lead.lead_id === leadId
          ? { ...lead, status: editStatus as any, notes: editNotes, updated_at: new Date().toISOString() }
          : lead
      ));

      setEditingLead(null);
      showToast('Lead updated successfully!');
    } catch (error) {
      showToast('Failed to update lead');
    }
  };

  const handleCancel = () => {
    setEditingLead(null);
    setEditStatus('');
    setEditNotes('');
  };

  return (
    <main className="grid min-h-[calc(100vh-4rem)] grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
      <Sidebar tenantName={tenantName} />

      <section className="flex min-h-[calc(100vh-4rem)] flex-col gap-6 rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-soft">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.32em] text-violet-300">Leads dashboard</p>
            <h1 className="text-3xl font-semibold text-white">Captured leads</h1>
          </div>
          <div className="inline-flex items-center gap-2 rounded-[1.5rem] bg-slate-950/80 px-4 py-3 text-sm text-slate-200">
            <Sparkles className="h-4 w-4 text-violet-300" />
            {filteredLeads.length} lead{filteredLeads.length === 1 ? '' : 's'}
          </div>
        </header>

        <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-inner">
          <div className="grid gap-3 sm:grid-cols-[1.5fr_1fr_1fr_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search leads"
                className="pl-11"
              />
            </label>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All Statuses</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select value={scoreFilter} onChange={(event) => setScoreFilter(event.target.value)}>
              {scoreOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <div className="flex items-center gap-2">
              <Select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    Sort by {option.label}
                  </option>
                ))}
              </Select>
              <Button type="button" variant="secondary" onClick={() => setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'))}>
                <Filter className="h-4 w-4" />
                {sortDirection === 'asc' ? 'Asc' : 'Desc'}
              </Button>
              <Button type="button" variant="primary" onClick={exportCsv}>
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-4">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="h-14 rounded-2xl bg-slate-950/80" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-[1.75rem] bg-rose-500/10 p-6 text-sm text-rose-100">{error}</div>
            ) : filteredLeads.length === 0 ? (
              <div className="rounded-[1.75rem] bg-slate-950/80 p-10 text-center text-slate-400">
                <p className="text-lg font-semibold text-white">No leads found</p>
                <p className="mt-2 text-sm">Your AI agent will capture leads in the chat view once a conversation starts.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/90 text-slate-400">
                    <tr>
                      <th className="px-6 py-4 font-semibold uppercase tracking-[0.16em]">Name</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-[0.16em]">Email</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-[0.16em]">Score</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-[0.16em]">Status</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-[0.16em]">Notes</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-[0.16em]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead, index) => (
                      <tr key={`${lead.email}-${index}`} className={index % 2 === 0 ? 'bg-slate-950/80' : 'bg-slate-950/60'}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-white">{lead.name}</div>
                            <div className="text-xs text-slate-400">{lead.intent}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 break-all">
                          <div>
                            <div>{lead.email}</div>
                            {lead.phone && <div className="text-xs text-slate-400">{lead.phone}</div>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            lead.score === 'hot' ? 'bg-red-500/20 text-red-300' :
                            lead.score === 'warm' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {lead.score.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {editingLead === lead.lead_id ? (
                            <Select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                              className="w-full"
                            >
                              {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Select>
                          ) : (
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              lead.status === 'new' ? 'bg-green-500/20 text-green-300' :
                              lead.status === 'contacted' ? 'bg-blue-500/20 text-blue-300' :
                              lead.status === 'qualified' ? 'bg-purple-500/20 text-purple-300' :
                              lead.status === 'closed' ? 'bg-emerald-500/20 text-emerald-300' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {lead.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingLead === lead.lead_id ? (
                            <Textarea
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="Add notes..."
                              className="w-full min-h-[60px]"
                            />
                          ) : (
                            <div className="text-sm text-slate-300 max-w-xs truncate" title={lead.notes}>
                              {lead.notes || 'No notes'}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingLead === lead.lead_id ? (
                            <div className="flex gap-2">
                              <Button onClick={() => handleSave(lead.lead_id)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button variant="secondary" onClick={handleCancel}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button variant="secondary" onClick={() => handleEdit(lead)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
