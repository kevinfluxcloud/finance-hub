import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Menu,
  ShieldAlert,
  Target,
  TrendingUp,
  Umbrella,
  WalletCards,
  X,
} from 'lucide-react';
import { AccountsView } from './components/accounts/AccountsView';
import { QuickActionModal } from './components/common/QuickActionModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { DebtsView } from './components/debts/DebtsView';
import { EmergencyReserveView } from './components/emergency/EmergencyReserveView';
import { GoalsView } from './components/goals/GoalsView';
import { InstallmentsView } from './components/installments/InstallmentsView';
import { InvestmentsView } from './components/investments/InvestmentsView';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { ExpensesView } from './components/transactions/ExpensesView';
import { IncomesView } from './components/transactions/IncomesView';
import { AuthView } from './components/auth/AuthView';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab } = useFinance();
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar onOpenQuickAction={() => setIsQuickActionOpen(true)} />

      {/* Mobile Drawer Trigger Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-[#131b2e] border-b border-[#334155]/60 text-xs">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex items-center gap-2 text-[#f8fafc] font-semibold py-1 px-2.5 rounded bg-[#1e293b] border border-[#334155]"
        >
          <Menu size={16} />
          <span>Menu Navegação</span>
        </button>
        <span className="text-[11px] font-mono text-[#94a3b8] uppercase">
          Módulo Ativo: <strong className="text-[#3b82f6]">{activeTab}</strong>
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden lg:flex" />

        {/* Mobile Slide-over Sidebar Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative z-10 w-72 bg-[#0b1326] h-full shadow-2xl flex flex-col">
              <div className="p-4 flex items-center justify-between border-b border-[#334155]">
                <span className="font-bold text-sm text-[#f8fafc]">Módulos Financeiros</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-[#94a3b8] hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar onSelectTab={() => setIsMobileMenuOpen(false)} />
              </div>
            </div>
          </div>
        )}

        {/* Dynamic View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardView onOpenQuickAction={() => setIsQuickActionOpen(true)} />
          )}
          {activeTab === 'contas' && <AccountsView />}
          {activeTab === 'receitas' && <IncomesView />}
          {activeTab === 'despesas' && <ExpensesView />}
          {activeTab === 'parcelamentos' && <InstallmentsView />}
          {activeTab === 'investimentos' && <InvestmentsView />}
          {activeTab === 'dividas' && <DebtsView />}
          {activeTab === 'reserva' && <EmergencyReserveView />}
          {activeTab === 'metas' && <GoalsView />}
          {activeTab === 'relatorios' && <ReportsView />}
          {activeTab === 'configuracoes' && <SettingsView />}
        </main>
      </div>

      {/* Global Quick Action Modal */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
      />
    </div>
  );
};

const AuthenticatedApp: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070c18] text-[#dae2fd] flex flex-col items-center justify-center space-y-3 font-sans">
        <div className="w-10 h-10 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-[#94a3b8] tracking-wider uppercase">
          Carregando ambiente seguro...
        </span>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return (
    <FinanceProvider>
      <MainLayout />
    </FinanceProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
