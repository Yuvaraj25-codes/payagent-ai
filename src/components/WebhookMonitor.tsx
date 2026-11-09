import React, { useState } from 'react';
import {
  Zap,
  Send,
  Terminal,
  Clock,
  CheckCircle2,
  AlertCircle,
  Code,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import type { WebhookEventRecord, PaypalTransaction } from '../types/index.ts';

interface WebhookMonitorProps {
  webhooks: WebhookEventRecord[];
  transactions: PaypalTransaction[];
  onTriggerWebhook: (eventType: string, transactionId?: string) => void;
  onRefresh: () => void;
}

export const WebhookMonitor: React.FC<WebhookMonitorProps> = ({
  webhooks,
  transactions,
  onTriggerWebhook,
  onRefresh,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<string>('PAYMENT.CAPTURE.COMPLETED');
  const [selectedTxId, setSelectedTxId] = useState<string>(transactions[0]?.id || '');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const webhookEventTypes = [
    { value: 'PAYMENT.CAPTURE.COMPLETED', label: 'Payment Capture Completed', color: 'text-emerald-400' },
    { value: 'INVOICING.INVOICE.PAID', label: 'Invoicing Invoice Paid', color: 'text-sky-400' },
    { value: 'ESCROW.MILESTONE.DISBURSED', label: 'Escrow Milestone Disbursed', color: 'text-cyan-400' },
    { value: 'PAYMENT.SALE.REFUNDED', label: 'Payment Sale Refunded', color: 'text-purple-400' },
    { value: 'CHECKOUT.ORDER.APPROVED', label: 'Checkout Order Approved', color: 'text-amber-400' },
  ];

  const handleFireWebhook = () => {
    onTriggerWebhook(selectedEvent, selectedTxId || undefined);
  };

  const copyPayload = (wh: WebhookEventRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(wh.rawPayload, null, 2));
    setCopiedId(wh.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-5 pb-24 text-slate-100">
      {/* Webhook Dispatcher Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#080d1e] border border-[#0070ba]/40 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#0070ba]/20 text-sky-400 border border-[#0070ba]/30">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">PayPal Sandbox Webhook Simulator</h3>
              <p className="text-[11px] text-slate-400">
                Dispatch simulated asynchronous PayPal IPN / Webhook callbacks to test agent listeners in real time.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Event Type
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#0e162d] border border-slate-700 text-xs text-white outline-none focus:border-[#0070ba]"
            >
              {webhookEventTypes.map((et) => (
                <option key={et.value} value={et.value}>
                  {et.value} ({et.label})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Target Transaction Resource
            </label>
            <select
              value={selectedTxId}
              onChange={(e) => setSelectedTxId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#0e162d] border border-slate-700 text-xs text-white outline-none focus:border-[#0070ba]"
            >
              {transactions.map((tx) => (
                <option key={tx.id} value={tx.id}>
                  {tx.id} - ${tx.amount} ({tx.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFireWebhook}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0070ba] to-[#009cde] hover:from-[#005ea6] hover:to-[#0086c2] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#0070ba]/30 transition-all cursor-pointer active:scale-98"
        >
          <Send className="w-3.5 h-3.5" />
          Fire Webhook to /api/paypal/webhook/simulate
        </button>
      </div>

      {/* Webhook Log Stream */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            Live Webhook Ingestion Log ({webhooks.length} Events)
          </span>
        </div>

        {webhooks.length === 0 ? (
          <div className="p-8 text-center bg-[#080d1e] rounded-2xl border border-slate-800 text-slate-500 text-xs">
            No incoming webhook events captured yet.
          </div>
        ) : (
          webhooks.map((wh) => {
            const isExpanded = expandedId === wh.id;
            return (
              <div
                key={wh.id}
                onClick={() => setExpandedId(isExpanded ? null : wh.id)}
                className="p-3 sm:p-4 rounded-xl bg-[#080e22] border border-slate-800 hover:border-sky-500/40 transition-colors cursor-pointer space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                      {wh.status}
                    </span>
                    <span className="font-mono text-xs font-bold text-sky-300">{wh.eventType}</span>
                    <span className="font-mono text-[11px] text-slate-400">ID: {wh.id}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(wh.timestamp).toLocaleTimeString()}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </div>

                <div className="text-slate-300 text-xs leading-relaxed">{wh.summary}</div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>Linked Resource: <strong className="font-mono text-slate-200">{wh.resourceId}</strong></span>
                  <button
                    type="button"
                    onClick={(e) => copyPayload(wh, e)}
                    className="text-sky-400 hover:text-sky-300 font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === wh.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedId === wh.id ? 'Copied' : 'Copy JSON'}
                  </button>
                </div>

                {/* Collapsible raw payload */}
                {isExpanded && (
                  <div
                    className="bg-[#050914] border border-slate-800 rounded-lg p-2.5 font-mono text-[10px] text-sky-200 overflow-x-auto mt-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <pre className="whitespace-pre-wrap">{JSON.stringify(wh.rawPayload, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
