import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  DollarSign,
  Edit2,
  Layers,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { ExpenseCategory, Installment, InstallmentPayment } from '../../types/finance';
import { ensureInstallmentHistory } from '../../utils/calculations';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge, Button, Card, ConfirmModal, Input, Modal, Select } from '../common/UIComponents';

export const InstallmentsView: React.FC = () => {
  const {
    data,
    addInstallment,
    updateInstallment,
    deleteInstallment,
    paySingleParcela,
    unpaySingleParcela,
  } = useFinance();

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null);
  const [deletingInstallment, setDeletingInstallment] = useState<Installment | null>(null);

  // Per-parcel payment modal state ("Quando paguei / se antecipei / quanto foi")
  const [paymentModalData, setPaymentModalData] = useState<{
    installment: Installment;
    parcelaNumero: number;
    dataVencimento: string;
    valorOriginal: number;
    dataPagamento: string;
    valorPago: number;
    antecipada: boolean;
    contaId: string;
    observacao: string;
  } | null>(null);

  // Undo payment confirmation modal
  const [undoPaymentData, setUndoPaymentData] = useState<{
    installmentId: string;
    installmentName: string;
    parcelaNumero: number;
    valorPago: number;
  } | null>(null);

  // Expandable cards view state (keep track of which cards are expanded)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Filter state for installment list
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ativos' | 'concluidos'>('todos');

  // Form states for Add/Edit installment
  const [descricao, setDescricao] = useState('');
  const [valorTotal, setValorTotal] = useState<number>(0);
  const [parcelasTotal, setParcelasTotal] = useState<number>(10);
  const [parcelaAtual, setParcelaAtual] = useState<number>(1);
  const [valorParcela, setValorParcela] = useState<number>(0);
  const [categoria, setCategoria] = useState<ExpenseCategory>('Compras & Pessoal');
  const [contaId, setContaId] = useState(data.contas[0]?.id || '');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0, 10));
  const [observacao, setObservacao] = useState('');

  const toggleExpandCard = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const resetForm = () => {
    setDescricao('');
    setValorTotal(0);
    setParcelasTotal(10);
    setParcelaAtual(1);
    setValorParcela(0);
    setCategoria('Compras & Pessoal');
    setContaId(data.contas[0]?.id || '');
    setDataInicio(new Date().toISOString().slice(0, 10));
    setObservacao('');
    setEditingInstallment(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inst: Installment) => {
    setEditingInstallment(inst);
    setDescricao(inst.descricao);
    setValorTotal(inst.valorTotal);
    setParcelasTotal(inst.parcelasTotal);
    setParcelaAtual(inst.parcelaAtual);
    setValorParcela(inst.valorParcela);
    setCategoria(inst.categoria);
    setContaId(inst.contaId);
    setDataInicio(inst.dataInicio);
    setObservacao(inst.observacao || '');
    setIsModalOpen(true);
  };

  const handleTotalChange = (val: number) => {
    setValorTotal(val);
    if (parcelasTotal > 0) {
      setValorParcela(parseFloat((val / parcelasTotal).toFixed(2)));
    }
  };

  const handleParcelasTotalChange = (num: number) => {
    setParcelasTotal(num);
    if (num > 0 && valorTotal > 0) {
      setValorParcela(parseFloat((valorTotal / num).toFixed(2)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim() || valorTotal <= 0 || parcelasTotal <= 0) return;

    const calcValorParcela = valorParcela > 0 ? valorParcela : valorTotal / parcelasTotal;

    if (editingInstallment) {
      updateInstallment(editingInstallment.id, {
        descricao,
        valorTotal: Number(valorTotal),
        parcelasTotal: Number(parcelasTotal),
        parcelaAtual: Number(parcelaAtual),
        valorParcela: Number(calcValorParcela),
        categoria,
        contaId,
        dataInicio,
        observacao,
        status: Number(parcelaAtual) >= Number(parcelasTotal) ? 'concluido' : 'ativo',
      });
    } else {
      addInstallment({
        descricao,
        valorTotal: Number(valorTotal),
        parcelasTotal: Number(parcelasTotal),
        parcelaAtual: Number(parcelaAtual),
        valorParcela: Number(calcValorParcela),
        categoria,
        contaId,
        dataInicio,
        observacao,
        status: Number(parcelaAtual) >= Number(parcelasTotal) ? 'concluido' : 'ativo',
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  // Open the payment modal for a specific installment and parcel
  const handleOpenPayParcela = (inst: Installment, targetParcelNumber?: number) => {
    const normalized = ensureInstallmentHistory(inst);
    const history = normalized.historicoParcelas || [];

    // Find requested or first unpaid parcel
    let targetP = targetParcelNumber
      ? history.find((p) => p.numero === targetParcelNumber)
      : history.find((p) => p.status === 'pendente');

    if (!targetP) {
      targetP = history[history.length - 1];
    }

    if (!targetP) return;

    const todayStr = new Date().toISOString().slice(0, 10);
    const isEarly = targetP.dataVencimento ? todayStr < targetP.dataVencimento : false;

    setPaymentModalData({
      installment: inst,
      parcelaNumero: targetP.numero,
      dataVencimento: targetP.dataVencimento,
      valorOriginal: targetP.valorOriginal || inst.valorParcela,
      dataPagamento: targetP.dataPagamento || todayStr,
      valorPago: targetP.valorPago || targetP.valorOriginal || inst.valorParcela,
      antecipada: targetP.antecipada !== undefined ? targetP.antecipada : isEarly,
      contaId: targetP.contaId || inst.contaId || data.contas[0]?.id || '',
      observacao: targetP.observacao || '',
    });
  };

  const handleConfirmPayParcela = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalData) return;

    const { installment, parcelaNumero, dataPagamento, valorPago, antecipada, contaId, observacao } =
      paymentModalData;

    paySingleParcela(installment.id, parcelaNumero, {
      dataPagamento: dataPagamento || new Date().toISOString().slice(0, 10),
      valorPago: Number(valorPago),
      antecipada: Boolean(antecipada),
      contaId,
      observacao,
    });

    setPaymentModalData(null);
  };

  // Global calculations across installments
  const parcelasAtivas = data.parcelamentos.filter((p) => p.status === 'ativo');
  const totalComprometimentoMensal = parcelasAtivas.reduce((sum, p) => sum + p.valorParcela, 0);

  // Total balance left to pay considering already paid parcels
  const saldoDevedorParcelas = data.parcelamentos.reduce((sum, inst) => {
    const normalized = ensureInstallmentHistory(inst);
    const history = normalized.historicoParcelas || [];
    const pendingTotal = history
      .filter((p) => p.status === 'pendente')
      .reduce((sub, p) => sub + (p.valorOriginal || inst.valorParcela), 0);
    return sum + pendingTotal;
  }, 0);

  // Total saved through early antecipation discounts
  const totalEconomiaAntecipacoes = data.parcelamentos.reduce((sum, inst) => {
    const normalized = ensureInstallmentHistory(inst);
    const history = normalized.historicoParcelas || [];
    const savings = history.reduce((sub, p) => sub + (p.descontoEconomia || 0), 0);
    return sum + savings;
  }, 0);

  // Total parcels antecipated across portfolio
  const totalParcelasAntecipadas = data.parcelamentos.reduce((sum, inst) => {
    const normalized = ensureInstallmentHistory(inst);
    const history = normalized.historicoParcelas || [];
    const count = history.filter((p) => p.antecipada || p.status === 'antecipado').length;
    return sum + count;
  }, 0);

  const filteredInstallments = data.parcelamentos.filter((inst) => {
    if (filterStatus === 'ativos') return inst.status === 'ativo';
    if (filterStatus === 'concluidos') return inst.status === 'concluido';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#334155]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#f8fafc]">
            Acompanhamento de Parcelamentos & Antecipações
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Monitore quando cada parcela foi paga, antecipações estratégicas e descontos obtidos por adiantamento
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center bg-[#0b1326] border border-[#334155] rounded p-0.5 text-xs">
            <button
              onClick={() => setFilterStatus('todos')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer font-medium ${
                filterStatus === 'todos'
                  ? 'bg-[#3b82f6] text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-[#f8fafc]'
              }`}
            >
              Todos ({data.parcelamentos.length})
            </button>
            <button
              onClick={() => setFilterStatus('ativos')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer font-medium ${
                filterStatus === 'ativos'
                  ? 'bg-[#3b82f6] text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-[#f8fafc]'
              }`}
            >
              Ativos ({parcelasAtivas.length})
            </button>
            <button
              onClick={() => setFilterStatus('concluidos')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer font-medium ${
                filterStatus === 'concluidos'
                  ? 'bg-[#3b82f6] text-white shadow-sm'
                  : 'text-[#94a3b8] hover:text-[#f8fafc]'
              }`}
            >
              Quitados ({data.parcelamentos.length - parcelasAtivas.length})
            </button>
          </div>

          <Button variant="primary" size="sm" onClick={handleOpenAdd} icon={<Plus size={14} />}>
            Novo Parcelamento
          </Button>
        </div>
      </div>

      {/* Overview Metric Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#3b82f6]/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Comprometimento Mensal
          </span>
          <p className="text-xl font-bold text-[#ef4444] font-mono-numbers mt-1">
            -{formatCurrency(totalComprometimentoMensal)} / mês
          </p>
          <span className="text-[10px] text-[#94a3b8]">
            {parcelasAtivas.length} compras ativas no cartão
          </span>
        </Card>

        <Card>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Saldo Restante a Amortizar
          </span>
          <p className="text-xl font-bold text-[#f8fafc] font-mono-numbers mt-1">
            {formatCurrency(saldoDevedorParcelas)}
          </p>
          <span className="text-[10px] text-[#94a3b8]">Total em parcelas pendentes</span>
        </Card>

        <Card className="border-[#22c55e]/40 bg-[#131b2e]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
              Economia em Antecipações
            </span>
            <Badge variant="bullish">
              <Sparkles size={11} className="inline mr-0.5" />
              {totalParcelasAntecipadas} Antecipadas
            </Badge>
          </div>
          <p className="text-xl font-bold text-[#22c55e] font-mono-numbers mt-1">
            +{formatCurrency(totalEconomiaAntecipacoes)}
          </p>
          <span className="text-[10px] text-[#94a3b8]">
            Economizados com descontos de quitação antecipada
          </span>
        </Card>

        <Card>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Parcelamentos Concluídos
          </span>
          <p className="text-xl font-bold text-[#22c55e] font-mono-numbers mt-1">
            {data.parcelamentos.filter((p) => p.status === 'concluido').length} quitados
          </p>
          <Badge variant="bullish" className="mt-1">
            Fluxo Liberado
          </Badge>
        </Card>
      </div>

      {/* Installment Cards */}
      <div className="space-y-4">
        {filteredInstallments.map((inst) => {
          const normalized = ensureInstallmentHistory(inst);
          const history = normalized.historicoParcelas || [];
          const paidParcels = history.filter((p) => p.status === 'pago' || p.status === 'antecipado');
          const isFinished = inst.status === 'concluido' || paidParcels.length >= inst.parcelasTotal;
          const progresso = Math.min(100, (paidParcels.length / (inst.parcelasTotal || 1)) * 100);

          // Sum paid amounts and savings for this specific installment
          const totalEfetivamentePago = paidParcels.reduce(
            (sum, p) => sum + (p.valorPago !== undefined ? p.valorPago : p.valorOriginal),
            0
          );
          const economiaItem = history.reduce((sum, p) => sum + (p.descontoEconomia || 0), 0);
          const antecipadasCount = history.filter((p) => p.antecipada || p.status === 'antecipado').length;
          const valorRestante = Math.max(0, inst.valorTotal - totalEfetivamentePago - economiaItem);
          const targetAccount = data.contas.find((c) => c.id === inst.contaId);

          const isExpanded = Boolean(expandedCards[inst.id]);

          // Next pending parcel to be paid
          const nextPending = history.find((p) => p.status === 'pendente');

          return (
            <Card
              key={inst.id}
              className={`hover:border-[#3b82f6]/70 transition-all ${
                isFinished ? 'opacity-85 bg-[#0e1627]' : ''
              }`}
            >
              <div>
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-[#3b82f6]/10 border border-[#3b82f6]/30 flex items-center justify-center text-[#3b82f6] shrink-0">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-[#f8fafc]">{inst.descricao}</h3>
                        {antecipadasCount > 0 && (
                          <Badge variant="accent" className="text-[10px]">
                            <Zap size={10} className="inline mr-0.5 text-[#3b82f6]" />
                            {antecipadasCount} antecipada{antecipadasCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {economiaItem > 0 && (
                          <Badge variant="bullish" className="text-[10px]">
                            Economia: {formatCurrency(economiaItem)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[#94a3b8] mt-0.5">
                        {inst.categoria} • {targetAccount?.nome || 'Cartão'} • 1ª Parcela em{' '}
                        {formatDate(inst.dataInicio)}
                        {inst.observacao ? ` • ${inst.observacao}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={isFinished ? 'bullish' : 'accent'}>
                      {isFinished
                        ? 'TOTALMENTE QUITADO'
                        : `${paidParcels.length} / ${inst.parcelasTotal} PAGAS`}
                    </Badge>
                  </div>
                </div>

                {/* Progress bar & Financial Metrics */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs font-mono-numbers">
                    <span className="text-[#94a3b8]">Progresso de Amortização:</span>
                    <span className="font-bold text-[#f8fafc]">
                      {paidParcels.length} de {inst.parcelasTotal} parcelas ({progresso.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#0b1326] h-2.5 rounded-full overflow-hidden border border-[#334155]/60">
                    <div
                      style={{ width: `${progresso}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFinished ? 'bg-[#22c55e]' : 'bg-[#3b82f6]'
                      }`}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between text-[11px] font-mono-numbers text-[#94a3b8] pt-1">
                    <span>
                      Total Efetivamente Pago:{' '}
                      <strong className="text-[#f8fafc]">
                        {formatCurrency(totalEfetivamentePago)}
                      </strong>
                    </span>
                    {economiaItem > 0 && (
                      <span className="text-[#22c55e]">
                        Descontos Obtidos: +{formatCurrency(economiaItem)}
                      </span>
                    )}
                    <span className={valorRestante > 0 ? 'text-[#ef4444]' : 'text-[#22c55e]'}>
                      Restante: {formatCurrency(valorRestante)}
                    </span>
                  </div>
                </div>

                {/* Quick Info Grid */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-[#0b1326] p-2.5 rounded border border-[#334155]/60">
                  <div>
                    <span className="text-[10px] text-[#94a3b8] uppercase font-mono block">
                      Valor da Parcela
                    </span>
                    <span className="font-bold font-mono-numbers text-[#f8fafc]">
                      {formatCurrency(inst.valorParcela)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#94a3b8] uppercase font-mono block">
                      Valor Total
                    </span>
                    <span className="font-bold font-mono-numbers text-[#f8fafc]">
                      {formatCurrency(inst.valorTotal)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#94a3b8] uppercase font-mono block">
                      Próximo Vencimento
                    </span>
                    <span className="font-bold font-mono-numbers text-[#dae2fd]">
                      {nextPending ? formatDate(nextPending.dataVencimento) : 'Quitado'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#94a3b8] uppercase font-mono block">
                      Último Pagamento
                    </span>
                    <span className="font-bold font-mono-numbers text-[#dae2fd]">
                      {paidParcels.length > 0 && paidParcels[paidParcels.length - 1].dataPagamento
                        ? formatDate(paidParcels[paidParcels.length - 1].dataPagamento!)
                        : '-'}
                    </span>
                  </div>
                </div>

                {/* Card Control Bar */}
                <div className="pt-3 mt-3 border-t border-[#334155]/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!isFinished && nextPending && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenPayParcela(inst, nextPending.numero)}
                        icon={<CheckCircle2 size={13} />}
                      >
                        Pagar / Antecipar Parcela #{nextPending.numero}
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toggleExpandCard(inst.id)}
                      icon={isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    >
                      {isExpanded
                        ? 'Ocultar Detalhamento das Parcelas'
                        : `Ver Cronograma (${paidParcels.length}/${inst.parcelasTotal})`}
                    </Button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(inst)}
                      icon={<Edit2 size={13} />}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeletingInstallment(inst)}
                      icon={<Trash2 size={13} />}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>

                {/* EXPANDABLE PARCEL HISTORY & EARLY PAYOFF TABLE */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[#334155] animate-in fade-in duration-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers size={14} className="text-[#3b82f6]" />
                        <h4 className="text-xs font-bold text-[#f8fafc] uppercase tracking-wider font-mono">
                          Histórico Detalhado Parcela a Parcela
                        </h4>
                      </div>
                      <span className="text-[11px] text-[#94a3b8]">
                        Clique em "Pagar / Antecipar" para registrar data, valor e desconto
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-[#334155] rounded">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#171f33] text-[#94a3b8] uppercase font-mono text-[10px] border-b border-[#334155]">
                          <tr>
                            <th className="py-2.5 px-3"># Parcela</th>
                            <th className="py-2.5 px-3">Vencimento Previsto</th>
                            <th className="py-2.5 px-3">Quando Paguei (Data)</th>
                            <th className="py-2.5 px-3">Valor Original</th>
                            <th className="py-2.5 px-3">Quanto Foi (Pago)</th>
                            <th className="py-2.5 px-3">Antecipada?</th>
                            <th className="py-2.5 px-3">Economia / Desconto</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#334155]/60 bg-[#0b1326]/60 font-mono-numbers">
                          {history.map((parcela) => {
                            const isPaid = parcela.status === 'pago' || parcela.status === 'antecipado';
                            const isEarly = parcela.antecipada || parcela.status === 'antecipado';

                            return (
                              <tr
                                key={parcela.numero}
                                className={`hover:bg-[#1e293b]/40 transition-colors ${
                                  isPaid ? 'bg-[#131b2e]/30' : ''
                                }`}
                              >
                                <td className="py-2.5 px-3 font-bold text-[#f8fafc]">
                                  Parcela {parcela.numero} de {inst.parcelasTotal}
                                </td>

                                <td className="py-2.5 px-3 text-[#94a3b8]">
                                  {formatDate(parcela.dataVencimento)}
                                </td>

                                <td className="py-2.5 px-3">
                                  {parcela.dataPagamento ? (
                                    <span className="text-[#f8fafc] font-semibold">
                                      {formatDate(parcela.dataPagamento)}
                                    </span>
                                  ) : (
                                    <span className="text-[#64748b] italic">Não paga</span>
                                  )}
                                </td>

                                <td className="py-2.5 px-3 text-[#dae2fd]">
                                  {formatCurrency(parcela.valorOriginal || inst.valorParcela)}
                                </td>

                                <td className="py-2.5 px-3">
                                  {parcela.valorPago !== undefined ? (
                                    <span className="font-bold text-[#f8fafc]">
                                      {formatCurrency(parcela.valorPago)}
                                    </span>
                                  ) : (
                                    <span className="text-[#64748b]">-</span>
                                  )}
                                </td>

                                <td className="py-2.5 px-3">
                                  {isEarly ? (
                                    <Badge variant="bullish" className="text-[10px]">
                                      <Zap size={10} className="inline mr-0.5" />
                                      Sim
                                    </Badge>
                                  ) : isPaid ? (
                                    <span className="text-[#94a3b8]">Não</span>
                                  ) : (
                                    <span className="text-[#64748b]">-</span>
                                  )}
                                </td>

                                <td className="py-2.5 px-3">
                                  {(parcela.descontoEconomia || 0) > 0 ? (
                                    <span className="text-[#22c55e] font-bold">
                                      +{formatCurrency(parcela.descontoEconomia)}
                                    </span>
                                  ) : (
                                    <span className="text-[#64748b]">-</span>
                                  )}
                                </td>

                                <td className="py-2.5 px-3">
                                  {parcela.status === 'antecipado' ? (
                                    <Badge variant="bullish">Antecipado</Badge>
                                  ) : parcela.status === 'pago' ? (
                                    <Badge variant="accent">Pago</Badge>
                                  ) : (
                                    <Badge variant="neutral">Pendente</Badge>
                                  )}
                                </td>

                                <td className="py-2.5 px-3 text-right">
                                  {isPaid ? (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenPayParcela(inst, parcela.numero)}
                                        className="text-[11px] text-[#3b82f6] hover:underline cursor-pointer"
                                        title="Editar dados deste pagamento"
                                      >
                                        Editar
                                      </button>
                                      <span className="text-[#334155]">|</span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setUndoPaymentData({
                                            installmentId: inst.id,
                                            installmentName: inst.descricao,
                                            parcelaNumero: parcela.numero,
                                            valorPago: parcela.valorPago || parcela.valorOriginal,
                                          })
                                        }
                                        className="text-[11px] text-[#ef4444] hover:underline cursor-pointer"
                                        title="Desfazer e retornar para pendente"
                                      >
                                        Desfazer
                                      </button>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => handleOpenPayParcela(inst, parcela.numero)}
                                    >
                                      Pagar / Antecipar
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {filteredInstallments.length === 0 && (
          <div className="py-12 text-center text-xs text-[#94a3b8] bg-[#131b2e] border border-[#334155] rounded">
            Nenhum parcelamento encontrado para este filtro.
          </div>
        )}
      </div>

      {/* MODAL: REGISTRAR PAGAMENTO / ANTECIPAÇÃO DE PARCELA */}
      {paymentModalData && (
        <Modal
          isOpen={Boolean(paymentModalData)}
          onClose={() => setPaymentModalData(null)}
          title={`Pagamento: Parcela #${paymentModalData.parcelaNumero}`}
          subtitle={`"${paymentModalData.installment.descricao}" • Vencimento: ${formatDate(
            paymentModalData.dataVencimento
          )}`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleConfirmPayParcela} className="space-y-4">
            {/* Parcela Selector within modal if needed */}
            <div className="grid grid-cols-2 gap-3 bg-[#0b1326] p-3 rounded border border-[#334155]">
              <div>
                <span className="text-[10px] text-[#94a3b8] uppercase font-mono block">
                  Vencimento Original
                </span>
                <span className="text-sm font-bold font-mono-numbers text-[#f8fafc]">
                  {formatDate(paymentModalData.dataVencimento)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#94a3b8] uppercase font-mono block">
                  Valor Base da Parcela
                </span>
                <span className="text-sm font-bold font-mono-numbers text-[#3b82f6]">
                  {formatCurrency(paymentModalData.valorOriginal)}
                </span>
              </div>
            </div>

            {/* Quando paguei (Data do Pagamento) */}
            <Input
              label="Quando você pagou esta parcela? (Data do Pagamento)"
              type="date"
              isMono
              value={paymentModalData.dataPagamento}
              onChange={(e) =>
                setPaymentModalData({ ...paymentModalData, dataPagamento: e.target.value })
              }
              required
            />

            {/* Se antecipei (Checkbox) */}
            <div className="flex items-center justify-between p-3 bg-[#1e293b]/60 border border-[#334155] rounded">
              <div className="space-y-0.5">
                <label
                  htmlFor="antecipadaCheck"
                  className="text-xs font-bold text-[#f8fafc] cursor-pointer flex items-center gap-1.5"
                >
                  <Zap size={14} className="text-[#3b82f6]" />
                  Esta parcela foi antecipada?
                </label>
                <p className="text-[11px] text-[#94a3b8]">
                  Marque se você adiantou o pagamento antes da fatura fechar ou para obter desconto
                </p>
              </div>
              <input
                id="antecipadaCheck"
                type="checkbox"
                checked={paymentModalData.antecipada}
                onChange={(e) =>
                  setPaymentModalData({ ...paymentModalData, antecipada: e.target.checked })
                }
                className="w-4 h-4 text-[#3b82f6] rounded border-[#334155] focus:ring-[#3b82f6] cursor-pointer"
              />
            </div>

            {/* Quanto foi (Valor Efetivamente Pago) */}
            <div>
              <Input
                label="Quanto foi pago efetivamente? (R$)"
                type="number"
                step="0.01"
                min="0.01"
                isMono
                value={paymentModalData.valorPago || ''}
                onChange={(e) =>
                  setPaymentModalData({
                    ...paymentModalData,
                    valorPago: parseFloat(e.target.value) || 0,
                  })
                }
                required
                helper="Se obteve desconto na antecipação (ex: app Nubank), digite o valor com desconto aqui"
              />

              {/* Discount / Economy calculation preview */}
              {paymentModalData.valorPago > 0 && (
                <div className="mt-2">
                  {paymentModalData.valorPago < paymentModalData.valorOriginal ? (
                    <div className="p-2.5 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded text-xs text-[#22c55e] flex items-center gap-2">
                      <Sparkles size={16} className="shrink-0" />
                      <div>
                        <span className="font-bold">Economia obtida na antecipação: </span>
                        <span className="font-mono-numbers font-bold">
                          {formatCurrency(paymentModalData.valorOriginal - paymentModalData.valorPago)}
                        </span>{' '}
                        (
                        {(
                          ((paymentModalData.valorOriginal - paymentModalData.valorPago) /
                            paymentModalData.valorOriginal) *
                          100
                        ).toFixed(1)}
                        % de desconto)
                      </div>
                    </div>
                  ) : paymentModalData.valorPago > paymentModalData.valorOriginal ? (
                    <div className="p-2.5 bg-[#eab308]/10 border border-[#eab308]/30 rounded text-xs text-[#facc15] flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      <div>
                        <span className="font-bold">Acréscimo registrado: </span>
                        <span className="font-mono-numbers">
                          +{formatCurrency(paymentModalData.valorPago - paymentModalData.valorOriginal)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#94a3b8]">
                      Valor pago igual ao valor nominal previsto.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Conta de Débito */}
            <Select
              label="Conta ou Cartão Utilizado para Pagamento"
              value={paymentModalData.contaId}
              onChange={(e) =>
                setPaymentModalData({ ...paymentModalData, contaId: e.target.value })
              }
            >
              {data.contas.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.nome} ({acc.instituicao}) — Saldo: {formatCurrency(acc.saldo)}
                </option>
              ))}
            </Select>

            {/* Observações */}
            <Input
              label="Observações da Parcela (Opcional)"
              placeholder="Ex: Antecipada pelo app Nubank com desconto dinâmico"
              value={paymentModalData.observacao}
              onChange={(e) =>
                setPaymentModalData({ ...paymentModalData, observacao: e.target.value })
              }
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-[#334155]/60">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setPaymentModalData(null)}
              >
                Cancelar
              </Button>
              <Button variant="primary" type="submit" icon={<Check size={14} />}>
                Confirmar Pagamento da Parcela
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: DESFAZER PAGAMENTO */}
      {undoPaymentData && (
        <ConfirmModal
          isOpen={Boolean(undoPaymentData)}
          onClose={() => setUndoPaymentData(null)}
          onConfirm={() => {
            unpaySingleParcela(undoPaymentData.installmentId, undoPaymentData.parcelaNumero);
            setUndoPaymentData(null);
          }}
          title="Desfazer Pagamento de Parcela"
          description={
            <div className="space-y-2">
              <p>
                Deseja estornar o pagamento da <strong>Parcela #{undoPaymentData.parcelaNumero}</strong>{' '}
                do parcelamento "{undoPaymentData.installmentName}"?
              </p>
              <p className="text-[11px] text-[#94a3b8]">
                A parcela voltará ao status <strong className="text-[#facc15]">Pendente</strong> e o
                valor de {formatCurrency(undoPaymentData.valorPago)} será creditado de volta na conta.
              </p>
            </div>
          }
          confirmText="Sim, Desfazer Pagamento"
          variant="danger"
        />
      )}

      {/* Modal: Add/Edit Installment */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingInstallment ? 'Editar Parcelamento' : 'Novo Parcelamento'}
        subtitle="Monitore compras a prazo e acompanhe a amortização parcela a parcela"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Descrição do Produto / Serviço"
            placeholder="Ex: iPhone 16 Pro Max, Sofá Retrátil, Seguro do Carro..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Valor Total (R$)"
              type="number"
              step="0.01"
              min="0.01"
              isMono
              value={valorTotal || ''}
              onChange={(e) => handleTotalChange(parseFloat(e.target.value) || 0)}
              required
            />

            <Input
              label="Total de Parcelas"
              type="number"
              min="1"
              max="120"
              isMono
              value={parcelasTotal}
              onChange={(e) => handleParcelasTotalChange(parseInt(e.target.value, 10) || 1)}
              required
            />

            <Input
              label="Parcela Atual"
              type="number"
              min="0"
              max={parcelasTotal}
              isMono
              value={parcelaAtual}
              onChange={(e) => setParcelaAtual(parseInt(e.target.value, 10) || 0)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Valor de Cada Parcela (R$)"
              type="number"
              step="0.01"
              isMono
              value={valorParcela || ''}
              onChange={(e) => setValorParcela(parseFloat(e.target.value) || 0)}
              helper="Calculado automaticamente"
            />

            <Input
              label="Data da 1ª Parcela"
              type="date"
              isMono
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as ExpenseCategory)}
            >
              <option value="Compras & Pessoal">Compras & Pessoal</option>
              <option value="Educação & Desenvolvimento">Educação & Tecnologia</option>
              <option value="Transporte">Transporte / Seguro</option>
              <option value="Moradia">Moradia & Móveis</option>
              <option value="Saúde & Bem-estar">Saúde</option>
              <option value="Lazer & Viagens">Lazer & Viagens</option>
              <option value="Outros">Outros</option>
            </Select>

            <Select
              label="Cartão / Conta de Débito Padrão"
              value={contaId}
              onChange={(e) => setContaId(e.target.value)}
            >
              {data.contas.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.nome} ({acc.instituicao})
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Observação (Opcional)"
            placeholder="Ex: Comprado na Black Friday sem juros..."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-[#334155]/60">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingInstallment ? 'Salvar Alterações' : 'Cadastrar Parcelamento'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirm Installment Deletion */}
      <ConfirmModal
        isOpen={Boolean(deletingInstallment)}
        onClose={() => setDeletingInstallment(null)}
        onConfirm={() => {
          if (deletingInstallment) {
            deleteInstallment(deletingInstallment.id);
          }
        }}
        title="Excluir Parcelamento"
        description={
          <div className="space-y-2">
            <p>
              Tem certeza que deseja remover o parcelamento{' '}
              <strong className="text-[#f8fafc]">"{deletingInstallment?.descricao}"</strong>?
            </p>
            <p className="text-[11px] text-[#94a3b8]">
              Parcela atual: {deletingInstallment?.parcelaAtual}/{deletingInstallment?.parcelasTotal} (
              {formatCurrency(deletingInstallment?.valorParcela)}/mês).
            </p>
          </div>
        }
        confirmText="Sim, Excluir Parcelamento"
      />
    </div>
  );
};
