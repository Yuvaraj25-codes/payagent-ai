import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Terminal,
} from 'lucide-react';
import type { ReasoningStep } from '../types/index.ts';

interface ReasoningTraceAccordionProps {
  steps: ReasoningStep[];
  defaultOpen?: boolean;
}

export const ReasoningTraceAccordion: React.FC<ReasoningTraceAccordionProps> = ({
  steps,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!steps || steps.length === 0) return null;

  const totalDuration = steps.reduce((sum, s) => sum + (s.durationMs || 0), 0);
  const hasAlert = steps.some((s) => s.status === 'alert');

  return (
    <div className="w-full bg-[#070e1e]/90 border border-[#0070ba]/30 rounded-xl overflow-hidden my-2.5 transition-all text-xs">
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2.5 sm:px-3.5 bg-gradient-to-r from-[#0a152e] to-[#070f22] hover:bg-slate-800/60 flex items-center justify-between text-left cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-[#0070ba]/20 text-sky-400 border border-[#0070ba]/40">
            <BrainCircuit className="w-3.5 h-3.5 text-sky-400 animate-pulse-subtle" />
          </div>
          <span className="font-semibold text-slate-200 flex items-center gap-2">
            Agent Reasoning Trace
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800/60">
              {steps.length} Steps • {totalDuration}ms
            </span>
          </span>
          {hasAlert && (
            <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" />
              Guardrail Triggered
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="text-[11px] hidden sm:inline text-slate-400">
            {isOpen ? 'Collapse Trace' : 'Expand Trace'}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-3 sm:p-3.5 space-y-2.5 bg-[#050b18] border-t border-slate-800/80">
          <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-[#0070ba] before:via-sky-700 before:to-emerald-500/50">
            {steps.map((step) => {
              const isAlert = step.status === 'alert';
              return (
                <div key={step.step} className="relative group">
                  {/* Step bullet */}
                  <div
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                      isAlert
                        ? 'bg-amber-950 border-amber-500 text-amber-300'
                        : 'bg-slate-900 border-sky-500 text-sky-300'
                    }`}
                  >
                    {isAlert ? '!' : step.step}
                  </div>

                  {/* Step detail card */}
                  <div
                    className={`p-2.5 rounded-lg border text-xs ${
                      isAlert
                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        {step.title}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        {step.durationMs && <span>{step.durationMs}ms</span>}
                        {isAlert ? (
                          <span className="text-amber-400 flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" /> Policy Guard
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                      {step.detail}
                    </p>

                    {step.apiCall && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-800 flex items-center gap-1.5 font-mono text-[10px] text-sky-400 truncate">
                        <Terminal className="w-3 h-3 flex-shrink-0" />
                        <span className="text-slate-400">Endpoint:</span>
                        <span className="truncate">{step.apiCall}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
