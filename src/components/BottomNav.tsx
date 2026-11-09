import React from 'react';
import {
  MessageSquare,
  Table,
  Lock,
  Zap,
  ShieldAlert
} from 'lucide-react';

export type TabType = 'chat' | 'ledger' | 'escrow' | 'webhooks';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  pendingApprovalsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  pendingApprovalsCount,
}) => {
  const tabs = [
    {
      id: 'chat' as TabType,
      label: 'Agent Chat',
      icon: MessageSquare,
      badge: null,
    },
    {
      id: 'ledger' as TabType,
      label: 'Merchant Ledger',
      icon: Table,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
    },
    {
      id: 'escrow' as TabType,
      label: 'Escrow Vault',
      icon: Lock,
      badge: null,
    },
    {
      id: 'webhooks' as TabType,
      label: 'Webhooks',
      icon: Zap,
      badge: null,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#060a17]/95 border-t border-slate-800/80 backdrop-blur-lg px-2 sm:px-6 py-2">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer relative ${
                isActive
                  ? 'text-white bg-[#0070ba]/20 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'text-sky-400 scale-110' : 'text-slate-400'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-black shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight truncate ${isActive ? 'text-sky-300' : 'text-slate-400'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-4 h-0.5 rounded-full bg-[#0070ba] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
