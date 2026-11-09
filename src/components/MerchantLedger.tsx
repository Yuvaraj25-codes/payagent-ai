import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Zap,
  Clock,
  Lock,
  Search,
  Filter,
  Download,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  Eye,
  X
} from 'lucide-react';
import type { PaypalTransaction, MetricsSummary } from '../types/index.ts';
import { GenerativeUICard } from './GenerativeUICard.tsx';

interface MerchantLedgerProps {
  transactions: PaypalTransaction[];
  metrics: MetricsSummary;
  onRefresh: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onReleaseEscrow: (id: string) => void;
  onSimulatePayment: (id: string) => void;
  onTriggerWebhook: (id: string, eventType: string) => void;
}

export const MerchantLedger: React.FC<MerchantLedgerProps> = ({
  transactions,
  metrics,
  onRefresh,
  onApprove,
  onReject,
  onReleaseEscrow,
  onSimulatePayment,
  onTriggerWebhook,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedTx, setSelectedTx] = useState<PaypalTransaction | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.payerEmail && tx.payerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        tx.amount.toString().includes(searchTerm);

      if (statusFilter === 'ALL') return matchesSearch;
      return matchesSearch && tx.status === statusFilter;
    });
  }, [transactions, searchTerm, statusFilter]);

  const copyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const exportCsv = () => {
    const headers = ['ID', 'Type', 'Title', 'Amount', 'Currency', 'Status', 'GuardrailStatus', 'Created'];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.type,
      `"${t.title.replace(/"/g, '""')}"`,
      t.amount,
      t.currency,
      t.status,
      t.guardrail.status,
      t.createdAt,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `paypal_agent_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            Pending Approval
          </span>
        );
      case 'ESCROW_LOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <Lock className="w-2.5 h-2.5 text-cyan-400" />
            Escrow Locked
          </span>
        );
      case 'PAID':
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            Paid & Settled
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <DollarSign className="w-2.5 h-2.5 text-purple-400" />
            Refunded
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <XCircle className="w-2.5 h-2.5 text-rose-400" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-5 pb-24 text-slate-100">
      {/* 3 Core Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Volume */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#0a152d] to-[#070e20] border border-[#0070ba]/40 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-[#0070ba]/10 rounded-full blur-xl group-hover:bg-[#0070ba]/20 transition-colors" />
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-sky-300">
              Total Volume Processed
            </span>
            <div className="p-1.5 rounded-lg bg-[#0070ba]/20 text-sky-400 border border-[#0070ba]/30">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
            ${metrics.totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
            <span>↑ 100% PayPal Sandbox</span>
          </div>
        </div>

        {/* Card 2: Autonomous Actions Executed */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#0a152d] to-[#070e20] border border-[#0070ba]/40 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-sky-300">
              Autonomous Actions
            </span>
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight font-mono">
            {metrics.autonomousActionsCount}
          </div>
          <div className="text-[11px] text-cyan-300 font-medium flex items-center gap-1 mt-1">
            <span>Agent-Toolkit Invoked</span>
          </div>
        </div>

        {/* Card 3: Merchant Time Saved */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#0a152d] to-[#070e20] border border-[#0070ba]/40 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-sky-300">
              Merchant Time Saved
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight font-mono">
            {metrics.merchantTimeSavedHours}h
          </div>
          <div className="text-[11px] text-amber-300 font-medium flex items-center gap-1 mt-1">
            <span>~15 mins / invoice or dispute</span>
          </div>
        </div>

        {/* Card 4: Active Escrow Locked */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#0a152d] to-[#070e20] border border-[#0070ba]/40 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-sky-300">
              Active Escrow Locked
            </span>
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
            ${metrics.activeEscrowLocked.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-purple-300 font-medium flex items-center gap-1 mt-1">
            <span>Guaranteed Milestones</span>
          </div>
        </div>
      </div>

      {/* AG Grid Styled Interactive Ledger Table */}
      <div className="bg-[#080d1e] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search transactions, IDs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0e162d] border border-slate-700/80 text-xs text-white placeholder-slate-400 outline-none focus:border-[#0070ba]"
              />
            </div>
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 rounded-xl bg-slate-850 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs cursor-pointer"
              title="Refresh Ledger"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Filter Pills & Export */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <div className="flex items-center gap-1 bg-[#0c1428] p-1 rounded-xl border border-slate-800">
              {['ALL', 'PENDING_APPROVAL', 'ESCROW_LOCKED', 'PAID', 'REFUNDED'].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wider uppercase transition-colors cursor-pointer ${
                    statusFilter === filter
                      ? 'bg-[#0070ba] text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {filter.replace('_', ' ')}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={exportCsv}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#060a17] text-slate-400 font-semibold border-b border-slate-800 text-[11px] uppercase tracking-wider font-mono">
                <th className="py-3 px-4">Sandbox ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Guardrail</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No transactions match your search filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-[#0c1630]/70 cursor-pointer transition-colors group"
                  >
                    {/* Sandbox ID */}
                    <td className="py-3 px-4 font-mono font-medium text-sky-300">
                      <div className="flex items-center gap-1.5">
                        <span>{tx.id}</span>
                        <button
                          type="button"
                          onClick={(e) => copyId(tx.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white transition-opacity"
                          title="Copy ID"
                        >
                          {copiedId === tx.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950/60 text-sky-200 border border-sky-800/50">
                        {tx.type}
                      </span>
                    </td>

                    {/* Title / Description */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-white truncate">{tx.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        To: {tx.payeeEmail} • By: {tx.payerEmail}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
                      ${tx.amount.toFixed(2)}{' '}
                      <span className="text-[10px] text-sky-400 font-normal">USD</span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">{getStatusPill(tx.status)}</td>

                    {/* Guardrail Policy */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {tx.guardrail.status === 'USER_APPROVED' ? (
                        <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5" /> Merchant Approved
                        </span>
                      ) : tx.guardrail.status === 'AUTO_APPROVED' ? (
                        <span className="text-[11px] text-sky-400 flex items-center gap-1 font-medium">
                          <Zap className="w-3.5 h-3.5" /> Auto-Cleared (&lt;$100)
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
                          <ShieldAlert className="w-3.5 h-3.5" /> Action Required
                        </span>
                      )}
                    </td>

                    {/* Row Quick Action */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTx(tx);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-[#0070ba] text-slate-300 hover:text-white transition-colors text-[11px] font-medium inline-flex items-center gap-1"
                      >
                        Inspect <Eye className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slideover / Modal for Detailed Transaction Inspection */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="bg-[#080d1e] border border-[#0070ba]/60 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-[#0070ba]/20 text-sky-300 border border-[#0070ba]/40">
                  Transaction Inspector
                </span>
                <span className="font-mono text-sm font-bold text-white">{selectedTx.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Render full Generative UI Card */}
            <GenerativeUICard
              transaction={selectedTx}
              onApprove={(id) => {
                onApprove(id);
                const updated = transactions.find((t) => t.id === id);
                if (updated) setSelectedTx(updated);
              }}
              onReject={(id) => {
                onReject(id);
                const updated = transactions.find((t) => t.id === id);
                if (updated) setSelectedTx(updated);
              }}
              onReleaseEscrow={(id) => {
                onReleaseEscrow(id);
                const updated = transactions.find((t) => t.id === id);
                if (updated) setSelectedTx(updated);
              }}
              onSimulatePayment={(id) => {
                onSimulatePayment(id);
                const updated = transactions.find((t) => t.id === id);
                if (updated) setSelectedTx(updated);
              }}
              onTriggerWebhook={(id, event) => onTriggerWebhook(id, event)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
