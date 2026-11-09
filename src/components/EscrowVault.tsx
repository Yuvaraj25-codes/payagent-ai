import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import type { PaypalTransaction } from '../types/index.ts';

interface EscrowVaultProps {
  transactions: PaypalTransaction[];
  onReleaseEscrow: (id: string) => void;
  onSimulatePayment: (id: string) => void;
}

export const EscrowVault: React.FC<EscrowVaultProps> = ({
  transactions,
  onReleaseEscrow,
  onSimulatePayment,
}) => {
  const escrowTransactions = transactions.filter(
    (t) => t.type === 'ESCROW_LOCK' || t.escrowDetails !== undefined
  );

  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const handleAiVerificationAndRelease = async (id: string) => {
    setVerifyingId(id);
    // Simulate AI deliverable inspection
    setTimeout(() => {
      onReleaseEscrow(id);
      setVerifyingId(null);
    }, 1200);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-5 pb-24 text-slate-100">
      {/* Vault Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#003087]/50 via-[#0070ba]/30 to-cyan-950/40 border border-cyan-500/30 shadow-xl relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              Autonomous PayPal Escrow Protocol
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Escrow & Milestone Smart Holds
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              PayAgent AI holds PayPal funds securely until automated AI verification scores confirm deliverable completeness, protecting both merchants and buyers with zero escrow fees.
            </p>
          </div>
        </div>
      </div>

      {/* Escrow Items List */}
      <div className="space-y-4">
        {escrowTransactions.length === 0 ? (
          <div className="p-8 text-center bg-[#080d1e] rounded-2xl border border-slate-800 text-slate-400 text-xs">
            No active escrow contracts. Create one from the Agent Chat tab!
          </div>
        ) : (
          escrowTransactions.map((tx) => {
            const isReleased = tx.escrowDetails?.isReleased || tx.status === 'PAID';
            const score = tx.escrowDetails?.aiVerificationScore || 96;

            return (
              <div
                key={tx.id}
                className="p-4 sm:p-5 rounded-2xl bg-[#080e22] border border-cyan-500/30 shadow-lg space-y-4 hover:border-cyan-500/60 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-300">
                        {tx.id}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-200 border border-cyan-800/60">
                        {isReleased ? 'RELEASED & DISBURSED' : 'FUNDS LOCKED IN ESCROW'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">{tx.title}</h3>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-xs text-slate-400">Locked Escrow Payout</div>
                    <div className="text-2xl font-black text-white font-mono">
                      ${tx.amount.toFixed(2)}{' '}
                      <span className="text-xs text-sky-400 font-sans">USD</span>
                    </div>
                  </div>
                </div>

                {/* Milestone Deliverable details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#0b142c] p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                      Contract Milestone
                    </div>
                    <div className="text-white font-medium">
                      {tx.escrowDetails?.milestoneName || tx.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      <span className="text-slate-300 font-semibold">Conditions:</span>{' '}
                      {tx.escrowDetails?.releaseConditions || 'Automated code review & client signoff'}
                    </div>
                  </div>

                  <div className="bg-[#0b142c] p-3 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                        AI Deliverable Verification Score
                      </span>
                      <span className="font-mono font-bold text-cyan-300">{score}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Passing confidence threshold (min 85%)
                    </div>
                  </div>
                </div>

                {/* Counterparties */}
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                  <div className="flex items-center gap-4">
                    <span>
                      Depositor: <strong className="text-slate-200">{tx.payerEmail}</strong>
                    </span>
                    <span>
                      Beneficiary: <strong className="text-sky-300">{tx.payeeEmail}</strong>
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    {!isReleased ? (
                      <button
                        type="button"
                        disabled={verifyingId === tx.id}
                        onClick={() => handleAiVerificationAndRelease(tx.id)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-cyan-900/40 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        {verifyingId === tx.id ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5 animate-spin" />
                            Evaluating Deliverable AI Oracle...
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            AI Verify & Release Escrow
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Settled & Disbursed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
