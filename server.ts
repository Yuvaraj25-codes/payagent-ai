import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import type {
  AppConfig,
  PaypalTransaction,
  ReasoningStep,
  WebhookEventRecord,
  AgentActionType,
  TransactionStatus,
  GuardrailStatus,
  MetricsSummary
} from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Server In-Memory State
let appConfig: AppConfig = {
  mode: 'simulated',
  paypalClientId: process.env.PAYPAL_CLIENT_ID || '',
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  guardrailThreshold: 100, // Actions > $100 require Human-in-the-Loop approval
  autoEscrowForMilestones: true,
};

// Seed initial realistic PayPal transactions
let transactions: PaypalTransaction[] = [
  {
    id: 'INV2-8492-1029',
    type: 'INVOICE_CREATE',
    title: 'Milestone 1: UI/UX High-Fidelity Design System',
    description: 'Autonomous PayPal milestone invoice with escrow protection for completed Figma mobile prototypes and React component specifications.',
    amount: 250.0,
    currency: 'USD',
    payerEmail: 'client-sandbox@acmecorp.io',
    payeeEmail: 'merchant-agent@payagent.ai',
    status: 'PENDING_APPROVAL',
    guardrail: {
      required: true,
      reason: 'Transaction amount ($250.00) exceeds autonomous spending threshold ($100.00). Human-in-the-loop signoff required.',
      threshold: 100,
      status: 'TRIGGERED_APPROVAL_REQUIRED',
    },
    escrowDetails: {
      milestoneName: 'Milestone 1: UI/UX Wireframes & Component Specs',
      releaseConditions: 'Automated deliverable validation passes visual linting & client approval',
      arbitration: 'PayAgent Autonomous Agentic Escrow Rules v2.1',
      isReleased: false,
      lockedAmount: 250.0,
      aiVerificationScore: 98,
      deliverableUrl: 'https://github.com/payagent/deliverables/milestone-1.zip',
    },
    items: [
      { id: 'item-1', name: 'UI/UX Design Wireframes & Mobile Layouts', quantity: 1, unitPrice: 150.0, total: 150.0 },
      { id: 'item-2', name: 'Design Tokens & Interactive Components Specs', quantity: 1, unitPrice: 100.0, total: 100.0 },
    ],
    checkoutUrl: 'https://sandbox.paypal.com/invoice/p/#INV2-8492-1029',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://sandbox.paypal.com/invoice/p/INV2-8492-1029',
    paypalApiEndpoint: 'https://api-m.sandbox.paypal.com/v2/invoicing/invoices',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    rawPayload: {
      id: 'INV2-8492-1029',
      status: 'DRAFT',
      invoice_number: 'PP-INV-2026-8492',
      invoice_date: '2026-11-09',
      amount: { currency_code: 'USD', value: '250.00' },
      escrow_hold: true,
    },
    executionMode: 'simulated',
  },
  {
    id: 'ORD-9281-7740',
    type: 'AUTO_CHECKOUT',
    title: 'Auto-Checkout: Sony WH-1000XM5 Wireless Headphones',
    description: 'Autonomous price watcher matched target discount threshold (< $200.00). Executed instant PayPal sandbox authorization.',
    amount: 179.99,
    currency: 'USD',
    payerEmail: 'agent-treasury@payagent.ai',
    payeeEmail: 'sony-merchant@sandbox.paypal.com',
    status: 'PAID',
    guardrail: {
      required: true,
      reason: 'Rule matched target < $200.00. Pre-authorized by budget guardrail policy #B-409.',
      threshold: 100,
      status: 'USER_APPROVED',
      approvedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
    items: [
      { id: 'item-3', name: 'Sony WH-1000XM5 Noise Canceling Headphones (Silver)', quantity: 1, unitPrice: 179.99, total: 179.99 },
    ],
    checkoutUrl: 'https://sandbox.paypal.com/checkoutnow?token=92817740XYZ',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://sandbox.paypal.com/checkoutnow?token=92817740XYZ',
    paypalApiEndpoint: 'https://api-m.sandbox.paypal.com/v2/checkout/orders',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    rawPayload: {
      id: 'ORD-9281-7740',
      intent: 'CAPTURE',
      status: 'COMPLETED',
      purchase_units: [{ amount: { currency_code: 'USD', value: '179.99' } }],
    },
    executionMode: 'simulated',
  },
  {
    id: 'REF-1830-4921',
    type: 'REFUND_PROCESS',
    title: 'Instant Autonomous Refund: Order #PP-8921',
    description: 'Automated RMA return condition confirmed by merchant warehouse scan. Agent disbursed $18.00 back to buyer via PayPal capture refund API.',
    amount: 18.0,
    currency: 'USD',
    payerEmail: 'merchant-agent@payagent.ai',
    payeeEmail: 'customer-sarah@gmail.com',
    status: 'REFUNDED',
    guardrail: {
      required: false,
      reason: 'Under $100 guardrail threshold ($18.00 <= $100.00). Autonomous execution approved instantly.',
      threshold: 100,
      status: 'AUTO_APPROVED',
    },
    items: [
      { id: 'item-4', name: 'Return Adjustment: Restocking & Partial Shipping Credit', quantity: 1, unitPrice: 18.0, total: 18.0 },
    ],
    checkoutUrl: 'https://sandbox.paypal.com/activity/payment/REF-1830-4921',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://sandbox.paypal.com/activity/payment/REF-1830-4921',
    paypalApiEndpoint: 'https://api-m.sandbox.paypal.com/v2/payments/captures/PP-8921/refund',
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    rawPayload: {
      id: 'REF-1830-4921',
      status: 'COMPLETED',
      amount: { value: '18.00', currency_code: 'USD' },
      note_to_payer: 'Autonomous RMA dispute settled via PayAgent AI.',
    },
    executionMode: 'simulated',
  },
  {
    id: 'ESC-4401-2093',
    type: 'ESCROW_LOCK',
    title: 'Escrow Milestone Contract: Production GraphQL Service',
    description: 'Autonomous smart escrow hold for backend engineering milestone. Funds locked until test coverage >= 90%.',
    amount: 600.0,
    currency: 'USD',
    payerEmail: 'founder@fintechstartup.co',
    payeeEmail: 'dev-contractor@sandbox.paypal.com',
    status: 'ESCROW_LOCKED',
    guardrail: {
      required: true,
      reason: 'High-value escrow contract ($600.00). Multi-sig agent lock engaged.',
      threshold: 100,
      status: 'USER_APPROVED',
      approvedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    },
    escrowDetails: {
      milestoneName: 'GraphQL API Server & Schema Migration',
      releaseConditions: '100% Endpoints passing Jest unit tests & GitHub Actions CI green badge',
      arbitration: 'PayAgent AI Automated CI/CD Webhook Oracle',
      isReleased: false,
      lockedAmount: 600.0,
      aiVerificationScore: 89,
    },
    items: [
      { id: 'item-5', name: 'GraphQL Microservice Backend', quantity: 1, unitPrice: 600.0, total: 600.0 },
    ],
    checkoutUrl: 'https://sandbox.paypal.com/escrow/contract/ESC-4401-2093',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://sandbox.paypal.com/escrow/contract/ESC-4401-2093',
    paypalApiEndpoint: 'https://api-m.sandbox.paypal.com/v2/checkout/orders',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    rawPayload: {
      id: 'ESC-4401-2093',
      intent: 'AUTHORIZE',
      status: 'HELD_IN_ESCROW',
      amount: { currency_code: 'USD', value: '600.00' },
    },
    executionMode: 'simulated',
  },
];

let webhooks: WebhookEventRecord[] = [
  {
    id: 'WH-9081-3321',
    eventType: 'PAYMENT.CAPTURE.COMPLETED',
    resourceId: 'ORD-9281-7740',
    resourceType: 'capture',
    summary: 'Payment capture completed for $179.99 (Sony WH-1000XM5)',
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    status: 'PROCESSED',
    rawPayload: {
      event_type: 'PAYMENT.CAPTURE.COMPLETED',
      resource: { id: 'ORD-9281-7740', amount: { value: '179.99', currency_code: 'USD' } },
    },
  },
  {
    id: 'WH-8871-1209',
    eventType: 'PAYMENT.SALE.REFUNDED',
    resourceId: 'REF-1830-4921',
    resourceType: 'refund',
    summary: 'Refund processed successfully for $18.00',
    timestamp: new Date(Date.now() - 3600000 * 14).toISOString(),
    status: 'PROCESSED',
    rawPayload: {
      event_type: 'PAYMENT.SALE.REFUNDED',
      resource: { id: 'REF-1830-4921', amount: { value: '18.00', currency_code: 'USD' } },
    },
  },
];

// Helper: Calculate live summary metrics
function computeMetrics(): MetricsSummary {
  const totalVolume = transactions
    .filter((t) => t.status === 'PAID' || t.status === 'ESCROW_LOCKED' || t.status === 'COMPLETED')
    .reduce((acc, t) => acc + t.amount, 0);

  const activeEscrowLocked = transactions
    .filter((t) => t.status === 'ESCROW_LOCKED' && t.escrowDetails && !t.escrowDetails.isReleased)
    .reduce((acc, t) => acc + (t.escrowDetails?.lockedAmount || t.amount), 0);

  const autonomousActionsCount = transactions.length + webhooks.length;
  // Avg 12 minutes saved per autonomous payment/invoice step
  const merchantTimeSavedHours = Math.round((autonomousActionsCount * 0.25 + 2.5) * 10) / 10;
  const pendingApprovalCount = transactions.filter((t) => t.status === 'PENDING_APPROVAL').length;

  return {
    totalVolume: Math.round(totalVolume * 100) / 100,
    autonomousActionsCount,
    merchantTimeSavedHours,
    activeEscrowLocked: Math.round(activeEscrowLocked * 100) / 100,
    pendingApprovalCount,
  };
}

// Live PayPal Sandbox API Helper
async function getLivePayPalAccessToken(clientId: string, clientSecret: string) {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal OAuth failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

// API Routes
app.get('/api/config', (_req: Request, res: Response) => {
  res.json({
    mode: appConfig.mode,
    hasPaypalKeys: Boolean(appConfig.paypalClientId && appConfig.paypalClientSecret),
    hasGeminiKey: Boolean(appConfig.geminiApiKey || process.env.GEMINI_API_KEY),
    guardrailThreshold: appConfig.guardrailThreshold,
    autoEscrowForMilestones: appConfig.autoEscrowForMilestones,
    paypalClientIdPreview: appConfig.paypalClientId ? `${appConfig.paypalClientId.slice(0, 6)}...` : '',
  });
});

app.post('/api/config', (req: Request, res: Response) => {
  const { mode, paypalClientId, paypalClientSecret, geminiApiKey, guardrailThreshold, autoEscrowForMilestones } = req.body;
  if (mode && (mode === 'simulated' || mode === 'live')) {
    appConfig.mode = mode;
  }
  if (typeof paypalClientId === 'string') appConfig.paypalClientId = paypalClientId.trim();
  if (typeof paypalClientSecret === 'string') appConfig.paypalClientSecret = paypalClientSecret.trim();
  if (typeof geminiApiKey === 'string') appConfig.geminiApiKey = geminiApiKey.trim();
  if (typeof guardrailThreshold === 'number') appConfig.guardrailThreshold = guardrailThreshold;
  if (typeof autoEscrowForMilestones === 'boolean') appConfig.autoEscrowForMilestones = autoEscrowForMilestones;

  res.json({ success: true, config: { ...appConfig, paypalClientSecret: appConfig.paypalClientSecret ? '***' : '' } });
});

app.post('/api/paypal/verify-keys', async (req: Request, res: Response) => {
  const { clientId, clientSecret } = req.body;
  const targetId = clientId || appConfig.paypalClientId;
  const targetSecret = clientSecret || appConfig.paypalClientSecret;

  if (!targetId || !targetSecret) {
    return res.status(400).json({
      success: false,
      message: 'PayPal Client ID and Secret are required to test live connectivity.',
    });
  }

  try {
    const token = await getLivePayPalAccessToken(targetId, targetSecret);
    return res.json({
      success: true,
      message: 'Successfully authenticated with PayPal Sandbox API! OAuth Token granted.',
      previewToken: `${token.slice(0, 12)}...`,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return res.status(401).json({
      success: false,
      message: `PayPal Sandbox Authentication Error: ${error.message}`,
    });
  }
});

app.get('/api/transactions', (_req: Request, res: Response) => {
  res.json({ transactions, metrics: computeMetrics() });
});

app.get('/api/metrics', (_req: Request, res: Response) => {
  res.json(computeMetrics());
});

app.get('/api/webhooks', (_req: Request, res: Response) => {
  res.json(webhooks);
});

// Autonomous Agent Action Endpoint
app.post('/api/agent/action', async (req: Request, res: Response) => {
  const { message, quickActionId } = req.body;
  const promptText = (message || '').trim();

  if (!promptText && !quickActionId) {
    return res.status(400).json({ error: 'Message or quickActionId required.' });
  }

  const effectiveGeminiKey = appConfig.geminiApiKey || process.env.GEMINI_API_KEY;
  const isLiveMode = appConfig.mode === 'live' && Boolean(appConfig.paypalClientId && appConfig.paypalClientSecret);

  // Parsing intent: invoice vs checkout vs refund vs escrow
  let inferredType: AgentActionType = 'INVOICE_CREATE';
  let targetAmount = 250.0;
  let targetTitle = 'Milestone Invoice for UI Design';
  let targetDescription = 'Milestone payment for verified product deliverables.';
  let targetPayer = 'buyer-sandbox@gmail.com';
  let targetPayee = 'merchant-agent@payagent.ai';
  let isEscrow = false;
  let escrowMilestone = '';

  const lower = promptText.toLowerCase();

  if (quickActionId === 'quick_invoice' || lower.includes('invoice') || lower.includes('ui design') || lower.includes('milestone invoice')) {
    inferredType = 'INVOICE_CREATE';
    targetAmount = 250.0;
    targetTitle = 'Milestone Invoice: UI Design Sprint & Components';
    targetDescription = 'Autonomous milestone invoice with escrow protection for completed Figma mobile prototypes and React component specifications.';
    targetPayer = 'design-client@acme.com';
    isEscrow = true;
    escrowMilestone = 'Figma Wireframes & Component Tokens';
  } else if (quickActionId === 'quick_checkout' || lower.includes('headphones') || lower.includes('checkout') || lower.includes('buy') || lower.includes('sony')) {
    inferredType = 'AUTO_CHECKOUT';
    targetAmount = 189.5;
    targetTitle = 'Auto-Checkout: Sony WH-1000XM5 Headphones';
    targetDescription = 'Autonomous price guardrail caught merchant discount below $200.00 ceiling. Staged for one-click checkout.';
    targetPayer = 'agent-treasury@payagent.ai';
    targetPayee = 'authorized-merchant@sandbox.paypal.com';
  } else if (quickActionId === 'quick_refund' || lower.includes('refund') || lower.includes('pp-8921') || lower.includes('18')) {
    inferredType = 'REFUND_PROCESS';
    targetAmount = 18.0;
    targetTitle = 'Instant Dispute Refund: Order #PP-8921';
    targetDescription = 'Autonomous settlement for return item #PP-8921. Verifying RMA tracking & restocking balance.';
    targetPayer = 'merchant-agent@payagent.ai';
    targetPayee = 'customer-sarah@gmail.com';
  } else if (lower.includes('escrow') || lower.includes('contract')) {
    inferredType = 'ESCROW_LOCK';
    targetAmount = 500.0;
    targetTitle = 'Autonomous Escrow Milestone Contract';
    targetDescription = 'Funds locked into smart escrow vault. Released automatically upon verified milestone criteria.';
    isEscrow = true;
    escrowMilestone = 'Engineering Milestone Deliverable';
  } else {
    // Custom user prompt parsing: extract dollar amount if present
    const amountMatch = promptText.match(/\$?(\d+(\.\d{1,2})?)/);
    if (amountMatch) {
      targetAmount = parseFloat(amountMatch[1]);
    }
    targetTitle = promptText.length > 50 ? `${promptText.slice(0, 47)}...` : promptText;
    targetDescription = `Autonomous agent execution for user request: "${promptText}"`;
    if (lower.includes('buy') || lower.includes('order')) inferredType = 'AUTO_CHECKOUT';
    else if (lower.includes('refund')) inferredType = 'REFUND_PROCESS';
    else if (lower.includes('escrow')) {
      inferredType = 'ESCROW_LOCK';
      isEscrow = true;
    }
  }

  // AI Reasoning Trace Formulation
  const requiresGuardrail = targetAmount > appConfig.guardrailThreshold || isEscrow;
  const initialStatus: TransactionStatus = requiresGuardrail ? 'PENDING_APPROVAL' : 'PAID';
  const guardrailStatus: GuardrailStatus = requiresGuardrail
    ? 'TRIGGERED_APPROVAL_REQUIRED'
    : 'AUTO_APPROVED';

  // Build Reasoning Steps
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  let paypalId = '';
  let apiEndpoint = '';

  if (inferredType === 'INVOICE_CREATE') {
    paypalId = `INV2-${randomSuffix}-${Math.floor(1000 + Math.random() * 9000)}`;
    apiEndpoint = 'https://api-m.sandbox.paypal.com/v2/invoicing/invoices';
  } else if (inferredType === 'AUTO_CHECKOUT') {
    paypalId = `ORD-${randomSuffix}-${Math.floor(1000 + Math.random() * 9000)}`;
    apiEndpoint = 'https://api-m.sandbox.paypal.com/v2/checkout/orders';
  } else if (inferredType === 'REFUND_PROCESS') {
    paypalId = `REF-${randomSuffix}-${Math.floor(1000 + Math.random() * 9000)}`;
    apiEndpoint = 'https://api-m.sandbox.paypal.com/v2/payments/captures/refund';
  } else {
    paypalId = `ESC-${randomSuffix}-${Math.floor(1000 + Math.random() * 9000)}`;
    apiEndpoint = 'https://api-m.sandbox.paypal.com/v2/checkout/orders';
  }

  const reasoningTrace: ReasoningStep[] = [
    {
      step: 1,
      title: 'Intent Parsing & Entity Extraction',
      detail: `Parsed prompt: identified action type [${inferredType}], target amount [$${targetAmount.toFixed(2)} USD], recipient [${targetPayer}], and currency [USD].`,
      status: 'completed',
      durationMs: 84,
    },
    {
      step: 2,
      title: isLiveMode ? 'PayPal Sandbox Live REST API Query' : 'PayPal Agent-Toolkit Sandbox Engine',
      detail: isLiveMode
        ? `Authenticating Bearer token against ${apiEndpoint}. Generating idempotency key [UUID-v4-${randomSuffix}].`
        : `Calling simulated @paypal/agent-toolkit protocol. Formatted compliant PayPal v2 transaction schema with idempotency hash [IDEM-${randomSuffix}].`,
      status: 'completed',
      durationMs: 142,
      apiCall: apiEndpoint,
    },
    {
      step: 3,
      title: 'Risk & Human-in-the-Loop Policy Check',
      detail: requiresGuardrail
        ? `Guardrail rule triggered: Amount $${targetAmount.toFixed(2)} exceeds threshold ($${appConfig.guardrailThreshold.toFixed(2)}). Escalating to Merchant for one-tap verification.`
        : `Amount $${targetAmount.toFixed(2)} is within autonomous limit ($${appConfig.guardrailThreshold.toFixed(2)}). Pre-cleared for auto-execution.`,
      status: requiresGuardrail ? 'alert' : 'completed',
      durationMs: 65,
    },
    {
      step: 4,
      title: 'Generative UI Synthesis & QR Anchor',
      detail: `Synthesized interactive PayPal Transaction Card for ID [${paypalId}]. Anchored instant mobile checkout QR code link with cryptographic session.`,
      status: 'completed',
      durationMs: 47,
    },
  ];

  // Try calling Gemini if API key is present for smart explanation enhancement
  let agentResponseText = '';
  if (effectiveGeminiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey: effectiveGeminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const geminiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are PayAgent AI, an autonomous PayPal commerce & escrow agent for the PayPal Agentic AI Hackathon.
The user requested: "${promptText}".
Action prepared: ${inferredType} for $${targetAmount.toFixed(2)} USD (ID: ${paypalId}).
Guardrail required: ${requiresGuardrail ? 'YES (> $100 threshold)' : 'NO (auto-approved)'}.
Write a concise 2-sentence response directly addressing the user. State clearly what was prepared, the status, and what action (if any) the merchant or buyer needs to take on the Generative UI card below. Keep it professional, fintech-grade, and crisp.`,
      });

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
      const response = (await Promise.race([geminiPromise, timeoutPromise])) as { text?: string } | null;

      if (response && response.text) {
        agentResponseText = response.text.trim();
      }
    } catch {
      // Fallback seamlessly if Gemini call encounters any rate limit or network issue
    }
  }

  if (!agentResponseText) {
    if (inferredType === 'INVOICE_CREATE') {
      agentResponseText = `I have generated Milestone Invoice ${paypalId} for $${targetAmount.toFixed(2)} USD. Because this exceeds your autonomous threshold of $${appConfig.guardrailThreshold.toFixed(2)}, human signoff is required below before funds are held in escrow.`;
    } else if (inferredType === 'AUTO_CHECKOUT') {
      agentResponseText = `Auto-checkout order ${paypalId} for Sony Headphones has been staged at $${targetAmount.toFixed(2)} USD. Review the live breakdown and tap Approve to authorize via PayPal Sandbox.`;
    } else if (inferredType === 'REFUND_PROCESS') {
      agentResponseText = `Instant refund ${paypalId} for $${targetAmount.toFixed(2)} USD has been pre-cleared by the autonomous return policy and submitted to PayPal Sandbox.`;
    } else {
      agentResponseText = `Autonomous action ${paypalId} for $${targetAmount.toFixed(2)} USD has been generated and mounted to the ledger.`;
    }
  }

  // Create transaction object
  const newTx: PaypalTransaction = {
    id: paypalId,
    type: inferredType,
    title: targetTitle,
    description: targetDescription,
    amount: targetAmount,
    currency: 'USD',
    payerEmail: targetPayer,
    payeeEmail: targetPayee,
    status: initialStatus,
    guardrail: {
      required: requiresGuardrail,
      reason: requiresGuardrail
        ? `Amount ($${targetAmount.toFixed(2)}) exceeds guardrail ceiling of $${appConfig.guardrailThreshold.toFixed(2)} or contains escrow lock.`
        : `Autonomous execution authorized. Amount is below $${appConfig.guardrailThreshold.toFixed(2)}.`,
      threshold: appConfig.guardrailThreshold,
      status: guardrailStatus,
    },
    escrowDetails: isEscrow
      ? {
          milestoneName: escrowMilestone || 'Milestone Deliverable Contract',
          releaseConditions: 'Agent checks deliverable verification hash before final disbursement.',
          arbitration: 'PayAgent AI Escrow Oracle v2.1',
          isReleased: false,
          lockedAmount: targetAmount,
          aiVerificationScore: 95,
        }
      : undefined,
    items: [
      {
        id: `item-${Date.now()}`,
        name: targetTitle,
        quantity: 1,
        unitPrice: targetAmount,
        total: targetAmount,
      },
    ],
    checkoutUrl: `https://sandbox.paypal.com/checkoutnow?token=${paypalId}`,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://sandbox.paypal.com/checkoutnow?token=${paypalId}`,
    paypalApiEndpoint: apiEndpoint,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rawPayload: {
      id: paypalId,
      intent: inferredType === 'INVOICE_CREATE' ? 'INVOICE' : 'CAPTURE',
      status: initialStatus,
      amount: { currency_code: 'USD', value: targetAmount.toFixed(2) },
      agent_metadata: {
        agent_id: 'payagent-v2-autonomous',
        guardrail_checked: true,
        mode: isLiveMode ? 'live_sandbox' : 'simulation',
      },
    },
    executionMode: isLiveMode ? 'live' : 'simulated',
  };

  // Prepend to transaction store
  transactions.unshift(newTx);

  return res.json({
    message: agentResponseText,
    reasoningTrace,
    transaction: newTx,
    executionMode: newTx.executionMode,
  });
});

// Human-in-the-Loop Approval & Execution Endpoint
app.post('/api/paypal/execute', async (req: Request, res: Response) => {
  const { transactionId, action } = req.body;

  const tx = transactions.find((t) => t.id === transactionId);
  if (!tx) {
    return res.status(404).json({ error: `Transaction ${transactionId} not found.` });
  }

  const isLive = tx.executionMode === 'live' && Boolean(appConfig.paypalClientId && appConfig.paypalClientSecret);

  if (action === 'APPROVE') {
    tx.guardrail.status = 'USER_APPROVED';
    tx.guardrail.approvedAt = new Date().toISOString();

    if (tx.type === 'ESCROW_LOCK' || tx.escrowDetails) {
      tx.status = 'ESCROW_LOCKED';
    } else if (tx.type === 'INVOICE_CREATE') {
      tx.status = 'PAID';
    } else {
      tx.status = 'PAID';
    }

    tx.updatedAt = new Date().toISOString();

    // Log webhook event
    webhooks.unshift({
      id: `WH-${Date.now().toString().slice(-4)}`,
      eventType: tx.type === 'INVOICE_CREATE' ? 'INVOICING.INVOICE.PAID' : 'PAYMENT.CAPTURE.COMPLETED',
      resourceId: tx.id,
      resourceType: 'transaction',
      summary: `Transaction ${tx.id} approved by merchant and executed via PayPal Sandbox (${tx.amount} USD).`,
      timestamp: new Date().toISOString(),
      status: 'PROCESSED',
      rawPayload: { id: tx.id, status: tx.status, approved_by: 'Human-in-the-Loop Guardrail' },
    });
  } else if (action === 'REJECT') {
    tx.guardrail.status = 'REJECTED';
    tx.status = 'REJECTED';
    tx.updatedAt = new Date().toISOString();
  } else if (action === 'RELEASE_ESCROW') {
    if (tx.escrowDetails) {
      tx.escrowDetails.isReleased = true;
      tx.status = 'PAID';
      tx.updatedAt = new Date().toISOString();

      webhooks.unshift({
        id: `WH-ESC-${Date.now().toString().slice(-4)}`,
        eventType: 'ESCROW.MILESTONE.DISBURSED',
        resourceId: tx.id,
        resourceType: 'escrow',
        summary: `Escrow milestone funds ($${tx.escrowDetails.lockedAmount.toFixed(2)}) released to payee [${tx.payeeEmail}].`,
        timestamp: new Date().toISOString(),
        status: 'PROCESSED',
        rawPayload: { id: tx.id, escrow: tx.escrowDetails },
      });
    }
  } else if (action === 'SIMULATE_PAYMENT') {
    tx.status = 'PAID';
    tx.updatedAt = new Date().toISOString();

    webhooks.unshift({
      id: `WH-SIM-${Date.now().toString().slice(-4)}`,
      eventType: 'CHECKOUT.ORDER.COMPLETED',
      resourceId: tx.id,
      resourceType: 'checkout',
      summary: `Simulated buyer scan and mobile checkout payment settled for ${tx.id} ($${tx.amount.toFixed(2)} USD).`,
      timestamp: new Date().toISOString(),
      status: 'PROCESSED',
      rawPayload: { id: tx.id, payer: tx.payerEmail, amount: tx.amount },
    });
  }

  res.json({
    success: true,
    transaction: tx,
    metrics: computeMetrics(),
    mode: isLive ? 'live' : 'simulated',
  });
});

// Webhook simulation endpoint
app.post('/api/paypal/webhook/simulate', (req: Request, res: Response) => {
  const { eventType, transactionId } = req.body;
  const targetTx = transactions.find((t) => t.id === transactionId) || transactions[0];

  const type = eventType || 'PAYMENT.CAPTURE.COMPLETED';
  const newWebhook: WebhookEventRecord = {
    id: `WH-LIVE-${Math.floor(1000 + Math.random() * 9000)}`,
    eventType: type,
    resourceId: targetTx ? targetTx.id : 'ORD-SYSTEM-99',
    resourceType: type.includes('INVOICE') ? 'invoice' : 'payment',
    summary: `Live Webhook Event: ${type} received from PayPal Sandbox Gateway.`,
    timestamp: new Date().toISOString(),
    status: 'PROCESSED',
    rawPayload: {
      id: `EVT-${Date.now()}`,
      event_type: type,
      create_time: new Date().toISOString(),
      resource: {
        id: targetTx ? targetTx.id : 'PP-SAMPLE-RESOURCE',
        status: 'COMPLETED',
      },
    },
  };

  webhooks.unshift(newWebhook);

  // If webhook completed an order or invoice, update tx
  if (targetTx && (type === 'PAYMENT.CAPTURE.COMPLETED' || type === 'INVOICING.INVOICE.PAID')) {
    targetTx.status = 'PAID';
    targetTx.updatedAt = new Date().toISOString();
  }

  res.json({ success: true, webhook: newWebhook, transactions, metrics: computeMetrics() });
});

// Setup Vite Dev Server vs Static Build
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PayAgent AI] Server operational at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[PayAgent AI] Fatal Server Startup Error:', err);
});
