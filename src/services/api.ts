import type {
  AppConfig,
  PaypalTransaction,
  MetricsSummary,
  WebhookEventRecord,
  ReasoningStep,
} from '../types/index.ts';

export async function fetchTransactions(): Promise<{
  transactions: PaypalTransaction[];
  metrics: MetricsSummary;
}> {
  const res = await fetch('/api/transactions');
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function fetchMetrics(): Promise<MetricsSummary> {
  const res = await fetch('/api/metrics');
  if (!res.ok) throw new Error('Failed to fetch metrics');
  return res.json();
}

export async function fetchWebhooks(): Promise<WebhookEventRecord[]> {
  const res = await fetch('/api/webhooks');
  if (!res.ok) throw new Error('Failed to fetch webhooks');
  return res.json();
}

export async function fetchConfig(): Promise<{
  mode: 'simulated' | 'live';
  hasPaypalKeys: boolean;
  hasGeminiKey: boolean;
  guardrailThreshold: number;
  autoEscrowForMilestones: boolean;
  paypalClientIdPreview?: string;
}> {
  const res = await fetch('/api/config');
  if (!res.ok) throw new Error('Failed to fetch configuration');
  return res.json();
}

export async function updateConfig(config: Partial<AppConfig>): Promise<{
  success: boolean;
  config: AppConfig;
}> {
  const res = await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Failed to update configuration');
  return res.json();
}

export async function verifyPayPalKeys(
  clientId?: string,
  clientSecret?: string
): Promise<{
  success: boolean;
  message: string;
  previewToken?: string;
}> {
  const res = await fetch('/api/paypal/verify-keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Verification failed');
  }
  return data;
}

export async function executeAgentAction(
  message: string,
  quickActionId?: string
): Promise<{
  message: string;
  reasoningTrace: ReasoningStep[];
  transaction: PaypalTransaction;
  executionMode: 'simulated' | 'live';
}> {
  const res = await fetch('/api/agent/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, quickActionId }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to process agent action');
  }
  return res.json();
}

export async function executePayPalAction(
  transactionId: string,
  action: 'APPROVE' | 'REJECT' | 'RELEASE_ESCROW' | 'SIMULATE_PAYMENT' | 'REFUND'
): Promise<{
  success: boolean;
  transaction: PaypalTransaction;
  metrics: MetricsSummary;
  mode: 'simulated' | 'live';
}> {
  const res = await fetch('/api/paypal/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactionId, action }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to execute PayPal transaction action');
  }
  return res.json();
}

export async function triggerSimulatedWebhook(
  eventType: string,
  transactionId?: string
): Promise<{
  success: boolean;
  webhook: WebhookEventRecord;
  transactions: PaypalTransaction[];
  metrics: MetricsSummary;
}> {
  const res = await fetch('/api/paypal/webhook/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType, transactionId }),
  });
  if (!res.ok) throw new Error('Failed to trigger webhook simulation');
  return res.json();
}
