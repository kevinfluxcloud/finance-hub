import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CreditCard,
  FileText,
  LayoutDashboard,
  PieChart,
  Settings,
  ShieldAlert,
  Target,
  TrendingUp,
  Umbrella,
  WalletCards,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NavigationTab, useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

interface SidebarProps {
  className?: string;
  onSelectTab?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '', onSelectTab }) => {
  const { activeTab, setActiveTab, data, netWorth } = useFinance();
  const { user, profile, signOut } = useAuth();

  const navItems: {
    id: NavigationTab;
    label: string;
    icon: React.ReactNode;
    badgeCount?: number;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard Geral',
      icon: <LayoutDashboard size={17} />,
    },
    {
      id: 'contas',
      label: 'Contas & Saldos',
      icon: <WalletCards size={17} />,
      badgeCount: data.contas.length,
    },
    {
      id: 'receitas',
      label: 'Receitas',
      icon: <ArrowDownLeft size={17} className="text-[#22c55e]" />,
      badgeCount: data.receitas.length,
    },
    {
      id: 'despesas',
      label: 'Despesas',
      icon: <ArrowUpRight size={17} className="text-[#ef4444]" />,
      badgeCount: data.despesas.length,
    },
    {
      id: 'parcelamentos',
      label: 'Parcelamentos',
      icon: <CreditCard size={17} className="text-[#3b82f6]" />,
      badgeCount: data.parcelamentos.filter((p) => p.status === 'ativo').length,
    },
    {
      id: 'investimentos',
      label: 'Investimentos',
      icon: <TrendingUp size={17} className="text-[#22c55e]" />,
      badgeCount: data.investimentos.length,
    },
    {
      id: 'dividas',
      label: 'Dívidas & Quitação',
      icon: <ShieldAlert size={17} className="text-[#ef4444]" />,
      badgeCount: data.dividas.filter((d) => d.saldoAtual > 0).length,
    },
    {
      id: 'reserva',
      label: 'Reserva Automática',
      icon: <Umbrella size={17} className="text-[#eab308]" />,
    },
    {
      id: 'metas',
      label: 'Metas Financeiras',
      icon: <Target size={17} className="text-[#a855f7]" />,
      badgeCount: data.metas.length,
    },
    {
      id: 'relatorios',
      label: 'Relatórios & DRE',
      icon: <BarChart3 size={17} />,
    },
    {
      id: 'configuracoes',
      label: 'Configurações & Backup',
      icon: <Settings size={17} />,
    },
  ];

  return (
    <aside
      className={`w-64 bg-[#0b1326] border-r border-[#334155]/80 flex flex-col justify-between shrink-0 select-none ${className}`}
    >
      {/* Navigation List */}
      <div className="py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold text-[#64748b] tracking-widest uppercase font-mono">
          Navegação Principal
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (onSelectTab) onSelectTab();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#1e293b] text-[#f8fafc] border-l-2 border-[#3b82f6] shadow-sm font-semibold'
                  : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#131b2e]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-[#3b82f6]' : 'text-[#64748b]'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badgeCount !== undefined && item.badgeCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono-numbers ${
                    isActive
                      ? 'bg-[#3b82f6]/20 text-[#93c5fd]'
                      : 'bg-[#1e293b] text-[#64748b]'
                  }`}
                >
                  {item.badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Telemetry Card */}
      <div className="p-3 m-3 bg-[#131b2e] border border-[#334155] rounded space-y-2">
        <div className="flex items-center justify-between text-[11px] text-[#94a3b8]">
          <span className="font-mono uppercase text-[10px]">Patrimônio Líquido</span>
          <span className="text-[10px] text-[#3b82f6]">Consolidado</span>
        </div>
        <div className="text-base font-bold text-[#f8fafc] font-mono-numbers tracking-tight">
          {formatCurrency(netWorth.patrimonioLiquido)}
        </div>
        <div className="text-[10px] space-y-1 pt-1 border-t border-[#334155]/60 text-[#94a3b8] font-mono-numbers">
          <div className="flex justify-between">
            <span>Ativos:</span>
            <span className="text-[#22c55e]">
              +{formatCurrency(netWorth.totalContas + netWorth.totalInvestimentos)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Passivos:</span>
            <span className="text-[#ef4444]">-{formatCurrency(netWorth.totalDividas)}</span>
          </div>
        </div>
      </div>

      {/* Authenticated User Identity */}
      {user && (
        <div className="px-3 pb-3">
          <div className="p-2.5 bg-[#131b2e] border border-[#334155] rounded flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-[#3b82f6]/20 border border-[#3b82f6]/40 flex items-center justify-center text-[#3b82f6] font-bold text-xs shrink-0 overflow-hidden">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  profile?.fullName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()
                )}
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-[#f8fafc] truncate block">
                  {profile?.fullName || user.email.split('@')[0]}
                </span>
                <span className="text-[10px] text-[#94a3b8] truncate block font-mono">
                  {user.email}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={signOut}
              className="p-1.5 text-[#94a3b8] hover:text-[#ef4444] hover:bg-[#ef4444]/10 rounded transition-colors cursor-pointer shrink-0"
              title="Sair da Conta (Logout)"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
