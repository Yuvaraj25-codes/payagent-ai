import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Shield,
  Zap,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import type { ChatMessage, PaypalTransaction } from '../types/index.ts';
import { executeAgentAction, executePayPalAction, triggerSimulatedWebhook } from '../services/api.ts';
import { GenerativeUICard } from './GenerativeUICard.tsx';
import { ReasoningTraceAccordion } from './ReasoningTraceAccordion.tsx';

interface AgentChatProps {
  onTransactionUpdated: (tx: PaypalTransaction) => void;
  onNewTransaction: (tx: PaypalTransaction) => void;
  transactions: PaypalTransaction[];
  mode: 'simulated' | 'live';
}

export const AgentChat: React.FC<AgentChatProps> = ({
  onTransactionUpdated,
  onNewTransaction,
  transactions,
  mode,
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Initial welcome message with sample invoice card
    const firstTx = transactions[0];
    return [
      {
        id: 'msg-welcome',
        sender: 'agent',
        text: '👋 Welcome to PayAgent AI — your Autonomous PayPal Commerce & Escrow Agent. I monitor merchant orders, draft milestone contracts with escrow protection, negotiate auto-checkouts, and settle refunds directly through the PayPal Sandbox API.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        executionMode: mode,
      },
      ...(firstTx
        ? [
            {
              id: 'msg-seed-1',
              sender: 'agent' as const,
              text: 'Here is an active Milestone Invoice staged with Escrow Guardrail protection ready for your review:',
              timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              reasoningTrace: [
                {
                  step: 1,
                  title: 'Intent Parsing & Entity Extraction',
                  detail: 'Identified Milestone Invoice for UI Design ($250.00 USD). Recipient client-sandbox@acmecorp.io.',
                  status: 'completed' as const,
                  durationMs: 78,
                },
                {
                  step: 2,
                  title: 'PayPal Sandbox REST Protocol',
                  detail: 'Initialized @paypal/agent-toolkit protocol with invoice draft v2 payload.',
                  status: 'completed' as const,
                  durationMs: 135,
                  apiCall: 'https://api-m.sandbox.paypal.com/v2/invoicing/invoices',
                },
                {
                  step: 3,
                  title: 'Human-in-the-Loop Risk Evaluation',
                  detail: 'Amount ($250.00) exceeds autonomous threshold ($100.00). Escrow lock engaged. Awaiting merchant approval.',
                  status: 'alert' as const,
                  durationMs: 52,
                },
                {
                  step: 4,
                  title: 'Generative UI Synthesis',
                  detail: 'Generated interactive PayPal Transaction Card with mobile checkout QR code.',
                  status: 'completed' as const,
                  durationMs: 44,
                },
              ],
              transactionCard: firstTx,
              executionMode: mode,
            },
          ]
        : []),
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string, quickActionId?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text && !quickActionId) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: text || (quickActionId === 'quick_invoice' ? 'Create $250 Milestone Invoice for UI Design' : quickActionId === 'quick_checkout' ? 'Auto-Checkout: Buy Sony Headphones under $200' : 'Process $18 Instant Refund for Order #PP-8921'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      executionMode: mode,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await executeAgentAction(text, quickActionId);

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: response.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reasoningTrace: response.reasoningTrace,
        transactionCard: response.transaction,
        executionMode: response.executionMode,
      };

      setMessages((prev) => [...prev, agentMsg]);
      onNewTransaction(response.transaction);
    } catch (err: unknown) {
      const error = err as Error;
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'agent',
        text: `⚠️ Execution Alert: ${error.message || 'Unable to communicate with agent service.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Human-in-the-Loop Approval Action
  const handleApprove = async (txId: string) => {
    try {
      const res = await executePayPalAction(txId, 'APPROVE');
      onTransactionUpdated(res.transaction);

      // Update card in messages stream
      setMessages((prev) =>
        prev.map((m) =>
          m.transactionCard?.id === txId
            ? { ...m, transactionCard: res.transaction }
            : m
        )
      );

      // Add agent system confirmation message
      const confirmMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        sender: 'agent',
        text: `✅ Merchant Approval Confirmed: Transaction ${txId} has been successfully executed via the PayPal Sandbox API. Escrow funds locked / status updated on the merchant ledger.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, confirmMsg]);
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Approval error: ${error.message}`);
    }
  };

  const handleReject = async (txId: string) => {
    try {
      const res = await executePayPalAction(txId, 'REJECT');
      onTransactionUpdated(res.transaction);
      setMessages((prev) =>
        prev.map((m) =>
          m.transactionCard?.id === txId
            ? { ...m, transactionCard: res.transaction }
            : m
        )
      );

      const rejectMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        sender: 'agent',
        text: `🛑 Transaction ${txId} was rejected by merchant. The draft order has been cancelled and unmounted from the ledger.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, rejectMsg]);
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Rejection error: ${error.message}`);
    }
  };

  const handleReleaseEscrow = async (txId: string) => {
    try {
      const res = await executePayPalAction(txId, 'RELEASE_ESCROW');
      onTransactionUpdated(res.transaction);
      setMessages((prev) =>
        prev.map((m) =>
          m.transactionCard?.id === txId
            ? { ...m, transactionCard: res.transaction }
            : m
        )
      );

      const releaseMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        sender: 'agent',
        text: `🎉 Escrow Milestone Released: $${res.transaction.escrowDetails?.lockedAmount.toFixed(2)} disbursed to ${res.transaction.payeeEmail}. Verification score 98% validated.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, releaseMsg]);
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Escrow release error: ${error.message}`);
    }
  };

  const handleSimulatePayment = async (txId: string) => {
    try {
      const res = await executePayPalAction(txId, 'SIMULATE_PAYMENT');
      onTransactionUpdated(res.transaction);
      setMessages((prev) =>
        prev.map((m) =>
          m.transactionCard?.id === txId
            ? { ...m, transactionCard: res.transaction }
            : m
        )
      );

      const simMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        sender: 'agent',
        text: `💳 Payment Captured: Simulated mobile scan for ${txId} completed. $${res.transaction.amount.toFixed(2)} USD deposited into merchant account.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, simMsg]);
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Simulation error: ${error.message}`);
    }
  };

  const handleTriggerWebhook = async (txId: string, eventType: string) => {
    try {
      const res = await triggerSimulatedWebhook(eventType, txId);
      const updated = res.transactions.find((t) => t.id === txId);
      if (updated) {
        onTransactionUpdated(updated);
        setMessages((prev) =>
          prev.map((m) =>
            m.transactionCard?.id === txId
              ? { ...m, transactionCard: updated }
              : m
          )
        );
      }

      const whMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        sender: 'agent',
        text: `⚡ Inbound Webhook Event Dispatched: ${eventType} received for ${txId}. Ledger and audit logs updated.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, whMsg]);
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Webhook trigger error: ${error.message}`);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'msg-welcome-new',
        sender: 'agent',
        text: 'Chat history cleared. Select a quick action chip or type a prompt to initiate autonomous PayPal commerce workflows.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        executionMode: mode,
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-[#050814] text-slate-100 relative">
      {/* Top 3 Quick-Action Starter Chips */}
      <div className="bg-[#080d1e] border-b border-slate-800/80 px-3 py-2.5 sm:px-4 sm:py-3 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Quick-Action Starter Chips (1-Tap Test)
          </span>
          <button
            type="button"
            onClick={clearChat}
            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
            title="Reset Chat"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </button>
        </div>

        {/* The 3 required chips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Chip A */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() =>
              handleSendMessage(
                'Create $250 Milestone Invoice for UI Design',
                'quick_invoice'
              )
            }
            className="text-left p-2.5 rounded-xl bg-gradient-to-br from-[#0c1630] to-[#081024] hover:from-[#112046] hover:to-[#0e1c3c] border border-[#0070ba]/40 hover:border-[#0070ba] text-xs transition-all shadow-sm group cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white group-hover:text-sky-300 transition-colors flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 animate-ping" />
                UI Design Invoice
              </span>
              <span className="font-mono text-cyan-300 font-bold">$250</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
              Milestone Escrow contract with guardrail
            </p>
          </button>

          {/* Chip B */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() =>
              handleSendMessage(
                'Auto-Checkout: Buy Sony Headphones under $200',
                'quick_checkout'
              )
            }
            className="text-left p-2.5 rounded-xl bg-gradient-to-br from-[#0c1630] to-[#081024] hover:from-[#112046] hover:to-[#0e1c3c] border border-[#0070ba]/40 hover:border-[#0070ba] text-xs transition-all shadow-sm group cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white group-hover:text-sky-300 transition-colors flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                Sony Headphones
              </span>
              <span className="font-mono text-emerald-300 font-bold">&lt;$200</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
              Autonomous price monitor & sandbox order
            </p>
          </button>

          {/* Chip C */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() =>
              handleSendMessage(
                'Process $18 Instant Refund for Order #PP-8921',
                'quick_refund'
              )
            }
            className="text-left p-2.5 rounded-xl bg-gradient-to-br from-[#0c1630] to-[#081024] hover:from-[#112046] hover:to-[#0e1c3c] border border-[#0070ba]/40 hover:border-[#0070ba] text-xs transition-all shadow-sm group cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white group-hover:text-sky-300 transition-colors flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
                Instant Refund
              </span>
              <span className="font-mono text-purple-300 font-bold">$18.00</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
              RMA automated dispute settlement
            </p>
          </button>
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 pb-28">
        {messages.map((message) => {
          const isUser = message.sender === 'user';
          return (
            <div
              key={message.id}
              className={`flex gap-3 max-w-3xl ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-md ${
                  isUser
                    ? 'bg-slate-700 border border-slate-600'
                    : 'bg-gradient-to-br from-[#003087] via-[#0070ba] to-[#00cfde] border border-sky-400/40'
                }`}
              >
                {isUser ? <User className="w-4 h-4 text-slate-200" /> : <Bot className="w-4 h-4 text-white" />}
              </div>

              {/* Message Bubble & Content */}
              <div className={`space-y-2 max-w-[88%] sm:max-w-[85%]`}>
                {/* Sender Title and Time */}
                <div
                  className={`flex items-center gap-2 text-[11px] ${
                    isUser ? 'justify-end text-slate-400' : 'text-sky-300 font-medium'
                  }`}
                >
                  <span>{isUser ? 'Merchant Admin' : 'PayAgent Autonomous Engine'}</span>
                  <span className="text-[10px] text-slate-500">{message.timestamp}</span>
                  {!isUser && message.executionMode && (
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-mono bg-sky-950/80 text-sky-300 border border-sky-800">
                      {message.executionMode === 'live' ? 'Live Sandbox' : 'Simulated Sandbox'}
                    </span>
                  )}
                </div>

                {/* Text Bubble */}
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#0070ba] text-white rounded-tr-none shadow-md shadow-[#0070ba]/20 font-medium'
                      : 'bg-[#091122] text-slate-200 rounded-tl-none border border-slate-800 shadow-md font-normal'
                  }`}
                >
                  {message.text}
                </div>

                {/* Agent Reasoning Trace Accordion */}
                {message.reasoningTrace && message.reasoningTrace.length > 0 && (
                  <ReasoningTraceAccordion steps={message.reasoningTrace} defaultOpen={true} />
                )}

                {/* Generative UI Transaction Card */}
                {message.transactionCard && (
                  <GenerativeUICard
                    transaction={message.transactionCard}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onReleaseEscrow={handleReleaseEscrow}
                    onSimulatePayment={handleSimulatePayment}
                    onTriggerWebhook={handleTriggerWebhook}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-3 mr-auto max-w-md">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#003087] via-[#0070ba] to-[#00cfde] flex items-center justify-center flex-shrink-0 border border-sky-400/40">
              <Bot className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="p-3.5 rounded-2xl rounded-tl-none bg-[#091122] border border-[#0070ba]/40 text-xs text-sky-200 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              </div>
              <span className="font-mono text-[11px] text-sky-300">
                Calling @paypal/agent-toolkit & analyzing guardrail policy...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Bottom Input Bar */}
      <div className="p-3 bg-[#080d1e]/95 border-t border-slate-800 backdrop-blur-md absolute bottom-0 left-0 right-0 z-20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="max-w-3xl mx-auto flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask PayAgent (e.g. 'Stage $150 invoice for SEO', 'Buy iPad under $400')..."
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#0e162d] border border-slate-700/80 focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba] text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition-all shadow-inner"
              disabled={isLoading}
            />
            <div className="absolute right-2.5 top-2.5 text-slate-500">
              <Sparkles className="w-4 h-4 text-sky-400/60" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-r from-[#0070ba] to-[#009cde] hover:from-[#005ea6] hover:to-[#0086c2] text-white font-medium shadow-md shadow-[#0070ba]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95 flex-shrink-0"
            title="Execute Autonomous Action"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
