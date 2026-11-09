import React, { useState } from 'react';
import {
  X,
  Key,
  Shield,
  Zap,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Server,
  Sliders
} from 'lucide-react';
import type { AppConfig } from '../types/index.ts';
import { verifyPayPalKeys, updateConfig } from '../services/api.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onConfigUpdated: (newConfig: AppConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigUpdated,
}) => {
  const [mode, setMode] = useState<'simulated' | 'live'>(config.mode);
  const [paypalClientId, setPaypalClientId] = useState(config.paypalClientId);
  const [paypalClientSecret, setPaypalClientSecret] = useState(config.paypalClientSecret);
  const [geminiApiKey, setGeminiApiKey] = useState(config.geminiApiKey);
  const [guardrailThreshold, setGuardrailThreshold] = useState(config.guardrailThreshold || 100);
  const [autoEscrow, setAutoEscrow] = useState(config.autoEscrowForMilestones);

  const [showSecret, setShowSecret] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    previewToken?: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleTestKeys = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      if (mode === 'simulated') {
        setTimeout(() => {
          setTestResult({
            success: true,
            message: 'Simulated Sandbox Engine Operational! All PayPal Agent-Toolkit endpoints respond with 200 OK.',
          });
          setIsTesting(false);
        }, 600);
        return;
      }

      const res = await verifyPayPalKeys(paypalClientId, paypalClientSecret);
      setTestResult({
        success: true,
        message: res.message,
        previewToken: res.previewToken,
      });
    } catch (err: unknown) {
      const error = err as Error;
      setTestResult({
        success: false,
        message: error.message || 'PayPal Sandbox authentication failed. Check credentials.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated: AppConfig = {
        mode,
        paypalClientId,
        paypalClientSecret,
        geminiApiKey,
        guardrailThreshold,
        autoEscrowForMilestones: autoEscrow,
      };
      await updateConfig(updated);
      onConfigUpdated(updated);
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Save error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const loadDemoCredentials = () => {
    setPaypalClientId('AX_demo_sandbox_client_id_paypal_agentic_hackathon_99');
    setPaypalClientSecret('EP_demo_secret_key_88492049182390192');
    setTestResult({
      success: true,
      message: 'Demo credentials loaded into form! Ready for instant simulation testing.',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="bg-[#090f22] border border-[#0070ba]/60 rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-5 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0070ba]/20 text-sky-400 border border-[#0070ba]/40">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">API Keys & Sandbox Settings</h3>
              <p className="text-[11px] text-slate-400">Configure PayPal Sandbox credentials & agent guardrails</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Toggle */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Execution Engine Mode
          </label>
          <div className="grid grid-cols-2 gap-2 bg-[#060a17] p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('simulated');
                setTestResult(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'simulated'
                  ? 'bg-gradient-to-r from-[#0070ba] to-cyan-600 text-white shadow-lg shadow-cyan-900/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              Simulated Sandbox (Instant Demo)
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('live');
                setTestResult(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'live'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-emerald-300" />
              Live PayPal Sandbox API
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {mode === 'simulated'
              ? '⚡ Zero credentials required. Runs high-fidelity @paypal/agent-toolkit simulator with real schemas & QR codes.'
              : '🔒 Makes real live REST requests to https://api-m.sandbox.paypal.com using OAuth 2.0 Client Credentials.'}
          </p>
        </div>

        {/* Key Inputs */}
        <div className="space-y-3.5">
          {/* PayPal Client ID */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                PAYPAL_CLIENT_ID
              </label>
              <button
                type="button"
                onClick={loadDemoCredentials}
                className="text-[10px] text-sky-400 hover:text-sky-300 font-mono underline cursor-pointer"
              >
                Fill Preset Sandbox Keys
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g. AX... (From PayPal Developer Dashboard)"
              value={paypalClientId}
              onChange={(e) => setPaypalClientId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c1428] border border-slate-700/80 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-[#0070ba]"
            />
          </div>

          {/* PayPal Secret */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              PAYPAL_CLIENT_SECRET
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                placeholder="e.g. EP... (PayPal App Secret)"
                value={paypalClientSecret}
                onChange={(e) => setPaypalClientSecret(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#0c1428] border border-slate-700/80 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-[#0070ba]"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Optional Gemini / OpenAI API Key */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              GEMINI_API_KEY (Optional Custom Key)
            </label>
            <input
              type="password"
              placeholder="Auto-injected by AI Studio server if left blank"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c1428] border border-slate-700/80 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-[#0070ba]"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Used server-side for natural language intent parsing & reasoning trace generation.
            </p>
          </div>
        </div>

        {/* Human-in-the-Loop Guardrail Threshold Slider */}
        <div className="bg-[#060a17] p-3.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Human-in-the-Loop Threshold
            </span>
            <span className="font-mono font-bold text-amber-300 text-sm">
              ${guardrailThreshold}.00 USD
            </span>
          </div>
          <input
            type="range"
            min={20}
            max={500}
            step={10}
            value={guardrailThreshold}
            onChange={(e) => setGuardrailThreshold(Number(e.target.value))}
            className="w-full accent-[#0070ba] cursor-pointer"
          />
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Transactions exceeding ${guardrailThreshold} require a one-tap merchant signoff before executing on PayPal Sandbox.
          </p>
        </div>

        {/* Test Result Message Box */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div>{testResult.message}</div>
              {testResult.previewToken && (
                <div className="font-mono text-[10px] text-slate-400">
                  Bearer: {testResult.previewToken}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            disabled={isTesting}
            onClick={handleTestKeys}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            {isTesting ? 'Verifying...' : 'Test Connection'}
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#0070ba] to-[#009cde] hover:from-[#005ea6] hover:to-[#0086c2] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#0070ba]/30 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isSaving ? 'Saving...' : 'Save & Apply'}
          </button>
        </div>
      </div>
    </div>
  );
};
