import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  QrCode,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Code,
  DollarSign,
  Copy,
  Check,
  Clock,
  Sparkles,
  Lock,
  Unlock,
  CreditCard,
  SendHorizontal
} from 'lucide-react';
import type { PaypalTransaction } from '../types/index.ts';

interface GenerativeUICardProps {
  transaction: PaypalTransaction;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onReleaseEscrow?: (id: string) => void;
  onSimulatePayment?: (id: string) => void;
  onTriggerWebhook?: (id: string, eventType: string) => void;
  isProcessing?: boolean;
}

export const GenerativeUICard: React.FC<GenerativeUICardProps> = ({
  transaction,
  onApprove,
  onReject,
  onReleaseEscrow,
  onSimulatePayment,
  onTriggerWebhook,
  isProcessing = false,
}) => {
  const [showRawJson, setShowRawJson] = useState(false);
  const [showQrExpanded, setShowQrExpanded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const getStatusBadge = () => {
    switch (transaction.status) {
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse-subtle">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            PENDING APPROVAL
          </span>
        );
      case 'ESCROW_LOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            ESCROW LOCKED
          </span>
        );
      case 'PAID':
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            PAID & SETTLED
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <DollarSign className="w-3.5 h-3.5 text-purple-400" />
            REFUNDED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            REJECTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/50 text-slate-300 border border-slate-600">
            {transaction.status}
          </span>
        );
    }
  };

  const copyCheckoutLink = () => {
    navigator.clipboard.writeText(transaction.checkoutUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full bg-[#0a1124] rounded-2xl border border-[#0070ba]/35 shadow-xl shadow-[#0070ba]/10 overflow-hidden my-3 transition-all hover:border-[#0070ba]/60">
      {/* PayPal Branded Card Header */}
      <div className="bg-gradient-to-r from-[#003087] via-[#0070ba] to-[#009cde] p-3.5 sm:p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-md flex items-center justify-center font-bold text-white text-base shadow-inner border border-white/20">
            P
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-sky-100 flex items-center gap-1">
                PayPal Sandbox {transaction.executionMode === 'live' ? '• Live API' : '• Agent-Toolkit'}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/20 font-mono text-white font-medium">
                v2
              </span>
            </div>
            <div className="font-mono text-sm font-semibold text-white tracking-wide">
              {transaction.id}
            </div>
          </div>
        </div>

        <div>{getStatusBadge()}</div>
      </div>

      {/* Main Body */}
      <div className="p-4 space-y-4">
        {/* Title & Description */}
        <div>
          <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            {transaction.title}
          </h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {transaction.description}
          </p>
        </div>

        {/* Pricing & Escrow Amount Summary */}
        <div className="bg-[#0f1933] border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              {transaction.escrowDetails ? 'Escrow Protected Total' : 'Transaction Total'}
            </div>
            <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1 mt-0.5">
              ${transaction.amount.toFixed(2)}
              <span className="text-xs font-semibold text-sky-400 font-mono">
                {transaction.currency}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] text-slate-400">Payer / Source</div>
            <div className="text-xs font-mono font-medium text-slate-300 truncate max-w-[150px] sm:max-w-[200px]">
              {transaction.payerEmail || 'agent-treasury@payagent.ai'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Payee / Merchant</div>
            <div className="text-xs font-mono font-medium text-sky-300 truncate max-w-[150px] sm:max-w-[200px]">
              {transaction.payeeEmail || 'merchant@payagent.ai'}
            </div>
          </div>
        </div>

        {/* Itemized Line Items */}
        {transaction.items && transaction.items.length > 0 && (
          <div className="border-t border-slate-800/80 pt-3">
            <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-sky-400" />
              Itemized Line Items
            </div>
            <div className="space-y-1.5">
              {transaction.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs bg-slate-900/60 px-3 py-2 rounded-lg border border-slate-800"
                >
                  <span className="text-slate-200 font-medium">
                    {item.name} <span className="text-slate-500">×{item.quantity}</span>
                  </span>
                  <span className="font-mono text-slate-100 font-semibold">
                    ${item.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Escrow Milestone Details if present */}
        {transaction.escrowDetails && (
          <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                Autonomous Escrow Milestone
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900/40 text-cyan-200 border border-cyan-500/20">
                AI Score: {transaction.escrowDetails.aiVerificationScore || 95}%
              </span>
            </div>
            <div className="text-slate-300 text-[11px] leading-relaxed">
              <span className="font-semibold text-slate-200">Conditions:</span> {transaction.escrowDetails.releaseConditions}
            </div>
            <div className="flex items-center justify-between pt-1 text-[11px] text-cyan-200/80">
              <span>Arbitration: {transaction.escrowDetails.arbitration}</span>
              <span className="font-mono font-semibold">
                {transaction.escrowDetails.isReleased ? 'STATUS: RELEASED' : 'STATUS: HELD'}
              </span>
            </div>
          </div>
        )}

        {/* Human-in-the-Loop Guardrail Alert Box (for PENDING_APPROVAL) */}
        {transaction.status === 'PENDING_APPROVAL' && transaction.guardrail.required && (
          <div className="bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900/60 border border-amber-500/40 rounded-xl p-3.5 space-y-3">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  Human-in-the-Loop Guardrail Triggered
                </div>
                <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                  {transaction.guardrail.reason}
                </p>
              </div>
            </div>

            {/* Action Buttons for Human Approval */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => onApprove && onApprove(transaction.id)}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                Approve & Execute via PayPal Sandbox
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => onReject && onReject(transaction.id)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 text-rose-300 hover:text-rose-200 font-semibold text-xs border border-rose-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                Reject / Cancel Order
              </button>
            </div>
          </div>
        )}

        {/* Post-Approval Guardrail Verified Banner */}
        {transaction.guardrail.status === 'USER_APPROVED' && (
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Human-in-the-Loop Signoff Verified & Executed on PayPal Sandbox.</span>
          </div>
        )}

        {/* QR Code & Mobile Checkout Section */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative group p-1 bg-white rounded-lg shadow-md cursor-pointer flex-shrink-0">
              <img
                src={transaction.qrCodeUrl}
                alt={`QR code for ${transaction.id}`}
                className="w-16 h-16 object-contain rounded"
                onClick={() => setShowQrExpanded(!showQrExpanded)}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded text-white text-[10px] transition-opacity">
                Zoom
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-sky-400" />
                Scannable Mobile Checkout QR
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Scan with phone camera or tap to test PayPal Sandbox checkout redirect.
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={copyCheckoutLink}
                  className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium underline-offset-2 hover:underline cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedLink ? 'Copied Link!' : 'Copy Checkout URL'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
            <a
              href={transaction.checkoutUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-md shadow-[#0070ba]/20 transition-colors"
            >
              Open Checkout
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Modal QR Code Zoom */}
        {showQrExpanded && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowQrExpanded(false)}
          >
            <div
              className="bg-[#0b1222] border border-[#0070ba] rounded-2xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h5 className="text-sm font-bold text-white">Scan with Mobile Camera</h5>
              <div className="bg-white p-3 rounded-xl inline-block shadow-lg">
                <img
                  src={transaction.qrCodeUrl.replace('150x150', '280x280')}
                  alt="Expanded QR Code"
                  className="w-56 h-56 object-contain"
                />
              </div>
              <div className="text-xs font-mono text-slate-400 break-all">
                {transaction.id}
              </div>
              <button
                type="button"
                onClick={() => setShowQrExpanded(false)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Interactive Utility Controls (Simulate Payment, Release Escrow, Trigger Webhook) */}
        <div className="pt-1 flex flex-wrap items-center gap-2">
          {/* Release Escrow Button if escrow locked */}
          {transaction.status === 'ESCROW_LOCKED' && transaction.escrowDetails && !transaction.escrowDetails.isReleased && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onReleaseEscrow && onReleaseEscrow(transaction.id)}
              className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Unlock className="w-3.5 h-3.5 text-cyan-400" />
              Release Escrow Funds
            </button>
          )}

          {/* Simulate Buyer Payment (if pending or held) */}
          {(transaction.status === 'PENDING_APPROVAL' || transaction.status === 'ESCROW_LOCKED') && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onSimulatePayment && onSimulatePayment(transaction.id)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Simulate Buyer Scan & Pay
            </button>
          )}

          {/* Trigger Webhook simulation for this transaction */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={() =>
              onTriggerWebhook &&
              onTriggerWebhook(
                transaction.id,
                transaction.type === 'INVOICE_CREATE' ? 'INVOICING.INVOICE.PAID' : 'PAYMENT.CAPTURE.COMPLETED'
              )
            }
            className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-750 text-slate-300 border border-slate-700/80 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <SendHorizontal className="w-3.5 h-3.5 text-sky-400" />
            Fire Webhook Event
          </button>

          {/* Toggle Raw JSON */}
          <button
            type="button"
            onClick={() => setShowRawJson(!showRawJson)}
            className="ml-auto px-2.5 py-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Code className="w-3.5 h-3.5" />
            {showRawJson ? 'Hide JSON' : 'Raw PayPal JSON'}
            {showRawJson ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Collapsible Raw PayPal REST JSON Payload */}
        {showRawJson && (
          <div className="bg-[#050914] border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-sky-300 overflow-x-auto max-h-48">
            <div className="text-[10px] text-slate-500 mb-1 flex items-center justify-between border-b border-slate-800 pb-1">
              <span>Endpoint: {transaction.paypalApiEndpoint}</span>
              <span>Mode: {transaction.executionMode}</span>
            </div>
            <pre className="whitespace-pre-wrap">{JSON.stringify(transaction.rawPayload || transaction, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
