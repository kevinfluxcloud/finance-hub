import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Edit2,
  LineChart,
  PieChart,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Investment, InvestmentCategory } from '../../types/finance';
import { calculateInvestmentYield } from '../../utils/calculations';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { Badge, Button, Card, ConfirmModal, Input, Modal, Select } from '../common/UIComponents';

export const InvestmentsView: React.FC = () => {
  const {
    data,
    totalInvestimentos,
    totalInvestido,
    rentabilidadeGeral,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    registerInvestmentAporte,
    registerInvestmentResgate,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [deletingInvestment, setDeletingInvestment] = useState<Investment | null>(null);

  // Aporte / Resgate modal states
  const [activeActionAsset, setActiveActionAsset] = useState<Investment | null>(null);
  const [actionType, setActionType] = useState<'aporte' | 'resgate'>('aporte');
  const [actionAmount, setActionAmount] = useState<number>(0);
  const [actionAccountId, setActionAccountId] = useState<string>(data.contas[0]?.id || '');

  // Form states
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [categoria, setCategoria] = useState<InvestmentCategory>('Renda Fixa');
  const [valorInvestido, setValorInvestido] = useState<number>(0);
  const [valorAtual, setValorAtual] = useState<number>(0);
  const [instituicao, setInstituicao] = useState('BTG Pactual');

  const resetForm = () => {
    setNome('');
    setCodigo('');
    setCategoria('Renda Fixa');
    setValorInvestido(0);
    setValorAtual(0);
    setInstituicao('BTG Pactual');
    setEditingInvestment(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inv: Investment) => {
    setEditingInvestment(inv);
    setNome(inv.nome);
    setCodigo(inv.codigo || '');
    setCategoria(inv.categoria);
    setValorInvestido(inv.valorInvestido);
    setValorAtual(inv.valorAtual);
    setInstituicao(inv.instituicao);
    setIsModalOpen(true);
  };

  const handleOpenAction = (inv: Investment, type: 'aporte' | 'resgate') => {
    setActiveActionAsset(inv);
    setActionType(type);
    setActionAmount(0);
    setActionAccountId(data.contas[0]?.id || '');
  };

  const handleExecuteAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeActionAsset || actionAmount <= 0) return;

    if (actionType === 'aporte') {
      registerInvestmentAporte(activeActionAsset.id, Number(actionAmount), actionAccountId);
    } else {
      registerInvestmentResgate(activeActionAsset.id, Number(actionAmount), actionAccountId);
    }

    setActiveActionAsset(null);
    setActionAmount(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || valorInvestido < 0) return;

    const actualVal = valorAtual > 0 ? valorAtual : valorInvestido;

    if (editingInvestment) {
      updateInvestment(editingInvestment.id, {
        nome,
        codigo,
        categoria,
        valorInvestido: Number(valorInvestido),
        valorAtual: Number(actualVal),
        instituicao,
      });
    } else {
      addInvestment({
        nome,
        codigo,
        categoria,
        valorInvestido: Number(valorInvestido),
        valorAtual: Number(actualVal),
        aportes: Number(valorInvestido),
        resgates: 0,
        dataInicio: new Date().toISOString().slice(0, 10),
        instituicao,
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  const lucroNominalTotal = totalInvestimentos - totalInvestido;

  // Breakdown by category
  const categoryBreakdown: Record<string, number> = {};
  data.investimentos.forEach((inv) => {
    categoryBreakdown[inv.categoria] = (categoryBreakdown[inv.categoria] || 0) + inv.valorAtual;
  });

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#334155]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#f8fafc]">
            Carteira & Gestão de Investimentos
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Rentabilidade real calculada via fórmula SPEC: ((Valor Atual - Valor Investido) / Valor Investido) * 100
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenAdd} icon={<Plus size={14} />}>
          Novo Ativo
        </Button>
      </div>

      {/* Top Portfolio Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#3b82f6]/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Valor de Mercado da Carteira
          </span>
          <p className="text-xl font-bold text-[#f8fafc] font-mono-numbers mt-1">
            {formatCurrency(totalInvestimentos)}
          </p>
          <span className="text-[10px] text-[#94a3b8]">
            {data.investimentos.length} posições ativas
          </span>
        </Card>

        <Card>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Total Efetivamente Aportado
          </span>
          <p className="text-xl font-bold text-[#94a3b8] font-mono-numbers mt-1">
            {formatCurrency(totalInvestido)}
          </p>
          <span className="text-[10px] text-[#94a3b8]">Custo de aquisição histórico</span>
        </Card>

        <Card>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Lucro / Prejuízo Nominal
          </span>
          <p
            className={`text-xl font-bold font-mono-numbers mt-1 ${
              lucroNominalTotal >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
            }`}
          >
            {lucroNominalTotal >= 0 ? '+' : ''}
            {formatCurrency(lucroNominalTotal)}
          </p>
          <span className="text-[10px] text-[#94a3b8]">Ganho de capital acumulado</span>
        </Card>

        <Card>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Rentabilidade Global da Carteira
          </span>
          <p
            className={`text-xl font-bold font-mono-numbers mt-1 ${
              rentabilidadeGeral >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
            }`}
          >
            {formatPercent(rentabilidadeGeral)}
          </p>
          <Badge variant={rentabilidadeGeral >= 0 ? 'bullish' : 'bearish'} className="mt-1">
            Yield Consolidado
          </Badge>
        </Card>
      </div>

      {/* Allocation breakdown progress bar */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#f8fafc] uppercase tracking-wide font-mono text-[11px]">
            Alocação por Classe de Ativos
          </span>
          <span className="text-[#94a3b8] font-mono-numbers">
            {formatCurrency(totalInvestimentos)}
          </span>
        </div>

        {/* Multi-segment bar */}
        <div className="w-full h-3 bg-[#0b1326] rounded-full overflow-hidden flex border border-[#334155]/60">
          {Object.entries(categoryBreakdown).map(([cat, val], idx) => {
            const pct = totalInvestimentos > 0 ? (val / totalInvestimentos) * 100 : 0;
            const colors = [
              'bg-[#3b82f6]',
              'bg-[#22c55e]',
              'bg-[#eab308]',
              'bg-[#a855f7]',
              'bg-[#ec4899]',
              'bg-[#06b6d4]',
            ];
            const color = colors[idx % colors.length];
            return (
              <div
                key={cat}
                style={{ width: `${pct}%` }}
                className={`${color} h-full transition-all`}
                title={`${cat}: ${formatCurrency(val)} (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
          {Object.entries(categoryBreakdown).map(([cat, val], idx) => {
            const pct = totalInvestimentos > 0 ? (val / totalInvestimentos) * 100 : 0;
            const dotColors = [
              'bg-[#3b82f6]',
              'bg-[#22c55e]',
              'bg-[#eab308]',
              'bg-[#a855f7]',
              'bg-[#ec4899]',
              'bg-[#06b6d4]',
            ];
            const dotColor = dotColors[idx % dotColors.length];
            return (
              <div key={cat} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                <span className="text-[#94a3b8]">{cat}:</span>
                <span className="font-bold text-[#f8fafc] font-mono-numbers">
                  {pct.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Assets Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#171f33] border-b border-[#334155] text-[#94a3b8] uppercase font-mono text-[10px]">
                <th className="py-3 px-4">Ativo / Código</th>
                <th className="py-3 px-4">Classe</th>
                <th className="py-3 px-4">Custódia</th>
                <th className="py-3 px-4 text-right">Valor Investido</th>
                <th className="py-3 px-4 text-right">Valor Atual</th>
                <th className="py-3 px-4 text-right">Lucro/Prejuízo</th>
                <th className="py-3 px-4 text-right">Rentabilidade (%)</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]/60">
              {data.investimentos.map((inv) => {
                const { rentabilidadePercent, lucroNominal } = calculateInvestmentYield(
                  inv.valorAtual,
                  inv.valorInvestido
                );
                const isPositive = lucroNominal >= 0;

                return (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#f8fafc]">{inv.nome}</span>
                      {inv.codigo && (
                        <span className="block text-[11px] font-mono text-[#3b82f6]">
                          {inv.codigo}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="accent" className="text-[10px]">
                        {inv.categoria}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-[#94a3b8]">{inv.instituicao}</td>
                    <td className="py-3 px-4 text-right font-mono-numbers text-[#94a3b8]">
                      {formatCurrency(inv.valorInvestido)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-numbers font-bold text-[#f8fafc]">
                      {formatCurrency(inv.valorAtual)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono-numbers font-semibold ${
                        isPositive ? 'text-[#22c55e]' : 'text-[#ef4444]'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {formatCurrency(lucroNominal)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant={isPositive ? 'bullish' : 'bearish'}>
                        {formatPercent(rentabilidadePercent)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenAction(inv, 'aporte')}
                          title="Fazer novo aporte"
                        >
                          + Aporte
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenAction(inv, 'resgate')}
                          title="Registrar resgate"
                        >
                          Resgate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(inv)}
                          icon={<Edit2 size={13} />}
                        >
                          {''}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeletingInvestment(inv)}
                          icon={<Trash2 size={13} />}
                        >
                          {''}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {data.investimentos.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#94a3b8] text-xs">
                    Nenhum investimento registrado. Clique em "+ Novo Ativo" para estruturar sua carteira.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Add/Edit Investment */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingInvestment ? 'Editar Ativo' : 'Novo Investimento'}
        subtitle="Cadastre ações, FIIs, títulos de renda fixa, cripto ou reserva"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome do Ativo"
            placeholder="Ex: Tesouro Selic 2029, WEG S.A., KNIP11..."
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Código / Ticker (Opcional)"
              placeholder="Ex: WEGE3, HGLG11, BTC..."
              isMono
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            />

            <Select
              label="Classe de Ativo"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as InvestmentCategory)}
            >
              <option value="Renda Fixa">Renda Fixa (CDB, Tesouro, LCI)</option>
              <option value="Ações Brasil">Ações Brasil (B3)</option>
              <option value="Fundos Imobiliários (FIIs)">Fundos Imobiliários (FIIs)</option>
              <option value="Internacional / BDRs">Internacional / BDRs</option>
              <option value="Criptoativos">Criptoativos</option>
              <option value="Reserva de Emergência">Reserva de Emergência</option>
              <option value="Outros">Outros</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Valor Investido (Aportado)"
              type="number"
              step="0.01"
              min="0.01"
              isMono
              value={valorInvestido || ''}
              onChange={(e) => setValorInvestido(parseFloat(e.target.value) || 0)}
              required
            />

            <Input
              label="Valor Atual de Mercado"
              type="number"
              step="0.01"
              min="0.01"
              isMono
              value={valorAtual || ''}
              onChange={(e) => setValorAtual(parseFloat(e.target.value) || 0)}
              helper="Deixe igual se for nova compra"
              required
            />
          </div>

          <Input
            label="Instituição Custodiante"
            placeholder="Ex: BTG Pactual, XP, Itaú Corretora, Binance..."
            value={instituicao}
            onChange={(e) => setInstituicao(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-[#334155]/60">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingInvestment ? 'Salvar Alterações' : 'Cadastrar Ativo'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Aporte / Resgate */}
      <Modal
        isOpen={Boolean(activeActionAsset)}
        onClose={() => setActiveActionAsset(null)}
        title={
          actionType === 'aporte'
            ? `Novo Aporte em ${activeActionAsset?.nome}`
            : `Resgate de ${activeActionAsset?.nome}`
        }
        subtitle={
          actionType === 'aporte'
            ? 'Adicione capital à posição e debite opcionalmente da conta corrente'
            : 'Resgate recursos da posição e credite opcionalmente na conta bancária'
        }
      >
        <form onSubmit={handleExecuteAction} className="space-y-4">
          <Input
            label={actionType === 'aporte' ? 'Valor do Aporte (R$)' : 'Valor do Resgate (R$)'}
            type="number"
            step="0.01"
            min="0.01"
            isMono
            value={actionAmount || ''}
            onChange={(e) => setActionAmount(parseFloat(e.target.value) || 0)}
            required
          />

          <Select
            label={actionType === 'aporte' ? 'Debitar da Conta:' : 'Creditar na Conta:'}
            value={actionAccountId}
            onChange={(e) => setActionAccountId(e.target.value)}
          >
            {data.contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} (Saldo Atual: {formatCurrency(c.saldo)})
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#334155]/60">
            <Button variant="secondary" type="button" onClick={() => setActiveActionAsset(null)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {actionType === 'aporte' ? 'Confirmar Aporte' : 'Confirmar Resgate'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirm Investment Deletion */}
      <ConfirmModal
        isOpen={Boolean(deletingInvestment)}
        onClose={() => setDeletingInvestment(null)}
        onConfirm={() => {
          if (deletingInvestment) {
            deleteInvestment(deletingInvestment.id);
          }
        }}
        title="Remover Ativo da Carteira"
        description={
          <div className="space-y-2">
            <p>
              Tem certeza que deseja remover o ativo{' '}
              <strong className="text-[#f8fafc]">"{deletingInvestment?.nome}"</strong> da sua carteira de investimentos?
            </p>
            <p className="text-[11px] text-[#ef4444]">
              Posição atual: {formatCurrency(deletingInvestment?.valorAtual)} ({deletingInvestment?.categoria}).
            </p>
          </div>
        }
        confirmText="Sim, Remover Ativo"
      />
    </div>
  );
};
