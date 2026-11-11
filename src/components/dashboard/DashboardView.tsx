import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Landmark,
  Layers,
  PieChart as PieIcon,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Umbrella,
  Wallet,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatPercent, getMonthLabel } from '../../utils/formatters';
import { Badge, Button, Card, CardHeader } from '../common/UIComponents';

export const DashboardView: React.FC<{
  onOpenQuickAction: () => void;
}> = ({ onOpenQuickAction }) => {
  const {
    data,
    netWorth,
    selectedMonth,
    dateFilter,
    isDateInActiveFilter,
    totalReceitasMes,
    totalDespesasMes,
    saldoLivreMes,
    emergencyFund,
    totalInvestimentos,
    totalInvestido,
    rentabilidadeGeral,
    totalDividas,
    setActiveTab,
    toggleExpenseStatus,
    toggleIncomeStatus,
  } = useFinance();

  const [activeChartTab, setActiveChartTab] = useState<'patrimonio' | 'fluxo' | 'despesas'>('patrimonio');

  // Filtered transactions for active period
  const receitasMes = data.receitas.filter((r) => isDateInActiveFilter(r.data));
  const despesasMes = data.despesas.filter((d) => isDateInActiveFilter(d.data));
  const parcelasAtivas = data.parcelamentos.filter((p) => p.status === 'ativo');

  // Calculate expense breakdown by category for selected month
  const categoryExpenses: Record<string, number> = {};
  despesasMes.forEach((d) => {
    categoryExpenses[d.categoria] = (categoryExpenses[d.categoria] || 0) + d.valor;
  });
  parcelasAtivas.forEach((p) => {
    categoryExpenses[p.categoria] = (categoryExpenses[p.categoria] || 0) + p.valorParcela;
  });

  const categoryEntries = Object.entries(categoryExpenses).sort((a, b) => b[1] - a[1]);
  const totalDespesasParaGrafico = totalDespesasMes > 0 ? totalDespesasMes : 1;

  // Dynamic 6-month historical progression based on real transactions and net worth
  const currentPatrim = netWorth.patrimonioLiquido;

  // Generate 6 chronological months ending at the active selected month
  const monthList = (() => {
    const [currYStr, currMStr] = (selectedMonth || '2026-11').split('-');
    const currYear = parseInt(currYStr, 10) || 2026;
    const currMonth = parseInt(currMStr, 10) || 11;
    const shortNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const months = [];
    for (let i = 5; i >= 0; i--) {
      let m = currMonth - i;
      let y = currYear;
      while (m <= 0) {
        m += 12;
        y -= 1;
      }
      const mStr = m < 10 ? `0${m}` : `${m}`;
      const ym = `${y}-${mStr}`;
      const label = `${shortNames[m - 1]}/${String(y).slice(2)}`;

      const rec = data.receitas
        .filter((r) => r.data.startsWith(ym))
        .reduce((sum, r) => sum + r.valor, 0);
      const desp = data.despesas
        .filter((d) => d.data.startsWith(ym))
        .reduce((sum, d) => sum + d.valor, 0);

      months.push({
        ym,
        label: i === 0 ? 'Atual' : label,
        receitas: rec,
        despesas: desp,
        saldo: rec - desp,
        patrim: 0,
      });
    }

    // Reconstruct patrimony backwards starting from current real net worth
    const len = months.length;
    months[len - 1].patrim = currentPatrim;
    months[len - 1].receitas = totalReceitasMes > 0 ? totalReceitasMes : months[len - 1].receitas;
    months[len - 1].despesas = totalDespesasMes > 0 ? totalDespesasMes : months[len - 1].despesas;
    months[len - 1].saldo = months[len - 1].receitas - months[len - 1].despesas;

    for (let i = len - 2; i >= 0; i--) {
      // The prior month's wealth was current minus that month's net cash flow contribution
      months[i].patrim = Math.round(months[i + 1].patrim - months[i + 1].saldo);
    }

    return months;
  })();

  // Dynamic growth metrics
  const initialPatrim = monthList[0]?.patrim ?? currentPatrim;
  const crescimento6M = currentPatrim - initialPatrim;
  const crescimento6MPct = initialPatrim !== 0 ? (crescimento6M / Math.abs(initialPatrim)) * 100 : 0;

  // Asset allocation by investment category
  const allocationByCategory: Record<string, number> = {};
  data.investimentos.forEach((inv) => {
    allocationByCategory[inv.categoria] = (allocationByCategory[inv.categoria] || 0) + inv.valorAtual;
  });
  const allocationEntries = Object.entries(allocationByCategory).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Executive Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#131b2e] via-[#171f33] to-[#131b2e] border border-[#334155] rounded p-4 sm:p-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#f8fafc]">
              Painel Executivo de Telemetria
            </h1>
            <Badge variant="accent">Período: {dateFilter.label}</Badge>
          </div>
          <p className="text-xs text-[#94a3b8]">
            Análise patrimonial consolidada, gestão de fluxo operacional e acompanhamento de quitação.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab('reserva')}
            icon={<Umbrella size={14} className="text-[#eab308]" />}
          >
            Reserva ({emergencyFund.coberturaMeses.toFixed(1)} meses)
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab('dividas')}
            icon={<ShieldAlert size={14} className="text-[#ef4444]" />}
          >
            Plano de Quitação
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenQuickAction}
            icon={<Sparkles size={14} />}
          >
            Registrar Lançamento
          </Button>
        </div>
      </div>

      {/* 6 High-Density KPI Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* 1. Patrimônio Líquido */}
        <Card className="hover:border-[#3b82f6] transition-colors relative overflow-hidden group">
          <div className="flex items-center justify-between text-[#94a3b8] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              Patrimônio Líquido
            </span>
            <Landmark size={15} className="text-[#3b82f6]" />
          </div>
          <div
            className={`text-lg font-bold font-mono-numbers tracking-tight ${
              netWorth.patrimonioLiquido >= 0 ? 'text-[#f8fafc]' : 'text-[#ef4444]'
            }`}
          >
            {formatCurrency(netWorth.patrimonioLiquido)}
          </div>
          <div className="mt-2 text-[10px] text-[#94a3b8] flex items-center justify-between">
            <span>Ativos: {formatCurrency(netWorth.totalContas + netWorth.totalInvestimentos)}</span>
            <span className="text-[#ef4444]">-{formatCurrency(netWorth.totalDividas)}</span>
          </div>
        </Card>

        {/* 2. Receitas do Mês */}
        <Card className="hover:border-[#22c55e] transition-colors">
          <div className="flex items-center justify-between text-[#94a3b8] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              Receitas do Mês
            </span>
            <ArrowDownLeft size={15} className="text-[#22c55e]" />
          </div>
          <div className="text-lg font-bold font-mono-numbers text-[#22c55e] tracking-tight">
            +{formatCurrency(totalReceitasMes)}
          </div>
          <div className="mt-2 text-[10px] text-[#94a3b8] flex items-center justify-between">
            <span>{receitasMes.length} lançamentos</span>
            <span className="text-[#22c55e]">
              {receitasMes.filter((r) => r.status === 'recebido').length} recebidos
            </span>
          </div>
        </Card>

        {/* 3. Gastos do Mês */}
        <Card className="hover:border-[#ef4444] transition-colors">
          <div className="flex items-center justify-between text-[#94a3b8] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              Gastos do Mês
            </span>
            <ArrowUpRight size={15} className="text-[#ef4444]" />
          </div>
          <div className="text-lg font-bold font-mono-numbers text-[#ef4444] tracking-tight">
            -{formatCurrency(totalDespesasMes)}
          </div>
          <div className="mt-2 text-[10px] text-[#94a3b8] flex items-center justify-between">
            <span>{despesasMes.length} despesas</span>
            <span>{parcelasAtivas.length} parcelas</span>
          </div>
        </Card>

        {/* 4. Sobra do Mês / Fluxo Líquido */}
        <Card className="hover:border-[#3b82f6] transition-colors">
          <div className="flex items-center justify-between text-[#94a3b8] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              Sobra Líquida
            </span>
            {saldoLivreMes >= 0 ? (
              <TrendingUp size={15} className="text-[#22c55e]" />
            ) : (
              <TrendingDown size={15} className="text-[#ef4444]" />
            )}
          </div>
          <div
            className={`text-lg font-bold font-mono-numbers tracking-tight ${
              saldoLivreMes >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
            }`}
          >
            {formatCurrency(saldoLivreMes)}
          </div>
          <div className="mt-2 text-[10px] text-[#94a3b8] flex items-center justify-between">
            <span>Taxa de Poupança:</span>
            <span className="font-mono-numbers text-[#f8fafc] font-semibold">
              {totalReceitasMes > 0
                ? formatPercent((saldoLivreMes / totalReceitasMes) * 100)
                : '0,00%'}
            </span>
          </div>
        </Card>

        {/* 5. Investimentos Totais */}
        <Card className="hover:border-[#3b82f6] transition-colors">
          <div className="flex items-center justify-between text-[#94a3b8] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              Investimentos
            </span>
            <TrendingUp size={15} className="text-[#3b82f6]" />
          </div>
          <div className="text-lg font-bold font-mono-numbers text-[#f8fafc] tracking-tight">
            {formatCurrency(totalInvestimentos)}
          </div>
          <div className="mt-2 text-[10px] flex items-center justify-between">
            <span className="text-[#94a3b8]">Rentab. Global:</span>
            <span
              className={`font-mono-numbers font-bold ${
                rentabilidadeGeral >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
              }`}
            >
              {formatPercent(rentabilidadeGeral)}
            </span>
          </div>
        </Card>

        {/* 6. Dívidas & Passivos */}
        <Card className="hover:border-[#ef4444] transition-colors">
          <div className="flex items-center justify-between text-[#94a3b8] mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              Dívidas Totais
            </span>
            <ShieldAlert size={15} className="text-[#ef4444]" />
          </div>
          <div className="text-lg font-bold font-mono-numbers text-[#ef4444] tracking-tight">
            {formatCurrency(totalDividas)}
          </div>
          <div className="mt-2 text-[10px] text-[#94a3b8] flex items-center justify-between">
            <span>{data.dividas.filter((d) => d.saldoAtual > 0).length} ativas</span>
            <span className="text-[#3b82f6] hover:underline cursor-pointer" onClick={() => setActiveTab('dividas')}>
              Simular Quitação &rarr;
            </span>
          </div>
        </Card>
      </div>

      {/* Main Analytical Section: Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Interactive Chart Canvas & Telemetry */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-[#334155]/60">
              <div>
                <h3 className="text-sm font-bold text-[#f8fafc] uppercase tracking-wide">
                  Evolução & Telemetria Financeira
                </h3>
                <p className="text-xs text-[#94a3b8]">
                  Histórico patrimonial e comparativo de fluxo de caixa mensal
                </p>
              </div>

              {/* Segmented Timeframe & Chart Switcher */}
              <div className="flex items-center bg-[#0b1326] border border-[#334155] rounded p-0.5">
                <button
                  onClick={() => setActiveChartTab('patrimonio')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    activeChartTab === 'patrimonio'
                      ? 'bg-[#3b82f6] text-white font-semibold'
                      : 'text-[#94a3b8] hover:text-[#f8fafc]'
                  }`}
                >
                  Evolução Patrimonial
                </button>
                <button
                  onClick={() => setActiveChartTab('fluxo')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    activeChartTab === 'fluxo'
                      ? 'bg-[#3b82f6] text-white font-semibold'
                      : 'text-[#94a3b8] hover:text-[#f8fafc]'
                  }`}
                >
                  Receitas x Despesas
                </button>
                <button
                  onClick={() => setActiveChartTab('despesas')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    activeChartTab === 'despesas'
                      ? 'bg-[#3b82f6] text-white font-semibold'
                      : 'text-[#94a3b8] hover:text-[#f8fafc]'
                  }`}
                >
                  Categorias de Gastos
                </button>
              </div>
            </div>

            {/* Render Selected Chart View */}
            {activeChartTab === 'patrimonio' && (
              <div className="space-y-4">
                <div className="h-64 w-full relative flex items-end justify-between pt-6 pb-2 px-2 border-b border-[#334155]/40">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                    <div className="border-b border-[#334155] w-full" />
                    <div className="border-b border-[#334155] w-full" />
                    <div className="border-b border-[#334155] w-full" />
                    <div className="border-b border-[#334155] w-full" />
                  </div>

                  {/* SVG Area Chart */}
                  <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="patrimonioGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* SVG Points generator */}
                    {(() => {
                      const patrimValues = monthList.map((m) => m.patrim);
                      const minVal = Math.min(...patrimValues);
                      const maxVal = Math.max(...patrimValues);
                      const spread = Math.max(10000, maxVal - minVal);
                      const minP = Math.max(0, minVal - spread * 0.15);
                      const maxP = maxVal + spread * 0.15;
                      const range = Math.max(1, maxP - minP);

                      const points = monthList.map((m, idx) => {
                        const x = (idx / (monthList.length - 1)) * 100;
                        const y = 100 - ((m.patrim - minP) / range) * 80;
                        return `${x}%,${y}%`;
                      });
                      const areaPoints = `0%,100% ${points.join(' ')} 100%,100%`;
                      return (
                        <>
                          <polygon points={areaPoints} fill="url(#patrimonioGrad)" />
                          <polyline
                            points={points.join(' ')}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </>
                      );
                    })()}
                  </svg>

                  {/* Interactive Month Columns on scrub */}
                  {monthList.map((m, idx) => {
                    return (
                      <div
                        key={idx}
                        className="relative z-10 flex flex-col items-center flex-1 group cursor-pointer"
                      >
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-[#0b1326] border border-[#3b82f6] px-2 py-1 rounded shadow-xl text-center pointer-events-none z-20 whitespace-nowrap">
                          <p className="text-[10px] text-[#94a3b8]">{m.label}</p>
                          <p className="text-xs font-bold text-[#f8fafc] font-mono-numbers">
                            {formatCurrency(m.patrim)}
                          </p>
                        </div>
                        <div className="w-2.5 h-2.5 rounded-full bg-[#131b2e] border-2 border-[#3b82f6] group-hover:scale-150 transition-transform mb-2 shadow" />
                        <span className="text-[11px] text-[#94a3b8] font-mono group-hover:text-[#f8fafc]">
                          {m.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-center text-xs">
                  <div className="bg-[#0b1326] p-2.5 rounded border border-[#334155]/60 flex flex-col justify-center">
                    <span className="text-[10px] text-[#94a3b8] block uppercase font-mono">Patrimônio Atual</span>
                    <span className="text-sm font-bold text-[#f8fafc] font-mono-numbers mt-0.5">
                      {formatCurrency(currentPatrim)}
                    </span>
                  </div>
                  <div className="bg-[#0b1326] p-2.5 rounded border border-[#334155]/60 flex flex-col justify-center">
                    <span className="text-[10px] text-[#94a3b8] block uppercase font-mono">Crescimento Patrimonial (6M)</span>
                    <span
                      className={`text-sm font-bold font-mono-numbers mt-0.5 ${
                        crescimento6M >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
                      }`}
                    >
                      {crescimento6M >= 0 ? `+${formatCurrency(crescimento6M)}` : `-${formatCurrency(Math.abs(crescimento6M))}`}{' '}
                      ({crescimento6MPct >= 0 ? `+${crescimento6MPct.toFixed(1)}%` : `${crescimento6MPct.toFixed(1)}%`})
                    </span>
                    <span className="text-[9px] text-[#64748b] mt-0.5 font-mono-numbers">
                      Base ({monthList[0]?.label || 'Início'}): {formatCurrency(initialPatrim)}
                    </span>
                  </div>
                  <div className="bg-[#0b1326] p-2.5 rounded border border-[#334155]/60 flex flex-col justify-center">
                    <span className="text-[10px] text-[#94a3b8] block uppercase font-mono">Relação Ativos / Passivos</span>
                    <span className="text-sm font-bold text-[#3b82f6] font-mono-numbers mt-0.5">
                      {netWorth.totalDividas > 0
                        ? `${((netWorth.totalContas + netWorth.totalInvestimentos) / netWorth.totalDividas).toFixed(1)}x`
                        : 'Livre de Dívidas'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeChartTab === 'fluxo' && (
              <div className="space-y-4">
                <div className="h-64 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-[#334155]/40">
                  {monthList.map((m, idx) => {
                    const maxVal = 30000;
                    const recHeight = Math.min(100, (m.receitas / maxVal) * 100);
                    const despHeight = Math.min(100, (m.despesas / maxVal) * 100);

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                        <div className="flex items-end gap-1.5 h-full w-full justify-center">
                          {/* Receita Bar */}
                          <div
                            style={{ height: `${recHeight}%` }}
                            className="w-4 bg-[#22c55e]/80 hover:bg-[#22c55e] rounded-t transition-all relative group-hover:brightness-125"
                            title={`Receitas: ${formatCurrency(m.receitas)}`}
                          />
                          {/* Despesa Bar */}
                          <div
                            style={{ height: `${despHeight}%` }}
                            className="w-4 bg-[#ef4444]/80 hover:bg-[#ef4444] rounded-t transition-all relative group-hover:brightness-125"
                            title={`Despesas: ${formatCurrency(m.despesas)}`}
                          />
                        </div>
                        <span className="text-[11px] text-[#94a3b8] font-mono mt-2">{m.label}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center gap-6 text-xs text-[#94a3b8]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#22c55e]" />
                    <span>Receitas Operacionais</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-[#ef4444]" />
                    <span>Despesas & Parcelamentos</span>
                  </div>
                </div>
              </div>
            )}

            {activeChartTab === 'despesas' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Progress Bars */}
                  <div className="space-y-3">
                    {categoryEntries.slice(0, 6).map(([cat, val], idx) => {
                      const pct = (val / totalDespesasParaGrafico) * 100;
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-[#f8fafc] font-medium">{cat}</span>
                            <span className="font-mono-numbers text-[#94a3b8]">
                              {formatCurrency(val)} ({pct.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-[#0b1326] h-2 rounded-full overflow-hidden border border-[#334155]/60">
                            <div
                              style={{ width: `${pct}%` }}
                              className="h-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1] rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Box */}
                  <div className="bg-[#0b1326] p-4 rounded border border-[#334155] flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase text-[#94a3b8] font-mono">
                        Consumo Orçamentário
                      </h4>
                      <p className="text-lg font-bold text-[#f8fafc] font-mono-numbers mt-1">
                        {formatCurrency(totalDespesasMes)}
                      </p>
                      <p className="text-xs text-[#94a3b8] mt-2">
                        Maior centro de custo do mês:{' '}
                        <span className="text-[#f8fafc] font-semibold">
                          {categoryEntries[0]?.[0] || 'Nenhum'} ({formatCurrency(categoryEntries[0]?.[1] || 0)})
                        </span>
                      </p>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveTab('despesas')}
                      className="mt-4"
                    >
                      Ver Detalhes das Despesas &rarr;
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Pending Month Obligations & Quick Actions */}
          <Card>
            <CardHeader
              title="Lançamentos & Vencimentos do Mês"
              subtitle={`Acompanhamento em tempo real para ${getMonthLabel(selectedMonth)}`}
              action={
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('despesas')}>
                  Ver Todos &rarr;
                </Button>
              }
            />

            <div className="divide-y divide-[#334155]/60">
              {despesasMes.slice(0, 4).map((d) => (
                <div key={d.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleExpenseStatus(d.id)}
                      className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                        d.status === 'pago'
                          ? 'bg-[#22c55e]/20 border-[#22c55e] text-[#22c55e]'
                          : 'border-[#334155] hover:border-[#94a3b8] text-transparent'
                      }`}
                    >
                      <CheckCircle2 size={13} />
                    </button>
                    <div>
                      <p className="font-semibold text-[#f8fafc]">{d.descricao}</p>
                      <p className="text-[11px] text-[#94a3b8]">
                        {d.categoria} • Vencimento: {d.data}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold font-mono-numbers text-[#ef4444]">
                      -{formatCurrency(d.valor)}
                    </p>
                    <Badge variant={d.status === 'pago' ? 'bullish' : 'warning'} className="text-[10px]">
                      {d.status === 'pago' ? 'PAGO' : 'PENDENTE'}
                    </Badge>
                  </div>
                </div>
              ))}

              {despesasMes.length === 0 && (
                <div className="py-6 text-center text-xs text-[#94a3b8]">
                  Nenhuma despesa registrada para o mês selecionado.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right 4 Cols: Emergency Fund Telemetry & Quick Assets */}
        <div className="lg:col-span-4 space-y-6">
          {/* Automatic Emergency Fund SPEC Widget */}
          <Card className="border-[#eab308]/40 bg-gradient-to-b from-[#131b2e] to-[#0f172a]">
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <Umbrella size={16} className="text-[#eab308]" />
                  <span>Reserva de Emergência</span>
                </div>
              }
              subtitle="Cálculo automático: média 6 meses x 6"
              action={
                <Badge variant={emergencyFund.percentualAtingido >= 100 ? 'bullish' : 'warning'}>
                  {emergencyFund.percentualAtingido.toFixed(0)}%
                </Badge>
              }
            />

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs text-[#94a3b8]">Saldo Protegido:</span>
                  <span className="text-base font-bold text-[#f8fafc] font-mono-numbers">
                    {formatCurrency(emergencyFund.saldoReservaAtual)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#94a3b8] mb-2 font-mono-numbers">
                  <span>Alvo ({data.configuracoes?.mesesReservaEmergencia || 6} meses):</span>
                  <span>{formatCurrency(emergencyFund.metaReservaTotal)}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#0b1326] h-3 rounded-full overflow-hidden border border-[#334155]">
                  <div
                    style={{ width: `${Math.min(100, emergencyFund.percentualAtingido)}%` }}
                    className="h-full bg-gradient-to-r from-[#eab308] to-[#22c55e] rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#0b1326] rounded border border-[#334155]/70 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Cobertura Real:</span>
                  <span className="font-bold text-[#f8fafc] font-mono-numbers">
                    {emergencyFund.coberturaMeses.toFixed(1)} meses de custo de vida
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Média de Custo Mensal:</span>
                  <span className="font-mono-numbers text-[#94a3b8]">
                    {formatCurrency(emergencyFund.mediaMensal6Meses)} / mês
                  </span>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveTab('reserva')}
                className="w-full"
              >
                Auditar Memória de Cálculo &rarr;
              </Button>
            </div>
          </Card>

          {/* Financial Goals Progress Preview */}
          <Card>
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-[#a855f7]" />
                  <span>Metas Financeiras Ativas</span>
                </div>
              }
              action={
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('metas')}>
                  Ver Todas &rarr;
                </Button>
              }
            />

            <div className="space-y-3">
              {data.metas.slice(0, 3).map((meta) => {
                const prog = Math.min(100, (meta.acumulado / (meta.valorAlvo || 1)) * 100);
                return (
                  <div key={meta.id} className="p-3 bg-[#0b1326] rounded border border-[#334155]/60 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-[#f8fafc]">{meta.titulo}</span>
                      <Badge variant={prog >= 100 ? 'bullish' : 'accent'} className="text-[10px]">
                        {prog.toFixed(0)}%
                      </Badge>
                    </div>

                    <div className="w-full bg-[#1e293b] h-2 rounded-full overflow-hidden border border-[#334155]">
                      <div
                        style={{ width: `${prog}%` }}
                        className="h-full bg-[#3b82f6] rounded-full"
                      />
                    </div>

                    <div className="flex justify-between text-[11px] font-mono-numbers text-[#94a3b8]">
                      <span>{formatCurrency(meta.acumulado)}</span>
                      <span>Alvo: {formatCurrency(meta.valorAlvo)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Accounts Overview */}
          <Card>
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-[#3b82f6]" />
                  <span>Contas e Liquidez Imediata</span>
                </div>
              }
              action={
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('contas')}>
                  Gerenciar &rarr;
                </Button>
              }
            />

            <div className="space-y-2">
              {data.contas.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between p-2.5 bg-[#0b1326] rounded border border-[#334155]/60 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      style={{ backgroundColor: acc.cor || '#3b82f6' }}
                      className="w-2.5 h-2.5 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-[#f8fafc]">{acc.nome}</p>
                      <p className="text-[10px] text-[#94a3b8]">{acc.instituicao}</p>
                    </div>
                  </div>
                  <span className="font-bold font-mono-numbers text-[#f8fafc]">
                    {formatCurrency(acc.saldo)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
