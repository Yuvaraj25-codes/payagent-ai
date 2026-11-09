export type AgentActionType =
  | 'INVOICE_CREATE'
  | 'AUTO_CHECKOUT'
  | 'ESCROW_LOCK'
  | 'REFUND_PROCESS'
  | 'WEBHOOK_EVENT';

export type TransactionStatus =
  | 'PENDING_APPROVAL'
  | 'ESCROW_LOCKED'
  | 'PAID'
  | 'REFUNDED'
  | 'REJECTED'
  | 'COMPLETED';

export type GuardrailStatus =
  | 'TRIGGERED_APPROVAL_REQUIRED'
  | 'AUTO_APPROVED'
  | 'USER_APPROVED'
  | 'REJECTED';

export interface ReasoningStep {
  step: number;
  title: string;
  detail: string;
  status: 'pending' | 'running' | 'completed' | 'alert';
  durationMs?: number;
  apiCall?: string;
}

export interface TransactionItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface EscrowDetails {
  milestoneName: string;
  releaseConditions: string;
  arbitration: string;
  isReleased: boolean;
  lockedAmount: number;
  deliverableUrl?: string;
  aiVerificationScore?: number;
}

export interface PaypalTransaction {
  id: string;
  type: AgentActionType;
  title: string;
  description: string;
  amount: number;
  currency: string;
  payerEmail?: string;
  payeeEmail?: string;
  status: TransactionStatus;
  guardrail: {
    required: boolean;
    reason: string;
    threshold: number;
    status: GuardrailStatus;
    approvedAt?: string;
  };
  escrowDetails?: EscrowDetails;
  items: TransactionItem[];
  checkoutUrl: string;
  qrCodeUrl: string;
  paypalApiEndpoint: string;
  createdAt: string;
  updatedAt: string;
  rawPayload: Record<string, unknown>;
  executionMode: 'simulated' | 'live';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  reasoningTrace?: ReasoningStep[];
  transactionCard?: PaypalTransaction;
  executionMode?: 'simulated' | 'live';
}

export interface AppConfig {
  mode: 'simulated' | 'live';
  paypalClientId: string;
  paypalClientSecret: string;
  geminiApiKey: string;
  guardrailThreshold: number;
  autoEscrowForMilestones: boolean;
}

export interface WebhookEventRecord {
  id: string;
  eventType: string;
  resourceId: string;
  resourceType: string;
  summary: string;
  timestamp: string;
  status: 'PROCESSED' | 'FAILED' | 'RECEIVED';
  rawPayload: Record<string, unknown>;
}

export interface MetricsSummary {
  totalVolume: number;
  autonomousActionsCount: number;
  merchantTimeSavedHours: number;
  activeEscrowLocked: number;
  pendingApprovalCount: number;
}
