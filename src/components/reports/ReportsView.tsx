import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Landmark,
  Scale,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatPercent, getMonthLabel } from '../../utils/formatters';
import { exportToCSV, exportToExcel } from '../../utils/storage';
import { Badge, Button, Card, CardHeader } from '../common/UIComponents';

export const ReportsView: React.FC = () => {
  const {
    data,
    netWorth,
    selectedMonth,
    dateFilter,
    isDateInActiveFilter,
    totalReceitasMes,
    totalDespesasMes,
    saldoLivreMes,
  } = useFinance();
  const [reportType, setReportType] = useState<'dre' | 'balanco' | 'fluxo'>('dre');

  // DRE Calculations for active period
  const receitasMes = data.receitas.filter((r) => isDateInActiveFilter(r.data));
  const despesasMes = data.despesas.filter((d) => isDateInActiveFilter(d.data));
  const parcelasAtivas = data.parcelamentos.filter((p) => p.status === 'ativo');

  const despesasEssenciais = despesasMes
    .filter((d) => ['Moradia', 'Alimentação', 'Saúde & Bem-estar', 'Transporte'].includes(d.categoria))
    .reduce((s, d) => s + d.valor, 0);

  const despesasEstiloVida = despesasMes
    .filter((d) => !['Moradia', 'Alimentação', 'Saúde & Bem-estar', 'Transporte'].includes(d.categoria))
    .reduce((s, d) => s + d.valor, 0);

  const parcelasMes = parcelasAtivas.reduce((s, p) => s + p.valorParcela, 0);

  const jurosDividasMes = data.dividas
    .filter((d) => d.saldoAtual > 0)
    .reduce((s, d) => s + d.saldoAtual * (d.taxaJurosMensal / 100), 0);

  const margemPoupanca = totalReceitasMes > 0 ? (saldoLivreMes / totalReceitasMes) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Title & Exports */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#334155]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#f8fafc]">
            Relatórios Financeiros & Análise Patrimonial
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Demonstrativos contábeis executivos: DRE Pessoal, Balanço Patrimonial e Fluxo de Caixa
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportToCSV(data)}
            icon={<Download size={14} />}
          >
            Exportar CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => exportToExcel(data)}
            icon={<FileSpreadsheet size={14} />}
          >
            Exportar Relatório Excel (.xlsx)
          </Button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-[#334155]/60 pb-2">
        <button
          onClick={() => setReportType('dre')}
          className={`flex items-center gap-2 px-4 py-2 text-xs rounded transition-colors ${
            reportType === 'dre'
              ? 'bg-[#3b82f6] text-white font-bold'
              : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#131b2e]'
          }`}
        >
          <FileText size={15} />
          DRE Financeiro Pessoal
        </button>
        <button
          onClick={() => setReportType('balanco')}
          className={`flex items-center gap-2 px-4 py-2 text-xs rounded transition-colors ${
            reportType === 'balanco'
              ? 'bg-[#3b82f6] text-white font-bold'
              : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#131b2e]'
          }`}
        >
          <Scale size={15} />
          Balanço Patrimonial (Ativos x Passivos)
        </button>
        <button
          onClick={() => setReportType('fluxo')}
          className={`flex items-center gap-2 px-4 py-2 text-xs rounded transition-colors ${
            reportType === 'fluxo'
              ? 'bg-[#3b82f6] text-white font-bold'
              : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#131b2e]'
          }`}
        >
          <BarChart3 size={15} />
          Matriz de Fluxo de Caixa
        </button>
      </div>

      {/* 1. DRE PESSOAL */}
      {reportType === 'dre' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 bg-[#171f33] border-b border-[#334155] flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-[#f8fafc] uppercase tracking-wide">
                Demonstrativo do Resultado do Exercício (DRE)
              </h3>
              <p className="text-xs text-[#94a3b8]">
                Competência / Período: {dateFilter.label}
              </p>
            </div>
            <Badge variant={saldoLivreMes >= 0 ? 'bullish' : 'bearish'}>
              Margem de Poupança: {margemPoupanca.toFixed(1)}%
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#334155] text-[#94a3b8] uppercase font-mono text-[10px] bg-[#0b1326]">
                  <th className="py-2.5 px-4">Linha Contábil</th>
                  <th className="py-2.5 px-4">Classificação</th>
                  <th className="py-2.5 px-4 text-right">Valor Nominal (R$)</th>
                  <th className="py-2.5 px-4 text-right">% Receita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]/60 font-mono-numbers">
                {/* 1. Receita Bruta */}
                <tr className="bg-[#131b2e] font-semibold text-[#22c55e]">
                  <td className="py-3 px-4 font-sans font-bold text-[#f8fafc]">
                    (+) RECEITA TOTAL OPERACIONAL
                  </td>
                  <td className="py-3 px-4 font-sans text-[#94a3b8]">Entradas brutas</td>
                  <td className="py-3 px-4 text-right font-bold">
                    +{formatCurrency(totalReceitasMes)}
                  </td>
                  <td className="py-3 px-4 text-right">100,00%</td>
                </tr>

                {/* 2. Despesas Essenciais */}
                <tr>
                  <td className="py-3 px-4 pl-8 text-[#f8fafc]">
                    (-) Custos Fixos & Despesas Essenciais
                  </td>
                  <td className="py-3 px-4 font-sans text-[#94a3b8]">Moradia, Saúde, Alimentação</td>
                  <td className="py-3 px-4 text-right text-[#ef4444]">
                    -{formatCurrency(despesasEssenciais)}
                  </td>
                  <td className="py-3 px-4 text-right text-[#94a3b8]">
                    {totalReceitasMes > 0 ? ((despesasEssenciais / totalReceitasMes) * 100).toFixed(1) : 0}%
                  </td>
                </tr>

                {/* 3. Despesas Estilo de Vida */}
                <tr>
                  <td className="py-3 px-4 pl-8 text-[#f8fafc]">
                    (-) Despesas Discricionárias (Estilo de Vida)
                  </td>
                  <td className="py-3 px-4 font-sans text-[#94a3b8]">Lazer, Compras, Assinaturas</td>
                  <td className="py-3 px-4 text-right text-[#ef4444]">
                    -{formatCurrency(despesasEstiloVida)}
                  </td>
                  <td className="py-3 px-4 text-right text-[#94a3b8]">
                    {totalReceitasMes > 0 ? ((despesasEstiloVida / totalReceitasMes) * 100).toFixed(1) : 0}%
                  </td>
                </tr>

                {/* 4. Parcelas do Mês */}
                <tr>
                  <td className="py-3 px-4 pl-8 text-[#f8fafc]">
                    (-) Amortização de Compras Parceladas
                  </td>
                  <td className="py-3 px-4 font-sans text-[#94a3b8]">Compromissos de Cartão</td>
                  <td className="py-3 px-4 text-right text-[#ef4444]">
                    -{formatCurrency(parcelasMes)}
                  </td>
                  <td className="py-3 px-4 text-right text-[#94a3b8]">
                    {totalReceitasMes > 0 ? ((parcelasMes / totalReceitasMes) * 100).toFixed(1) : 0}%
                  </td>
                </tr>

                {/* 5. Custo da Dívida */}
                <tr>
                  <td className="py-3 px-4 pl-8 text-[#f8fafc]">
                    (-) Estimativa de Juros de Passivos Financeiros
                  </td>
                  <td className="py-3 px-4 font-sans text-[#94a3b8]">Custo de Capital</td>
                  <td className="py-3 px-4 text-right text-[#ef4444]">
                    -{formatCurrency(jurosDividasMes)}
                  </td>
                  <td className="py-3 px-4 text-right text-[#94a3b8]">
                    {totalReceitasMes > 0 ? ((jurosDividasMes / totalReceitasMes) * 100).toFixed(1) : 0}%
                  </td>
                </tr>

                {/* Resultado Líquido */}
                <tr className="bg-[#0b1326] font-bold text-sm border-t-2 border-[#334155]">
                  <td className="py-4 px-4 font-sans text-[#f8fafc]">
                    (=) RESULTADO OPERACIONAL LÍQUIDO / POUPANÇA
                  </td>
                  <td className="py-4 px-4 font-sans text-[#3b82f6]">Superávit Mensal</td>
                  <td
                    className={`py-4 px-4 text-right ${
                      saldoLivreMes >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
                    }`}
                  >
                    {saldoLivreMes >= 0 ? '+' : ''}
                    {formatCurrency(saldoLivreMes)}
                  </td>
                  <td className="py-4 px-4 text-right text-[#f8fafc]">
                    {margemPoupanca.toFixed(2)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 2. BALANÇO PATRIMONIAL */}
      {reportType === 'balanco' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ativos */}
          <Card className="border-[#22c55e]/40 p-0 overflow-hidden">
            <div className="p-3.5 bg-[#171f33] border-b border-[#334155] flex justify-between items-center">
              <span className="font-bold text-xs uppercase tracking-wide text-[#22c55e]">
                ATIVO TOTAL (O QUE VOCÊ POSSUI)
              </span>
              <span className="font-bold text-sm font-mono-numbers text-[#22c55e]">
                +{formatCurrency(netWorth.totalContas + netWorth.totalInvestimentos)}
              </span>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#94a3b8] font-mono block mb-2">
                  1. Ativo Circulante (Contas & Caixa Disponível)
                </span>
                <div className="space-y-1.5">
                  {data.contas.map((acc) => (
                    <div key={acc.id} className="flex justify-between text-xs py-1 border-b border-[#334155]/40">
                      <span className="text-[#f8fafc]">{acc.nome}</span>
                      <span className="font-mono-numbers text-[#94a3b8]">{formatCurrency(acc.saldo)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-bold pt-1">
                    <span className="text-[#f8fafc]">Subtotal Caixa:</span>
                    <span className="font-mono-numbers text-[#22c55e]">
                      {formatCurrency(netWorth.totalContas)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-[#94a3b8] font-mono block mb-2">
                  2. Ativo Não Circulante (Investimentos & Aplicações)
                </span>
                <div className="space-y-1.5">
                  {data.investimentos.map((inv) => (
                    <div key={inv.id} className="flex justify-between text-xs py-1 border-b border-[#334155]/40">
                      <span className="text-[#f8fafc]">{inv.nome}</span>
                      <span className="font-mono-numbers text-[#94a3b8]">{formatCurrency(inv.valorAtual)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-bold pt-1">
                    <span className="text-[#f8fafc]">Subtotal Investimentos:</span>
                    <span className="font-mono-numbers text-[#22c55e]">
                      {formatCurrency(netWorth.totalInvestimentos)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Passivos & Patrimônio Líquido */}
          <div className="space-y-4">
            <Card className="border-[#ef4444]/40 p-0 overflow-hidden">
              <div className="p-3.5 bg-[#171f33] border-b border-[#334155] flex justify-between items-center">
                <span className="font-bold text-xs uppercase tracking-wide text-[#ef4444]">
                  PASSIVO EXIGÍVEL (O QUE VOCÊ DEVE)
                </span>
                <span className="font-bold text-sm font-mono-numbers text-[#ef4444]">
                  -{formatCurrency(netWorth.totalDividas)}
                </span>
              </div>

              <div className="p-4 space-y-2">
                {data.dividas.map((debt) => (
                  <div key={debt.id} className="flex justify-between text-xs py-1.5 border-b border-[#334155]/40">
                    <div>
                      <span className="text-[#f8fafc] font-semibold">{debt.nome}</span>
                      <span className="block text-[10px] text-[#94a3b8]">{debt.credor}</span>
                    </div>
                    <span className="font-mono-numbers text-[#ef4444] font-bold">
                      -{formatCurrency(debt.saldoAtual)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Patrimônio Líquido Final */}
            <Card className="bg-gradient-to-r from-[#131b2e] to-[#1e293b] border-[#3b82f6]">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#94a3b8] block">
                    Fórmula SPEC: Contas + Investimentos - Dívidas
                  </span>
                  <h3 className="text-base font-bold text-[#f8fafc] mt-0.5">
                    PATRIMÔNIO LÍQUIDO CONSOLIDADO
                  </h3>
                </div>
                <div className="text-right">
                  <span
                    className={`text-2xl font-bold font-mono-numbers ${
                      netWorth.patrimonioLiquido >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
                    }`}
                  >
                    {formatCurrency(netWorth.patrimonioLiquido)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 3. MATRIZ DE FLUXO DE CAIXA */}
      {reportType === 'fluxo' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 bg-[#171f33] border-b border-[#334155]">
            <h3 className="text-sm font-bold text-[#f8fafc] uppercase tracking-wide">
              Fluxo de Caixa Mensal Consolidado
            </h3>
            <p className="text-xs text-[#94a3b8]">
              Visão horizontal da evolução operacional dos últimos 6 meses
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0b1326] border-b border-[#334155] text-[#94a3b8] uppercase font-mono text-[10px]">
                  <th className="py-3 px-4">Indicador</th>
                  <th className="py-3 px-4 text-right">Jun/26</th>
                  <th className="py-3 px-4 text-right">Jul/26</th>
                  <th className="py-3 px-4 text-right">Ago/26</th>
                  <th className="py-3 px-4 text-right">Set/26</th>
                  <th className="py-3 px-4 text-right">Out/26</th>
                  <th className="py-3 px-4 text-right bg-[#3b82f6]/10 text-[#f8fafc]">
                    Nov/26 (Atual)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]/60 font-mono-numbers">
                <tr>
                  <td className="py-3 px-4 font-sans font-semibold text-[#f8fafc]">
                    (+) Receitas Operacionais
                  </td>
                  <td className="py-3 px-4 text-right text-[#22c55e]">R$ 24.500,00</td>
                  <td className="py-3 px-4 text-right text-[#22c55e]">R$ 24.500,00</td>
                  <td className="py-3 px-4 text-right text-[#22c55e]">R$ 25.390,00</td>
                  <td className="py-3 px-4 text-right text-[#22c55e]">R$ 24.500,00</td>
                  <td className="py-3 px-4 text-right text-[#22c55e]">R$ 25.390,00</td>
                  <td className="py-3 px-4 text-right text-[#22c55e] font-bold bg-[#3b82f6]/5">
                    +{formatCurrency(totalReceitasMes)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-sans font-semibold text-[#f8fafc]">
                    (-) Despesas & Parcelamentos
                  </td>
                  <td className="py-3 px-4 text-right text-[#ef4444]">-R$ 10.900,00</td>
                  <td className="py-3 px-4 text-right text-[#ef4444]">-R$ 12.100,00</td>
                  <td className="py-3 px-4 text-right text-[#ef4444]">-R$ 9.850,00</td>
                  <td className="py-3 px-4 text-right text-[#ef4444]">-R$ 11.200,00</td>
                  <td className="py-3 px-4 text-right text-[#ef4444]">-R$ 10.400,00</td>
                  <td className="py-3 px-4 text-right text-[#ef4444] font-bold bg-[#3b82f6]/5">
                    -{formatCurrency(totalDespesasMes)}
                  </td>
                </tr>
                <tr className="bg-[#0b1326] font-bold border-t-2 border-[#334155]">
                  <td className="py-3 px-4 font-sans text-[#f8fafc]">(=) Saldo Líquido do Mês</td>
                  <td className="py-3 px-4 text-right text-[#22c55e]">+R$ 13.600,00</td>
                  <td className="py-3 px-4 text-right text-[#22c55e]">+R$ 12.400,00</td>
                  <td className="py-3 px-4 text-right text-[#22c55e]">+R$ 15.540,00</td>
                  <td className="py-3 px-4 text-right text-[#22c55e]">+R$ 13.300,00</td>
                  <td className="py-3 px-4 text-right text-[#22c55e]">+R$ 14.990,00</td>
                  <td
                    className={`py-3 px-4 text-right font-bold bg-[#3b82f6]/10 ${
                      saldoLivreMes >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
                    }`}
                  >
                    {saldoLivreMes >= 0 ? '+' : ''}
                    {formatCurrency(saldoLivreMes)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
