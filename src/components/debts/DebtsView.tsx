import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Edit2,
  Flame,
  Plus,
  ShieldAlert,
  Snowflake,
  Sparkles,
  Trash2,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Debt, PayoffStrategy } from '../../types/finance';
import { simulateDebtPayoff } from '../../utils/calculations';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { Badge, Button, Card, ConfirmModal, Input, Modal, Select } from '../common/UIComponents';

export const DebtsView: React.FC = () => {
  const { data, totalDividas, addDebt, updateDebt, deleteDebt, amortizeDebt } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [deletingDebt, setDeletingDebt] = useState<Debt | null>(null);

  // Amortization modal
  const [amortizingDebt, setAmortizingDebt] = useState<Debt | null>(null);
  const [amortizeAmount, setAmortizeAmount] = useState<number>(0);
  const [amortizeAccountId, setAmortizeAccountId] = useState<string>(data.contas[0]?.id || '');

  // Simulator controls
  const [aporteExtra, setAporteExtra] = useState<number>(500);
  const [selectedStrategy, setSelectedStrategy] = useState<'avalanche' | 'bola_de_neve'>('avalanche');

  // Form states
  const [nome, setNome] = useState('');
  const [credor, setCredor] = useState('');
  const [saldoInicial, setSaldoInicial] = useState<number>(0);
  const [saldoAtual, setSaldoAtual] = useState<number>(0);
  const [taxaJurosMensal, setTaxaJurosMensal] = useState<number>(1.5);
  const [valorParcela, setValorParcela] = useState<number>(0);
  const [parcelasRestantes, setParcelasRestantes] = useState<number>(12);
  const [plano, setPlano] = useState<PayoffStrategy>('avalanche');
  const [categoria, setCategoria] = useState<'Cartão' | 'Empréstimo' | 'Financiamento' | 'Outros'>('Financiamento');

  const resetForm = () => {
    setNome('');
    setCredor('');
    setSaldoInicial(0);
    setSaldoAtual(0);
    setTaxaJurosMensal(1.5);
    setValorParcela(0);
    setParcelasRestantes(12);
    setPlano('avalanche');
    setCategoria('Financiamento');
    setEditingDebt(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setNome(debt.nome);
    setCredor(debt.credor);
    setSaldoInicial(debt.saldoInicial);
    setSaldoAtual(debt.saldoAtual);
    setTaxaJurosMensal(debt.taxaJurosMensal);
    setValorParcela(debt.valorParcela);
    setParcelasRestantes(debt.parcelasRestantes);
    setPlano(debt.plano);
    setCategoria(debt.categoria || 'Financiamento');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || saldoAtual < 0) return;

    const initial = saldoInicial > 0 ? saldoInicial : saldoAtual;

    if (editingDebt) {
      updateDebt(editingDebt.id, {
        nome,
        credor,
        saldoInicial: Number(initial),
        saldoAtual: Number(saldoAtual),
        taxaJurosMensal: Number(taxaJurosMensal),
        valorParcela: Number(valorParcela),
        parcelasRestantes: Number(parcelasRestantes),
        plano,
        categoria,
      });
    } else {
      addDebt({
        nome,
        credor,
        saldoInicial: Number(initial),
        saldoAtual: Number(saldoAtual),
        taxaJurosMensal: Number(taxaJurosMensal),
        valorParcela: Number(valorParcela),
        parcelasRestantes: Number(parcelasRestantes),
        plano,
        categoria,
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleExecuteAmortization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amortizingDebt || amortizeAmount <= 0) return;
    amortizeDebt(amortizingDebt.id, Number(amortizeAmount), amortizeAccountId);
    setAmortizingDebt(null);
    setAmortizeAmount(0);
  };

  // Run Payoff Simulations
  const simAvalanche = useMemo(() => {
    return simulateDebtPayoff(data.dividas, aporteExtra, 'avalanche');
  }, [data.dividas, aporteExtra]);

  const simBolaDeNeve = useMemo(() => {
    return simulateDebtPayoff(data.dividas, aporteExtra, 'bola_de_neve');
  }, [data.dividas, aporteExtra]);

  const activeSim = selectedStrategy === 'avalanche' ? simAvalanche : simBolaDeNeve;

  const totalParcelasMensaisObrigatorias = data.dividas
    .filter((d) => d.saldoAtual > 0)
    .reduce((sum, d) => sum + d.valorParcela, 0);

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#334155]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#f8fafc]">
            Gestão de Dívidas & Estratégias de Quitação
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Simulador preditivo com métodos Bola de Neve (menor saldo) e Avalanche (maior taxa de juros)
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenAdd} icon={<Plus size={14} />}>
          Nova Dívida / Passivo
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-[#ef4444]/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Passivo Exigível Total
          </span>
          <p className="text-xl font-bold text-[#ef4444] font-mono-numbers mt-1">
            {formatCurrency(totalDividas)}
          </p>
          <span className="text-[10px] text-[#94a3b8]">
            {data.dividas.filter((d) => d.saldoAtual > 0).length} obrigações em aberto
          </span>
        </Card>

        <Card>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Compromisso Mensal em Parcelas
          </span>
          <p className="text-xl font-bold text-[#f8fafc] font-mono-numbers mt-1">
            {formatCurrency(totalParcelasMensaisObrigatorias)} / mês
          </p>
          <span className="text-[10px] text-[#94a3b8]">Custo mínimo de manutenção da dívida</span>
        </Card>

        <Card className="border-[#22c55e]/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Economia Estimada no Simulador
          </span>
          <p className="text-xl font-bold text-[#22c55e] font-mono-numbers mt-1">
            {formatCurrency(activeSim.economiaJurosVsMinimo)}
          </p>
          <Badge variant="bullish" className="mt-1">
            Quitação em {activeSim.mesesParaQuitacao} meses
          </Badge>
        </Card>
      </div>

      {/* Payoff Strategy Simulator Interactive Engine */}
      <Card className="bg-gradient-to-br from-[#131b2e] via-[#171f33] to-[#0b1326] border-[#3b82f6]/50">
        <div className="pb-4 border-b border-[#334155] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-[#3b82f6]" />
              <h2 className="text-sm font-bold text-[#f8fafc] uppercase tracking-wide">
                Simulador Estratégico de Quitação Acelerada
              </h2>
            </div>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Descubra exatamente quando você estará livre de dívidas e quanto economizará em juros compostos.
            </p>
          </div>

          {/* Strategy selector toggle */}
          <div className="flex items-center bg-[#0b1326] border border-[#334155] rounded p-1">
            <button
              onClick={() => setSelectedStrategy('avalanche')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors ${
                selectedStrategy === 'avalanche'
                  ? 'bg-[#3b82f6] text-white font-bold shadow'
                  : 'text-[#94a3b8] hover:text-[#f8fafc]'
              }`}
            >
              <Flame size={14} className="text-[#eab308]" />
              Avalanche (Maior Juro)
            </button>
            <button
              onClick={() => setSelectedStrategy('bola_de_neve')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors ${
                selectedStrategy === 'bola_de_neve'
                  ? 'bg-[#3b82f6] text-white font-bold shadow'
                  : 'text-[#94a3b8] hover:text-[#f8fafc]'
              }`}
            >
              <Snowflake size={14} className="text-[#93c5fd]" />
              Bola de Neve (Menor Saldo)
            </button>
          </div>
        </div>

        {/* Simulator Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4">
          <div className="md:col-span-5 space-y-4">
            <div className="p-4 bg-[#0b1326] rounded border border-[#334155] space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-[#f8fafc] uppercase tracking-wide">
                  Aporte Extra Mensal para Amortizar
                </label>
                <span className="text-sm font-bold text-[#22c55e] font-mono-numbers">
                  +{formatCurrency(aporteExtra)} / mês
                </span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="0"
                max="5000"
                step="50"
                value={aporteExtra}
                onChange={(e) => setAporteExtra(parseFloat(e.target.value) || 0)}
                className="w-full accent-[#3b82f6] cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-[#94a3b8] font-mono">
                <span>R$ 0 (Apenas Mínimos)</span>
                <span>R$ 2.500</span>
                <span>R$ 5.000 / mês</span>
              </div>
            </div>

            {/* Explanation box */}
            <div className="p-3 bg-[#1e293b]/50 rounded border border-[#334155]/60 text-xs text-[#94a3b8] space-y-1">
              <p className="font-semibold text-[#f8fafc]">
                {selectedStrategy === 'avalanche'
                  ? '🔥 Como funciona o Método Avalanche:'
                  : '❄️ Como funciona o Método Bola de Neve:'}
              </p>
              <p>
                {selectedStrategy === 'avalanche'
                  ? 'Você paga o valor mínimo em todas as dívidas e direciona 100% do aporte extra para a dívida com a MAIOR TAXA DE JUROS. Matematicamente, é o método que gera a maior economia financeira.'
                  : 'Você paga o mínimo em todas e ataca primeiro a dívida com o MENOR SALDO DEVEDOR. Ao quitá-la rapidamente, você ganha motivação psicológica e transfere toda a parcela dela para a próxima.'}
              </p>
            </div>
          </div>

          {/* Simulation Results Banner */}
          <div className="md:col-span-7 flex flex-col justify-between p-4 bg-[#0b1326] rounded border border-[#334155]">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[#131b2e] rounded border border-[#334155]">
                <span className="text-[10px] text-[#94a3b8] uppercase font-mono block">
                  Tempo até Liberdade Financeira
                </span>
                <span className="text-2xl font-bold text-[#22c55e] font-mono-numbers mt-1 block">
                  {activeSim.mesesParaQuitacao} meses
                </span>
                <span className="text-[10px] text-[#94a3b8]">
                  ~{(activeSim.mesesParaQuitacao / 12).toFixed(1)} anos de quitação
                </span>
              </div>

              <div className="p-3 bg-[#131b2e] rounded border border-[#334155]">
                <span className="text-[10px] text-[#94a3b8] uppercase font-mono block">
                  Juros Totais Estimados a Pagar
                </span>
                <span className="text-2xl font-bold text-[#ef4444] font-mono-numbers mt-1 block">
                  {formatCurrency(activeSim.jurosTotaisPagos)}
                </span>
                <span className="text-[10px] text-[#22c55e] font-semibold">
                  Economia de {formatCurrency(activeSim.economiaJurosVsMinimo)}
                </span>
              </div>
            </div>

            {/* Quick Timeline Preview */}
            <div className="mt-4 pt-3 border-t border-[#334155]/60 text-xs">
              <span className="text-[10px] text-[#94a3b8] uppercase font-mono block mb-2">
                Primeiras Metas de Desendividamento Projetadas:
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {activeSim.cronograma
                  .filter((c) => c.dividasQuitadasNesteMes.length > 0)
                  .map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 bg-[#131b2e] rounded border border-[#22c55e]/30 text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-[#22c55e]" />
                        <span className="text-[#f8fafc] font-semibold">
                          Mês {item.mes}: Quitação de {item.dividasQuitadasNesteMes.join(', ')}
                        </span>
                      </div>
                      <span className="font-mono-numbers text-[#94a3b8]">
                        Saldo Restante: {formatCurrency(item.saldoRestante)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Debts Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#171f33] border-b border-[#334155] text-[#94a3b8] uppercase font-mono text-[10px]">
                <th className="py-3 px-4">Dívida / Credor</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4 text-right">Saldo Inicial</th>
                <th className="py-3 px-4 text-right">Saldo Devedor Atual</th>
                <th className="py-3 px-4 text-right">Taxa (% a.m.)</th>
                <th className="py-3 px-4 text-right">Parcela Mensal</th>
                <th className="py-3 px-4 text-center">Parcelas Restantes</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]/60">
              {data.dividas.map((debt) => {
                const isPaidOff = debt.saldoAtual <= 0;
                const progressoAmortizado =
                  debt.saldoInicial > 0
                    ? Math.min(100, ((debt.saldoInicial - debt.saldoAtual) / debt.saldoInicial) * 100)
                    : 100;

                return (
                  <tr
                    key={debt.id}
                    className={`hover:bg-white/[0.02] transition-colors ${
                      isPaidOff ? 'opacity-50 bg-[#0f172a]' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#f8fafc]">{debt.nome}</span>
                      <span className="block text-[11px] text-[#94a3b8]">{debt.credor}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="accent" className="text-[10px]">
                        {debt.categoria || 'Financiamento'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-numbers text-[#94a3b8]">
                      {formatCurrency(debt.saldoInicial)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-numbers font-bold text-[#ef4444]">
                      {formatCurrency(debt.saldoAtual)}
                      <span className="block text-[10px] text-[#22c55e]">
                        {progressoAmortizado.toFixed(0)}% amortizado
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-numbers font-semibold text-[#f8fafc]">
                      {debt.taxaJurosMensal.toFixed(2)}% a.m.
                    </td>
                    <td className="py-3 px-4 text-right font-mono-numbers text-[#f8fafc]">
                      {formatCurrency(debt.valorParcela)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono-numbers">
                      {isPaidOff ? (
                        <Badge variant="bullish">QUITADA</Badge>
                      ) : (
                        <Badge variant="warning">{debt.parcelasRestantes}x</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isPaidOff && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setAmortizingDebt(debt);
                              setAmortizeAmount(0);
                            }}
                            title="Amortização extraordinária para reduzir saldo"
                          >
                            Amortizar
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(debt)}
                          icon={<Edit2 size={13} />}
                        >
                          {''}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeletingDebt(debt)}
                          icon={<Trash2 size={13} />}
                        >
                          {''}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {data.dividas.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#94a3b8] text-xs">
                    Parabéns! Nenhuma dívida registrada. Seu patrimônio está completamente livre de passivos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Add/Edit Debt */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDebt ? 'Editar Dívida' : 'Nova Dívida / Passivo'}
        subtitle="Cadastre seus financiamentos, empréstimos ou saldos para simulação"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome da Dívida"
            placeholder="Ex: Financiamento Imobiliário SAC, Empréstimo Pessoal..."
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />

          <Input
            label="Credor / Banco"
            placeholder="Ex: Caixa Econômica, Itaú, BTG, Santander..."
            value={credor}
            onChange={(e) => setCredor(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Saldo Inicial (Contratado)"
              type="number"
              step="0.01"
              isMono
              value={saldoInicial || ''}
              onChange={(e) => setSaldoInicial(parseFloat(e.target.value) || 0)}
              required
            />

            <Input
              label="Saldo Devedor Atual (R$)"
              type="number"
              step="0.01"
              isMono
              value={saldoAtual || ''}
              onChange={(e) => setSaldoAtual(parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Taxa de Juros (% ao mês)"
              type="number"
              step="0.01"
              isMono
              value={taxaJurosMensal}
              onChange={(e) => setTaxaJurosMensal(parseFloat(e.target.value) || 0)}
              required
            />

            <Input
              label="Valor da Parcela (R$)"
              type="number"
              step="0.01"
              isMono
              value={valorParcela || ''}
              onChange={(e) => setValorParcela(parseFloat(e.target.value) || 0)}
              required
            />

            <Input
              label="Parcelas Restantes"
              type="number"
              isMono
              value={parcelasRestantes}
              onChange={(e) => setParcelasRestantes(parseInt(e.target.value, 10) || 1)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as any)}
            >
              <option value="Financiamento">Financiamento Imobiliário / Veicular</option>
              <option value="Empréstimo">Empréstimo Pessoal / Consignado</option>
              <option value="Cartão">Cartão de Crédito / Rotativo</option>
              <option value="Outros">Outros Passivos</option>
            </Select>

            <Select
              label="Estratégia Recomendada"
              value={plano}
              onChange={(e) => setPlano(e.target.value as PayoffStrategy)}
            >
              <option value="avalanche">Avalanche (Maior Taxa de Juros)</option>
              <option value="bola_de_neve">Bola de Neve (Menor Saldo Primeiro)</option>
              <option value="personalizado">Personalizado</option>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#334155]/60">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingDebt ? 'Salvar Alterações' : 'Cadastrar Dívida'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Extraordinary Amortization */}
      <Modal
        isOpen={Boolean(amortizingDebt)}
        onClose={() => setAmortizingDebt(null)}
        title={`Amortização Extraordinária - ${amortizingDebt?.nome}`}
        subtitle="Abata diretamente o saldo devedor principal para economizar juros futuros"
      >
        <form onSubmit={handleExecuteAmortization} className="space-y-4">
          <div className="p-3 bg-[#0b1326] rounded border border-[#334155] space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Saldo Devedor Atual:</span>
              <span className="font-bold text-[#ef4444] font-mono-numbers">
                {formatCurrency(amortizingDebt?.saldoAtual)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Taxa de Juros Mensal:</span>
              <span className="font-mono-numbers text-[#f8fafc]">
                {amortizingDebt?.taxaJurosMensal}% a.m.
              </span>
            </div>
          </div>

          <Input
            label="Valor a Amortizar (R$)"
            type="number"
            step="0.01"
            min="0.01"
            max={amortizingDebt?.saldoAtual || 9999999}
            isMono
            value={amortizeAmount || ''}
            onChange={(e) => setAmortizeAmount(parseFloat(e.target.value) || 0)}
            required
          />

          <Select
            label="Debitar da Conta Corrente:"
            value={amortizeAccountId}
            onChange={(e) => setAmortizeAccountId(e.target.value)}
          >
            {data.contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} (Saldo Disponível: {formatCurrency(c.saldo)})
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#334155]/60">
            <Button variant="secondary" type="button" onClick={() => setAmortizingDebt(null)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Confirmar Amortização
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirm Debt Deletion */}
      <ConfirmModal
        isOpen={Boolean(deletingDebt)}
        onClose={() => setDeletingDebt(null)}
        onConfirm={() => {
          if (deletingDebt) {
            deleteDebt(deletingDebt.id);
          }
        }}
        title="Remover Dívida / Passivo"
        description={
          <div className="space-y-2">
            <p>
              Tem certeza que deseja remover o passivo{' '}
              <strong className="text-[#f8fafc]">"{deletingDebt?.nome}"</strong>?
            </p>
            <p className="text-[11px] text-[#ef4444]">
              Saldo devedor atual de {formatCurrency(deletingDebt?.saldoAtual)} ({deletingDebt?.credor}) deixará de ser computado.
            </p>
          </div>
        }
        confirmText="Sim, Remover Dívida"
      />
    </div>
  );
};
