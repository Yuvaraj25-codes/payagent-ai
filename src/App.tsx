import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { BottomNav, TabType } from './components/BottomNav.tsx';
import { AgentChat } from './components/AgentChat.tsx';
import { MerchantLedger } from './components/MerchantLedger.tsx';
import { EscrowVault } from './components/EscrowVault.tsx';
import { WebhookMonitor } from './components/WebhookMonitor.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import {
  fetchTransactions,
  fetchWebhooks,
  fetchConfig,
  executePayPalAction,
  triggerSimulatedWebhook,
} from './services/api.ts';
import type {
  PaypalTransaction,
  MetricsSummary,
  WebhookEventRecord,
  AppConfig,
} from './types/index.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [transactions, setTransactions] = useState<PaypalTransaction[]>([]);
  const [metrics, setMetrics] = useState<MetricsSummary>({
    totalVolume: 1029.99,
    autonomousActionsCount: 6,
    merchantTimeSavedHours: 4.0,
    activeEscrowLocked: 850.0,
    pendingApprovalCount: 1,
  });
  const [webhooks, setWebhooks] = useState<WebhookEventRecord[]>([]);
  const [config, setConfig] = useState<AppConfig>({
    mode: 'simulated',
    paypalClientId: '',
    paypalClientSecret: '',
    geminiApiKey: '',
    guardrailThreshold: 100,
    autoEscrowForMilestones: true,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      const [txData, whData, cfgData] = await Promise.all([
        fetchTransactions().catch(() => null),
        fetchWebhooks().catch(() => null),
        fetchConfig().catch(() => null),
      ]);

      if (txData) {
        setTransactions(txData.transactions);
        if (txData.metrics) setMetrics(txData.metrics);
      }
      if (whData) setWebhooks(whData);
      if (cfgData) {
        setConfig((prev) => ({
          ...prev,
          mode: cfgData.mode,
          guardrailThreshold: cfgData.guardrailThreshold || 100,
          autoEscrowForMilestones: cfgData.autoEscrowForMilestones ?? true,
        }));
      }
    } catch (err) {
      console.warn('Initial data load error:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTransactionUpdated = (updatedTx: PaypalTransaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
    );
    // Refresh metrics
    fetchTransactions()
      .then((res) => {
        setMetrics(res.metrics);
        setTransactions(res.transactions);
      })
      .catch(() => {});
  };

  const handleNewTransaction = (newTx: PaypalTransaction) => {
    setTransactions((prev) => [newTx, ...prev.filter((t) => t.id !== newTx.id)]);
    fetchTransactions()
      .then((res) => {
        setMetrics(res.metrics);
      })
      .catch(() => {});
    showToast(`New Action Generated: ${newTx.id} ($${newTx.amount.toFixed(2)})`);
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await executePayPalAction(id, 'APPROVE');
      handleTransactionUpdated(res.transaction);
      showToast(`✅ Approved & Executed: ${id} on PayPal Sandbox`);
    } catch (err: unknown) {
      const error = err as Error;
      showToast(`Error: ${error.message}`);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await executePayPalAction(id, 'REJECT');
      handleTransactionUpdated(res.transaction);
      showToast(`🛑 Cancelled: ${id}`);
    } catch (err: unknown) {
      const error = err as Error;
      showToast(`Error: ${error.message}`);
    }
  };

  const handleReleaseEscrow = async (id: string) => {
    try {
      const res = await executePayPalAction(id, 'RELEASE_ESCROW');
      handleTransactionUpdated(res.transaction);
      showToast(`🎉 Escrow Released: ${id}`);
    } catch (err: unknown) {
      const error = err as Error;
      showToast(`Error: ${error.message}`);
    }
  };

  const handleSimulatePayment = async (id: string) => {
    try {
      const res = await executePayPalAction(id, 'SIMULATE_PAYMENT');
      handleTransactionUpdated(res.transaction);
      showToast(`💳 Payment Captured for ${id}`);
    } catch (err: unknown) {
      const error = err as Error;
      showToast(`Error: ${error.message}`);
    }
  };

  const handleTriggerWebhook = async (eventType: string, transactionId?: string) => {
    try {
      const res = await triggerSimulatedWebhook(eventType, transactionId);
      if (res.webhook) {
        setWebhooks((prev) => [res.webhook, ...prev]);
      }
      if (res.transactions) {
        setTransactions(res.transactions);
      }
      if (res.metrics) {
        setMetrics(res.metrics);
      }
      showToast(`⚡ Webhook Received: ${eventType}`);
    } catch (err: unknown) {
      const error = err as Error;
      showToast(`Webhook error: ${error.message}`);
    }
  };

  const pendingCount = transactions.filter(
    (t) => t.status === 'PENDING_APPROVAL'
  ).length;

  return (
    <div className="flex flex-col h-screen w-full max-w-lg mx-auto sm:max-w-4xl md:max-w-5xl bg-[#050814] text-slate-100 shadow-2xl overflow-hidden relative border-x border-slate-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#0070ba] text-white px-4 py-2 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-sky-400/50 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        config={config}
        onOpenSettings={() => setIsSettingsOpen(true)}
        pendingApprovalCount={pendingCount}
      />

      {/* Main Tab Content */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {activeTab === 'chat' && (
          <AgentChat
            onTransactionUpdated={handleTransactionUpdated}
            onNewTransaction={handleNewTransaction}
            transactions={transactions}
            mode={config.mode}
          />
        )}

        {activeTab === 'ledger' && (
          <MerchantLedger
            transactions={transactions}
            metrics={metrics}
            onRefresh={loadData}
            onApprove={handleApprove}
            onReject={handleReject}
            onReleaseEscrow={handleReleaseEscrow}
            onSimulatePayment={handleSimulatePayment}
            onTriggerWebhook={(id, event) => handleTriggerWebhook(event, id)}
          />
        )}

        {activeTab === 'escrow' && (
          <EscrowVault
            transactions={transactions}
            onReleaseEscrow={handleReleaseEscrow}
            onSimulatePayment={handleSimulatePayment}
          />
        )}

        {activeTab === 'webhooks' && (
          <WebhookMonitor
            webhooks={webhooks}
            transactions={transactions}
            onTriggerWebhook={handleTriggerWebhook}
            onRefresh={loadData}
          />
        )}
      </main>

      {/* Mobile-First Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingApprovalsCount={pendingCount}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onConfigUpdated={(newCfg) => setConfig(newCfg)}
      />
    </div>
  );
}
