import React from 'react';
import {
  Settings,
  Shield,
  Zap,
  Server,
  Sparkles,
  Lock,
  Layers
} from 'lucide-react';
import type { AppConfig } from '../types/index.ts';

interface HeaderProps {
  config: AppConfig;
  onOpenSettings: () => void;
  pendingApprovalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onOpenSettings,
  pendingApprovalCount,
}) => {
  const isLive = config.mode === 'live';

  return (
    <header className="bg-[#060a17]/95 border-b border-slate-800/80 sticky top-0 z-30 backdrop-blur-md px-3 sm:px-5 py-2.5 sm:py-3 text-slate-100">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2.5">
          {/* Custom PayPal-Inspired Fintech Monogram */}
          <div className="relative group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#003087] via-[#0070ba] to-[#00cfde] flex items-center justify-center font-black text-white text-lg shadow-lg shadow-[#0070ba]/30 border border-sky-400/40">
              <span className="italic transform -skew-x-6">P</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#060a17]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                PayAgent <span className="text-sky-400 font-extrabold">AI</span>
              </h1>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0070ba]/20 text-sky-300 border border-[#0070ba]/40">
                Agentic Hackathon
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
              Autonomous PayPal Commerce & Escrow Agent
            </p>
          </div>
        </div>

        {/* Right status badges & settings */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mode Pill Button (quick toggle or indicator) */}
          <button
            type="button"
            onClick={onOpenSettings}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isLive
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/40'
                : 'bg-sky-950/60 text-sky-300 border-[#0070ba]/40 hover:bg-sky-900/40'
            }`}
            title="Click to change Sandbox Settings"
          >
            {isLive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Live Sandbox</span>
                <span className="sm:hidden">Live</span>
              </>
            ) : (
              <>
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">Simulated Sandbox</span>
                <span className="sm:hidden">Demo</span>
              </>
            )}
          </button>

          {/* Pending Approval Badge */}
          {pendingApprovalCount > 0 && (
            <div className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
              <Shield className="w-3 h-3 text-amber-400" />
              <span>{pendingApprovalCount} Action</span>
            </div>
          )}

          {/* Settings Gear Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer relative"
            title="API Keys / Sandbox Settings"
          >
            <Settings className="w-4 h-4" />
            {!config.paypalClientId && isLive && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
