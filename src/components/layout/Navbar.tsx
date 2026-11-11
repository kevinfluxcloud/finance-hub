import React, { useState } from 'react';
import {
  Calendar,
  CalendarRange,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  LogOut,
  Plus,
  RotateCcw,
  Sparkles,
  User,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { DateFilterMode, DateFilterState } from '../../types/finance';
import {
  buildDateFilter,
  formatCurrency,
  formatDate,
  getMonthName,
} from '../../utils/formatters';
import { Badge, Button, Input, Modal } from '../common/UIComponents';
import { UserProfileModal } from '../auth/UserProfileModal';

export const Navbar: React.FC<{
  onOpenQuickAction: () => void;
}> = ({ onOpenQuickAction }) => {
  const {
    netWorth,
    dateFilter,
    setDateFilter,
    setDateFilterPreset,
  } = useFinance();

  const { user, profile, signOut } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DateFilterMode>(dateFilter.mode);

  // Temporary staging state for modal
  const [modalYear, setModalYear] = useState<number>(dateFilter.year);
  const [modalMonth, setModalMonth] = useState<number>(dateFilter.month);
  const [modalStartDate, setModalStartDate] = useState<string>(
    dateFilter.startDate || '2026-11-01'
  );
  const [modalEndDate, setModalEndDate] = useState<string>(
    dateFilter.endDate || '2026-11-30'
  );

  const openFilterModal = () => {
    setActiveTab(dateFilter.mode);
    setModalYear(dateFilter.year);
    setModalMonth(dateFilter.month);
    setModalStartDate(dateFilter.startDate);
    setModalEndDate(dateFilter.endDate);
    setIsFilterModalOpen(true);
  };

  const handlePrevStep = () => {
    if (dateFilter.mode === 'mes') {
      let y = dateFilter.year;
      let m = dateFilter.month - 1;
      if (m === 0) {
        m = 12;
        y -= 1;
      }
      setDateFilterPreset('mes', { year: y, month: m });
    } else if (dateFilter.mode === 'ano') {
      setDateFilterPreset('ano', { year: dateFilter.year - 1 });
    } else if (dateFilter.mode === 'intervalo') {
      // Shift backwards by 30 days
      const s = new Date(dateFilter.startDate);
      const e = new Date(dateFilter.endDate);
      const diffDays = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
      s.setDate(s.getDate() - diffDays);
      e.setDate(e.getDate() - diffDays);
      const newStart = s.toISOString().slice(0, 10);
      const newEnd = e.toISOString().slice(0, 10);
      setDateFilterPreset('intervalo', { startDate: newStart, endDate: newEnd });
    }
  };

  const handleNextStep = () => {
    if (dateFilter.mode === 'mes') {
      let y = dateFilter.year;
      let m = dateFilter.month + 1;
      if (m === 13) {
        m = 1;
        y += 1;
      }
      setDateFilterPreset('mes', { year: y, month: m });
    } else if (dateFilter.mode === 'ano') {
      setDateFilterPreset('ano', { year: dateFilter.year + 1 });
    } else if (dateFilter.mode === 'intervalo') {
      // Shift forward by diff days
      const s = new Date(dateFilter.startDate);
      const e = new Date(dateFilter.endDate);
      const diffDays = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
      s.setDate(s.getDate() + diffDays);
      e.setDate(e.getDate() + diffDays);
      const newStart = s.toISOString().slice(0, 10);
      const newEnd = e.toISOString().slice(0, 10);
      setDateFilterPreset('intervalo', { startDate: newStart, endDate: newEnd });
    }
  };

  const applyModalFilter = () => {
    if (activeTab === 'mes') {
      setDateFilter(buildDateFilter('mes', { year: modalYear, month: modalMonth }));
    } else if (activeTab === 'ano') {
      setDateFilter(buildDateFilter('ano', { year: modalYear }));
    } else if (activeTab === 'intervalo') {
      const s = modalStartDate || '2026-11-01';
      const e = modalEndDate || '2026-11-30';
      // Ensure s <= e
      if (s > e) {
        setDateFilter(buildDateFilter('intervalo', { startDate: e, endDate: s }));
      } else {
        setDateFilter(buildDateFilter('intervalo', { startDate: s, endDate: e }));
      }
    } else {
      setDateFilter(buildDateFilter('tudo'));
    }
    setIsFilterModalOpen(false);
  };

  // Quick range helpers
  const applyQuickRange = (days: number) => {
    const end = new Date(2026, 10, 30); // 2026-11-30 context
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    const sStr = start.toISOString().slice(0, 10);
    const eStr = end.toISOString().slice(0, 10);
    setModalStartDate(sStr);
    setModalEndDate(eStr);
  };

  const getModeBadge = (mode: DateFilterMode) => {
    switch (mode) {
      case 'mes':
        return <Badge variant="accent">Mês</Badge>;
      case 'ano':
        return <Badge variant="warning">Ano</Badge>;
      case 'intervalo':
        return <Badge variant="bullish">Entre Datas</Badge>;
      case 'tudo':
        return <Badge variant="neutral">Tudo</Badge>;
    }
  };

  const monthsList = [
    { num: 1, short: 'Jan' },
    { num: 2, short: 'Fev' },
    { num: 3, short: 'Mar' },
    { num: 4, short: 'Abr' },
    { num: 5, short: 'Mai' },
    { num: 6, short: 'Jun' },
    { num: 7, short: 'Jul' },
    { num: 8, short: 'Ago' },
    { num: 9, short: 'Set' },
    { num: 10, short: 'Out' },
    { num: 11, short: 'Nov' },
    { num: 12, short: 'Dez' },
  ];

  return (
    <>
      <header className="h-16 bg-[#131b2e] border-b border-[#334155]/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
        {/* Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#3b82f6]/20 border border-[#3b82f6]/50 flex items-center justify-center text-[#3b82f6] shadow-sm">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-[#f8fafc]">
                PERSONAL FINANCE HUB
              </span>
              <Badge variant="neutral" className="hidden sm:inline-flex text-[10px]">
                V1.0 TELEMETRY
              </Badge>
            </div>
            <p className="text-[11px] text-[#94a3b8] hidden sm:block">
              Gestão Patrimonial & Quitação Estratégica
            </p>
          </div>
        </div>

        {/* Global Date & Range Selector */}
        <div className="flex items-center bg-[#0b1326] border border-[#334155] rounded px-1.5 py-1 shadow-inner gap-1">
          <button
            onClick={handlePrevStep}
            disabled={dateFilter.mode === 'tudo'}
            className="p-1 hover:text-[#f8fafc] text-[#94a3b8] hover:bg-[#1e293b] rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Período anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={openFilterModal}
            className="flex items-center gap-2 px-2.5 py-1 text-xs font-semibold text-[#f8fafc] hover:bg-[#1e293b] rounded transition-colors cursor-pointer group"
            title="Clique para filtrar por Mês, Ano, ou Entre Datas"
          >
            <CalendarRange size={14} className="text-[#3b82f6] shrink-0" />
            <span className="font-mono-numbers">{dateFilter.label}</span>
            <span className="hidden md:inline-flex">{getModeBadge(dateFilter.mode)}</span>
            <ChevronDown
              size={13}
              className="text-[#94a3b8] group-hover:text-[#f8fafc] transition-colors"
            />
          </button>

          <button
            onClick={handleNextStep}
            disabled={dateFilter.mode === 'tudo'}
            className="p-1 hover:text-[#f8fafc] text-[#94a3b8] hover:bg-[#1e293b] rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Próximo período"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Right controls: Net worth badge, Quick Action & Exports */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Net Worth Readout */}
          <div className="hidden lg:flex flex-col items-end border-r border-[#334155] pr-3">
            <span className="text-[10px] text-[#94a3b8] uppercase font-mono tracking-wider">
              Patrimônio Líquido
            </span>
            <span
              className={`text-xs font-bold font-mono-numbers ${
                netWorth.patrimonioLiquido >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
              }`}
            >
              {formatCurrency(netWorth.patrimonioLiquido)}
            </span>
          </div>

          {/* Quick New Transaction Modal */}
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenQuickAction}
            icon={<Plus size={15} />}
          >
            Novo Lançamento
          </Button>

          {/* User Profile & Tenant Trigger */}
          {user && (
            <div className="flex items-center gap-1.5 border-l border-[#334155] pl-2 sm:pl-3">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded hover:bg-[#1e293b] border border-transparent hover:border-[#334155] transition-colors cursor-pointer group"
                title={`Ambiente de ${profile?.fullName || user.email}. Clique para gerenciar perfil.`}
              >
                <div className="w-7 h-7 rounded-full bg-[#3b82f6]/20 border border-[#3b82f6]/50 flex items-center justify-center text-[#3b82f6] font-bold text-xs overflow-hidden shrink-0">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    profile?.fullName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-bold text-[#f8fafc] leading-tight group-hover:text-[#3b82f6] transition-colors truncate max-w-[130px]">
                    {profile?.fullName || user.email.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-[#94a3b8] font-mono leading-tight">
                    Tenant Privado
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={signOut}
                className="p-1.5 text-[#94a3b8] hover:text-[#ef4444] hover:bg-[#ef4444]/10 rounded transition-colors cursor-pointer"
                title="Sair da Conta (Logout)"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Date Filter Modal */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filtrar Período de Análise"
        subtitle="Selecione por Mês, Ano completo, ou Intervalo personalizado Entre Datas"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          {/* Filter Mode Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#0b1326] border border-[#334155] rounded">
            <button
              type="button"
              onClick={() => setActiveTab('mes')}
              className={`py-1.5 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'mes'
                  ? 'bg-[#3b82f6] text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b]'
              }`}
            >
              <Calendar size={13} />
              <span>Por Mês</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ano')}
              className={`py-1.5 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'ano'
                  ? 'bg-[#3b82f6] text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b]'
              }`}
            >
              <Clock size={13} />
              <span>Por Ano</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('intervalo')}
              className={`py-1.5 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'intervalo'
                  ? 'bg-[#3b82f6] text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b]'
              }`}
            >
              <CalendarRange size={13} />
              <span>Entre Datas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tudo')}
              className={`py-1.5 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'tudo'
                  ? 'bg-[#3b82f6] text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b]'
              }`}
            >
              <Globe size={13} />
              <span>Tudo</span>
            </button>
          </div>

          {/* TAB 1: POR MÊS */}
          {activeTab === 'mes' && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between bg-[#171f33] border border-[#334155] rounded px-3 py-2">
                <span className="text-xs text-[#94a3b8] uppercase font-mono">Ano de Referência</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalYear((y) => y - 1)}
                    className="p-1 text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#334155] rounded transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-bold text-[#f8fafc] font-mono-numbers px-2">
                    {modalYear}
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalYear((y) => y + 1)}
                    className="p-1 text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#334155] rounded transition-colors cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Month Grid */}
              <div>
                <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider block mb-2">
                  Selecione o Mês
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {monthsList.map((m) => {
                    const isSelected = modalMonth === m.num;
                    return (
                      <button
                        key={m.num}
                        type="button"
                        onClick={() => setModalMonth(m.num)}
                        className={`py-2 px-2 text-xs font-semibold rounded border transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-[#3b82f6] border-[#3b82f6] text-white shadow-md'
                            : 'bg-[#0b1326] border-[#334155] text-[#dae2fd] hover:border-[#3b82f6]/50 hover:bg-[#1e293b]'
                        }`}
                      >
                        {m.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Month Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#334155]/60">
                <span className="text-[11px] text-[#94a3b8]">Atalhos rápidos:</span>
                <button
                  type="button"
                  onClick={() => {
                    setModalYear(2026);
                    setModalMonth(11);
                  }}
                  className="px-2 py-1 text-[11px] bg-[#1e293b] hover:bg-[#334155] text-[#93c5fd] rounded border border-[#334155] cursor-pointer"
                >
                  Novembro/2026 (Atual)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalYear(2026);
                    setModalMonth(10);
                  }}
                  className="px-2 py-1 text-[11px] bg-[#1e293b] hover:bg-[#334155] text-[#dae2fd] rounded border border-[#334155] cursor-pointer"
                >
                  Outubro/2026 (Anterior)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalYear(2026);
                    setModalMonth(12);
                  }}
                  className="px-2 py-1 text-[11px] bg-[#1e293b] hover:bg-[#334155] text-[#dae2fd] rounded border border-[#334155] cursor-pointer"
                >
                  Dezembro/2026 (Próximo)
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: POR ANO */}
          {activeTab === 'ano' && (
            <div className="space-y-4 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider block mb-2">
                  Escolha o Ano Consolidado
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[2024, 2025, 2026, 2027].map((yr) => {
                    const isSelected = modalYear === yr;
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setModalYear(yr)}
                        className={`py-3 px-3 text-sm font-bold rounded border transition-all cursor-pointer text-center font-mono-numbers ${
                          isSelected
                            ? 'bg-[#3b82f6] border-[#3b82f6] text-white shadow-md'
                            : 'bg-[#0b1326] border-[#334155] text-[#dae2fd] hover:border-[#3b82f6]/50 hover:bg-[#1e293b]'
                        }`}
                      >
                        {yr}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-[#0b1326] border border-[#334155] rounded text-xs text-[#94a3b8] space-y-1">
                <p className="font-semibold text-[#f8fafc]">Visão Anual Estratégica:</p>
                <p>
                  Calcula todas as receitas, despesas e parcelamentos ocorridos de 01/01/{modalYear} até 31/12/{modalYear}.
                  Ideal para ver balanço patrimonial, total acumulado e fechamento do ano fiscal.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: ENTRE DATAS (INTERVALO PERSONALIZADO) */}
          {activeTab === 'intervalo' && (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Data Inicial (De)"
                  type="date"
                  value={modalStartDate}
                  onChange={(e) => setModalStartDate(e.target.value)}
                  className="font-mono-numbers"
                />
                <Input
                  label="Data Final (Até)"
                  type="date"
                  value={modalEndDate}
                  onChange={(e) => setModalEndDate(e.target.value)}
                  className="font-mono-numbers"
                />
              </div>

              {/* Quick Range Presets */}
              <div>
                <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider block mb-2">
                  Intervalos Rápidos
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => applyQuickRange(7)}
                    className="px-2.5 py-1.5 text-xs bg-[#1e293b] hover:bg-[#334155] text-[#dae2fd] rounded border border-[#334155] transition-colors cursor-pointer text-center"
                  >
                    Últimos 7 dias
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickRange(15)}
                    className="px-2.5 py-1.5 text-xs bg-[#1e293b] hover:bg-[#334155] text-[#dae2fd] rounded border border-[#334155] transition-colors cursor-pointer text-center"
                  >
                    Últimos 15 dias
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickRange(30)}
                    className="px-2.5 py-1.5 text-xs bg-[#1e293b] hover:bg-[#334155] text-[#dae2fd] rounded border border-[#334155] transition-colors cursor-pointer text-center"
                  >
                    Últimos 30 dias
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickRange(90)}
                    className="px-2.5 py-1.5 text-xs bg-[#1e293b] hover:bg-[#334155] text-[#dae2fd] rounded border border-[#334155] transition-colors cursor-pointer text-center"
                  >
                    Últimos 90 dias
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalStartDate('2026-11-01');
                      setModalEndDate('2026-11-30');
                    }}
                    className="px-2.5 py-1.5 text-xs bg-[#1e293b] hover:bg-[#334155] text-[#93c5fd] rounded border border-[#334155] transition-colors cursor-pointer text-center"
                  >
                    Novembro Inteiro
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalStartDate('2026-10-01');
                      setModalEndDate('2026-12-31');
                    }}
                    className="px-2.5 py-1.5 text-xs bg-[#1e293b] hover:bg-[#334155] text-[#dae2fd] rounded border border-[#334155] transition-colors cursor-pointer text-center"
                  >
                    4º Trimestre (Q4)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalStartDate('2026-01-01');
                      setModalEndDate('2026-11-30');
                    }}
                    className="px-2.5 py-1.5 text-xs bg-[#1e293b] hover:bg-[#334155] text-[#dae2fd] rounded border border-[#334155] transition-colors cursor-pointer text-center"
                  >
                    Ano até Hoje (YTD)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalStartDate('2026-01-01');
                      setModalEndDate('2026-12-31');
                    }}
                    className="px-2.5 py-1.5 text-xs bg-[#1e293b] hover:bg-[#334155] text-[#dae2fd] rounded border border-[#334155] transition-colors cursor-pointer text-center"
                  >
                    Ano 2026 Completo
                  </button>
                </div>
              </div>

              <div className="p-2.5 bg-[#0b1326] border border-[#334155] rounded text-xs text-[#94a3b8] flex items-center justify-between">
                <span>Período selecionado:</span>
                <span className="text-[#f8fafc] font-semibold font-mono-numbers">
                  {formatDate(modalStartDate)} até {formatDate(modalEndDate)}
                </span>
              </div>
            </div>
          )}

          {/* TAB 4: TODO O PERÍODO */}
          {activeTab === 'tudo' && (
            <div className="p-4 bg-[#0b1326] border border-[#334155] rounded text-center space-y-2">
              <Globe size={28} className="mx-auto text-[#3b82f6]" />
              <h4 className="text-sm font-semibold text-[#f8fafc]">Visualização Total Sem Filtros</h4>
              <p className="text-xs text-[#94a3b8] max-w-sm mx-auto">
                Todos os lançamentos históricos de receitas, despesas e parcelas serão exibidos,
                independentemente da data de ocorrência.
              </p>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[#334155]/80">
            <button
              type="button"
              onClick={() => {
                setActiveTab('mes');
                setModalYear(2026);
                setModalMonth(11);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-[#f8fafc] transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Redefinir para Padrão</span>
            </button>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsFilterModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={applyModalFilter}
              >
                Aplicar Filtro
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* User Profile & Multi-Tenant Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};

