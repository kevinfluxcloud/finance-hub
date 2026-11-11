import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Info,
  Layers,
  Lock,
  Plus,
  ShieldCheck,
  TrendingUp,
  Umbrella,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, getMonthLabel } from '../../utils/formatters';
import { Badge, Button, Card, CardHeader, Input, Select } from '../common/UIComponents';

export const EmergencyReserveView: React.FC = () => {
  const { data, emergencyFund, selectedMonth, updateInvestment, setActiveTab } = useFinance();
  const [multiplier, setMultiplier] = useState<number>(data.configuracoes?.mesesReservaEmergencia || 6);

  // Recalculate target with local multiplier
  const metaTotalDinamica = emergencyFund.mediaMensal6Meses * multiplier;
  const coberturaMeses = emergencyFund.mediaMensal6Meses > 0 ? emergencyFund.saldoReservaAtual / emergencyFund.mediaMensal6Meses : 0;
  const percentualAtingido = metaTotalDinamica > 0 ? Math.min((emergencyFund.saldoReservaAtual / metaTotalDinamica) * 100, 100) : 0;
  const valorFaltante = Math.max(0, metaTotalDinamica - emergencyFund.saldoReservaAtual);

  // Find assets tagged as emergency
  const reservaAssets = data.investimentos.filter(
    (i) => i.categoria === 'Reserva de Emergência' || i.nome.toLowerCase().includes('reserva') || i.nome.toLowerCase().includes('selic')
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#334155]/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#f8fafc]">
              Reserva de Emergência Automática
            </h1>
            <Badge variant="accent">SPEC v1.0 Standard</Badge>
          </div>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Cálculo algorítmico contínuo conforme especificação: Média dos últimos 6 meses de gastos x 6
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab('investimentos')}
            icon={<TrendingUp size={14} className="text-[#22c55e]" />}
          >
            Aportar em Ativo de Reserva
          </Button>
        </div>
      </div>

      {/* Thermometer / Safety Score Banner */}
      <div className="bg-gradient-to-r from-[#131b2e] via-[#171f33] to-[#0b1326] border border-[#eab308]/40 rounded p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Umbrella size={22} className="text-[#eab308]" />
              <h2 className="text-base font-bold text-[#f8fafc] uppercase tracking-wide">
                Termômetro de Segurança Financeira & Cobertura
              </h2>
            </div>
            <p className="text-xs text-[#94a3b8]">
              Em caso de interrupção total das suas receitas, seu patrimônio líquido disponível garante:
            </p>
          </div>

          <div className="flex items-baseline gap-2 bg-[#0b1326] px-4 py-2 rounded border border-[#334155]">
            <span className="text-3xl font-bold font-mono-numbers text-[#f8fafc]">
              {coberturaMeses.toFixed(1)}
            </span>
            <span className="text-xs text-[#94a3b8] font-mono">
              / {multiplier} meses recomendados
            </span>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono-numbers">
            <span className="text-[#94a3b8]">Status de Blindagem Patrimonial:</span>
            <span className="font-bold text-[#22c55e]">{percentualAtingido.toFixed(1)}% do objetivo</span>
          </div>

          <div className="w-full bg-[#0b1326] h-4 rounded-full overflow-hidden p-0.5 border border-[#334155]">
            <div
              style={{ width: `${percentualAtingido}%` }}
              className="h-full bg-gradient-to-r from-[#eab308] via-[#3b82f6] to-[#22c55e] rounded-full transition-all duration-700 shadow"
            />
          </div>

          <div className="flex justify-between text-[11px] font-mono-numbers text-[#94a3b8] pt-1">
            <span>Saldo Alocado Atual: {formatCurrency(emergencyFund.saldoReservaAtual)}</span>
            <span className={valorFaltante > 0 ? 'text-[#ef4444]' : 'text-[#22c55e]'}>
              {valorFaltante > 0
                ? `Falta aportar: ${formatCurrency(valorFaltante)}`
                : 'Meta 100% Blindada!'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Média Mensal de Gastos (6 Meses)
          </span>
          <p className="text-xl font-bold text-[#f8fafc] font-mono-numbers mt-1">
            {formatCurrency(emergencyFund.mediaMensal6Meses)} / mês
          </p>
          <span className="text-[10px] text-[#94a3b8]">
            Calculado automaticamente das despesas reais registradas
          </span>
        </Card>

        <Card>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Meta Total da Reserva ({multiplier} Meses)
          </span>
          <p className="text-xl font-bold text-[#eab308] font-mono-numbers mt-1">
            {formatCurrency(metaTotalDinamica)}
          </p>
          <span className="text-[10px] text-[#94a3b8]">
            {multiplier} x {formatCurrency(emergencyFund.mediaMensal6Meses)}
          </span>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
              Perfil do Multiplicador
            </span>
            <Lock size={13} className="text-[#3b82f6]" />
          </div>
          <div className="mt-2">
            <select
              value={multiplier}
              onChange={(e) => setMultiplier(parseInt(e.target.value, 10))}
              className="w-full bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-[#f8fafc]"
            >
              <option value={3}>3 Meses (Perfil Dinâmico / Servidor Público)</option>
              <option value={6}>6 Meses (Recomendado CLT / Executivo)</option>
              <option value={12}>12 Meses (Autônomo / Empresário / Renda Variável)</option>
            </select>
          </div>
        </Card>
      </div>

      {/* Audit: 6-Month Historical Calculation Memory */}
      <Card>
        <CardHeader
          title="Memória de Cálculo dos Últimos 6 Meses"
          subtitle="Auditoria transparente dos dados financeiros que alimentam a média"
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#171f33] border-b border-[#334155] text-[#94a3b8] uppercase font-mono text-[10px]">
                <th className="py-2.5 px-4">Mês Histórico</th>
                <th className="py-2.5 px-4 text-right">Despesas Registradas + Parcelas</th>
                <th className="py-2.5 px-4 text-right">Peso no Cálculo</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]/60">
              {emergencyFund.historicoMensal.map((h, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-[#f8fafc]">
                    {getMonthLabel(h.mes)} ({h.mes})
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono-numbers font-bold text-[#f8fafc]">
                    {formatCurrency(h.totalDespesas)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono-numbers text-[#94a3b8]">
                    16.67%
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <Badge variant="neutral">Consolidado</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#0b1326] font-bold border-t border-[#334155] text-xs">
                <td className="py-3 px-4 text-[#f8fafc]">Média Mensal Calculada (Soma / 6):</td>
                <td className="py-3 px-4 text-right font-mono-numbers text-[#22c55e]">
                  {formatCurrency(emergencyFund.mediaMensal6Meses)}
                </td>
                <td className="py-3 px-4 text-right font-mono-numbers text-[#3b82f6]">100%</td>
                <td className="py-3 px-4 text-center">
                  <Badge variant="bullish">Ativo</Badge>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Designated Assets List */}
      <Card>
        <CardHeader
          title="Ativos e Contas Alocados na Reserva"
          subtitle="Instrumentos de alta liquidez e baixíssima volatilidade (D+0 ou D+1)"
        />

        <div className="space-y-2">
          {reservaAssets.map((asset) => (
            <div
              key={asset.id}
              className="flex items-center justify-between p-3 bg-[#0b1326] rounded border border-[#334155]/70 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#eab308]/15 border border-[#eab308]/30 flex items-center justify-center text-[#eab308]">
                  <Umbrella size={16} />
                </div>
                <div>
                  <p className="font-bold text-[#f8fafc]">{asset.nome}</p>
                  <p className="text-[11px] text-[#94a3b8]">
                    {asset.instituicao} • Rentabilidade: {asset.rentabilidade?.toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold font-mono-numbers text-[#f8fafc]">
                  {formatCurrency(asset.valorAtual)}
                </p>
                <Badge variant="bullish" className="text-[10px]">
                  Liquidez Imediata
                </Badge>
              </div>
            </div>
          ))}

          {reservaAssets.length === 0 && (
            <div className="py-6 text-center text-xs text-[#94a3b8]">
              Nenhum ativo vinculado explicitamente à reserva. Adicione um ativo com categoria "Reserva de Emergência" em Investimentos.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
