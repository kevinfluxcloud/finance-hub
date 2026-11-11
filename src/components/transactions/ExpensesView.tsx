import React, { useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Edit2,
  Filter,
  Plus,
  Repeat,
  Trash2,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Expense, ExpenseCategory } from '../../types/finance';
import { formatCurrency, formatDate, getMonthLabel } from '../../utils/formatters';
import { Badge, Button, Card, ConfirmModal, Input, Modal, Select } from '../common/UIComponents';

export const ExpensesView: React.FC = () => {
  const {
    data,
    selectedMonth,
    dateFilter,
    isDateInActiveFilter,
    addExpense,
    updateExpense,
    deleteExpense,
    toggleExpenseStatus,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterOnlyMonth, setFilterOnlyMonth] = useState<boolean>(true);

  // Form states
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState<number>(0);
  const [dataDespesa, setDataDespesa] = useState(`${selectedMonth}-10`);
  const [contaId, setContaId] = useState(data.contas[0]?.id || '');
  const [categoria, setCategoria] = useState<ExpenseCategory>('Moradia');
  const [recorrente, setRecorrente] = useState(false);
  const [status, setStatus] = useState<'pago' | 'pendente'>('pago');
  const [observacao, setObservacao] = useState('');

  const resetForm = () => {
    setDescricao('');
    setValor(0);
    setDataDespesa(`${selectedMonth}-10`);
    setContaId(data.contas[0]?.id || '');
    setCategoria('Moradia');
    setRecorrente(false);
    setStatus('pago');
    setObservacao('');
    setEditingExpense(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setDescricao(exp.descricao);
    setValor(exp.valor);
    setDataDespesa(exp.data);
    setContaId(exp.contaId);
    setCategoria(exp.categoria);
    setRecorrente(exp.recorrente);
    setStatus(exp.status);
    setObservacao(exp.observacao || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim() || valor <= 0) return;

    if (editingExpense) {
      updateExpense(editingExpense.id, {
        descricao,
        valor: Number(valor),
        data: dataDespesa,
        contaId,
        categoria,
        recorrente,
        status,
        observacao,
      });
    } else {
      addExpense({
        descricao,
        valor: Number(valor),
        data: dataDespesa,
        contaId,
        categoria,
        recorrente,
        status,
        observacao,
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  // Filter application
  const filteredExpenses = data.despesas.filter((d) => {
    if (filterOnlyMonth && !isDateInActiveFilter(d.data)) return false;
    if (filterCategory !== 'all' && d.categoria !== filterCategory) return false;
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    return true;
  });

  const totalFiltered = filteredExpenses.reduce((sum, d) => sum + d.valor, 0);
  const totalPago = filteredExpenses
    .filter((d) => d.status === 'pago')
    .reduce((sum, d) => sum + d.valor, 0);
  const totalPendente = filteredExpenses
    .filter((d) => d.status === 'pendente')
    .reduce((sum, d) => sum + d.valor, 0);

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#334155]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#f8fafc]">
            Saídas & Despesas Operacionais
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Controle analítico de despesas fixas, variáveis e custos de manutenção do estilo de vida
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenAdd} icon={<Plus size={14} />}>
          Nova Despesa
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-[#ef4444]/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Total em Despesas Filtradas
          </span>
          <p className="text-xl font-bold text-[#ef4444] font-mono-numbers mt-1">
            -{formatCurrency(totalFiltered)}
          </p>
          <span className="text-[10px] text-[#94a3b8]">
            {filteredExpenses.length} lançamentos registrados
          </span>
        </Card>

        <Card>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Efetivamente Pago
          </span>
          <p className="text-xl font-bold text-[#f8fafc] font-mono-numbers mt-1">
            {formatCurrency(totalPago)}
          </p>
          <Badge variant="bullish" className="mt-1">
            Liquidado em Conta
          </Badge>
        </Card>

        <Card>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Pendente / A Vencer
          </span>
          <p className="text-xl font-bold text-[#eab308] font-mono-numbers mt-1">
            {formatCurrency(totalPendente)}
          </p>
          <Badge variant="warning" className="mt-1">
            Exige Provisão de Caixa
          </Badge>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-[#94a3b8]">
              <Filter size={14} />
              <span className="font-semibold uppercase text-[10px]">Filtros:</span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-[#0b1326] px-2.5 py-1 rounded border border-[#334155]">
              <input
                type="checkbox"
                checked={filterOnlyMonth}
                onChange={(e) => setFilterOnlyMonth(e.target.checked)}
                className="rounded border-[#334155] text-[#3b82f6]"
              />
              <span className="text-xs text-[#f8fafc]">
                Apenas {dateFilter.label}
              </span>
            </label>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1 text-xs text-[#f8fafc]"
            >
              <option value="all">Todos os Status</option>
              <option value="pago">Apenas Pagas</option>
              <option value="pendente">Apenas Pendentes</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1 text-xs text-[#f8fafc]"
            >
              <option value="all">Todas as Categorias</option>
              <option value="Moradia">Moradia & Habitação</option>
              <option value="Alimentação">Alimentação</option>
              <option value="Transporte">Transporte & Veículo</option>
              <option value="Saúde & Bem-estar">Saúde & Bem-estar</option>
              <option value="Educação & Desenvolvimento">Educação</option>
              <option value="Lazer & Viagens">Lazer & Viagens</option>
              <option value="Assinaturas & Serviços">Assinaturas</option>
              <option value="Impostos & Taxas">Impostos</option>
              <option value="Compras & Pessoal">Compras</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <span className="text-[11px] font-mono-numbers text-[#94a3b8]">
            Exibindo {filteredExpenses.length} lançamentos
          </span>
        </div>
      </Card>

      {/* Data Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#171f33] border-b border-[#334155] text-[#94a3b8] uppercase font-mono text-[10px]">
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Data / Vencimento</th>
                <th className="py-3 px-4">Conta Débito</th>
                <th className="py-3 px-4">Recorrente</th>
                <th className="py-3 px-4 text-right">Valor (R$)</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]/60">
              {filteredExpenses.map((exp) => {
                const targetAccount = data.contas.find((c) => c.id === exp.contaId);
                return (
                  <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleExpenseStatus(exp.id)}
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                          exp.status === 'pago'
                            ? 'bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/40'
                            : 'bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/40'
                        }`}
                        title="Alternar entre Pago e Pendente"
                      >
                        {exp.status === 'pago' ? (
                          <>
                            <CheckCircle2 size={12} />
                            PAGO
                          </>
                        ) : (
                          <>
                            <Clock size={12} />
                            PENDENTE
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#f8fafc]">
                      {exp.descricao}
                      {exp.observacao && (
                        <span className="block text-[10px] text-[#94a3b8] font-normal">
                          {exp.observacao}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#dae2fd]">
                      <Badge variant="neutral" className="text-[10px]">
                        {exp.categoria}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono-numbers text-[#94a3b8]">
                      {formatDate(exp.data)}
                    </td>
                    <td className="py-3 px-4 text-[#dae2fd]">
                      {targetAccount?.nome || 'Não definida'}
                    </td>
                    <td className="py-3 px-4">
                      {exp.recorrente ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#3b82f6]">
                          <Repeat size={11} /> Recorrente
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#94a3b8]">Eventual</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold font-mono-numbers text-[#ef4444]">
                      -{formatCurrency(exp.valor)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(exp)}
                          icon={<Edit2 size={13} />}
                          title="Editar despesa"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeletingExpense(exp)}
                          icon={<Trash2 size={13} />}
                          title="Excluir despesa"
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#94a3b8] text-xs">
                    Nenhuma despesa encontrada para os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Add/Edit Expense */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
        subtitle="Registre uma despesa e vincule à conta bancária para controle de saída"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Descrição da Despesa"
            placeholder="Ex: Condomínio, Supermercado, Seguro..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Valor (R$)"
              type="number"
              step="0.01"
              min="0.01"
              isMono
              value={valor || ''}
              onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
              required
            />

            <Input
              label="Data de Vencimento / Pagamento"
              type="date"
              isMono
              value={dataDespesa}
              onChange={(e) => setDataDespesa(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as ExpenseCategory)}
            >
              <option value="Moradia">Moradia & Habitação</option>
              <option value="Alimentação">Alimentação & Mercado</option>
              <option value="Transporte">Transporte & Veículos</option>
              <option value="Saúde & Bem-estar">Saúde & Bem-estar</option>
              <option value="Educação & Desenvolvimento">Educação</option>
              <option value="Lazer & Viagens">Lazer & Viagens</option>
              <option value="Assinaturas & Serviços">Assinaturas</option>
              <option value="Impostos & Taxas">Impostos & Tributos</option>
              <option value="Compras & Pessoal">Compras & Pessoal</option>
              <option value="Outros">Outros</option>
            </Select>

            <Select
              label="Conta de Saída (Débito)"
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

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'pago' | 'pendente')}
            >
              <option value="pago">Pago (Efetivado)</option>
              <option value="pendente">Pendente (A Pagar)</option>
            </Select>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={recorrente}
                  onChange={(e) => setRecorrente(e.target.checked)}
                  className="rounded text-[#3b82f6]"
                />
                <span className="text-xs text-[#f8fafc] font-medium">
                  Despesa Recorrente Mensal
                </span>
              </label>
            </div>
          </div>

          <Input
            label="Observação (Opcional)"
            placeholder="Ex: Nota fiscal, número do documento..."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-[#334155]/60">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingExpense ? 'Salvar Alterações' : 'Cadastrar Despesa'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirm Deletion */}
      <ConfirmModal
        isOpen={Boolean(deletingExpense)}
        onClose={() => setDeletingExpense(null)}
        onConfirm={() => {
          if (deletingExpense) {
            deleteExpense(deletingExpense.id);
          }
        }}
        title="Excluir Despesa"
        description={
          <div className="space-y-2">
            <p>
              Tem certeza que deseja excluir a despesa{' '}
              <strong className="text-[#f8fafc]">"{deletingExpense?.descricao}"</strong>?
            </p>
            {deletingExpense?.status === 'pago' && (
              <p className="text-[11px] text-[#22c55e]">
                Aviso: O valor de {formatCurrency(deletingExpense?.valor)} será estornado e creditado de volta na conta correspondente.
              </p>
            )}
          </div>
        }
        confirmText="Sim, Excluir Despesa"
      />
    </div>
  );
};
