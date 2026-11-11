import React, { useState } from 'react';
import {
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  Edit2,
  Filter,
  Plus,
  Repeat,
  Trash2,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Income, IncomeCategory } from '../../types/finance';
import { formatCurrency, formatDate, getMonthLabel } from '../../utils/formatters';
import { Badge, Button, Card, ConfirmModal, Input, Modal, Select } from '../common/UIComponents';

export const IncomesView: React.FC = () => {
  const {
    data,
    selectedMonth,
    dateFilter,
    isDateInActiveFilter,
    addIncome,
    updateIncome,
    deleteIncome,
    toggleIncomeStatus,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [deletingIncome, setDeletingIncome] = useState<Income | null>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterOnlyMonth, setFilterOnlyMonth] = useState<boolean>(true);

  // Form states
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState<number>(0);
  const [dataReceita, setDataReceita] = useState(`${selectedMonth}-05`);
  const [contaId, setContaId] = useState(data.contas[0]?.id || '');
  const [categoria, setCategoria] = useState<IncomeCategory>('Salário');
  const [recorrente, setRecorrente] = useState(true);
  const [status, setStatus] = useState<'recebido' | 'pendente'>('recebido');
  const [observacao, setObservacao] = useState('');

  const resetForm = () => {
    setDescricao('');
    setValor(0);
    setDataReceita(`${selectedMonth}-05`);
    setContaId(data.contas[0]?.id || '');
    setCategoria('Salário');
    setRecorrente(false);
    setStatus('recebido');
    setObservacao('');
    setEditingIncome(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inc: Income) => {
    setEditingIncome(inc);
    setDescricao(inc.descricao);
    setValor(inc.valor);
    setDataReceita(inc.data);
    setContaId(inc.contaId);
    setCategoria(inc.categoria);
    setRecorrente(inc.recorrente);
    setStatus(inc.status);
    setObservacao(inc.observacao || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim() || valor <= 0) return;

    if (editingIncome) {
      updateIncome(editingIncome.id, {
        descricao,
        valor: Number(valor),
        data: dataReceita,
        contaId,
        categoria,
        recorrente,
        status,
        observacao,
      });
    } else {
      addIncome({
        descricao,
        valor: Number(valor),
        data: dataReceita,
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
  const filteredIncomes = data.receitas.filter((r) => {
    if (filterOnlyMonth && !isDateInActiveFilter(r.data)) return false;
    if (filterCategory !== 'all' && r.categoria !== filterCategory) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  const totalFiltered = filteredIncomes.reduce((sum, r) => sum + r.valor, 0);
  const totalRecebido = filteredIncomes
    .filter((r) => r.status === 'recebido')
    .reduce((sum, r) => sum + r.valor, 0);
  const totalPendente = filteredIncomes
    .filter((r) => r.status === 'pendente')
    .reduce((sum, r) => sum + r.valor, 0);

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#334155]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#f8fafc]">
            Entradas & Receitas Operacionais
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Gestão de salários, pró-labore, proventos de investimentos e receitas extraordinárias
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenAdd} icon={<Plus size={14} />}>
          Nova Receita
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-[#22c55e]/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Total em Receitas Filtradas
          </span>
          <p className="text-xl font-bold text-[#22c55e] font-mono-numbers mt-1">
            +{formatCurrency(totalFiltered)}
          </p>
          <span className="text-[10px] text-[#94a3b8]">
            {filteredIncomes.length} registros listados
          </span>
        </Card>

        <Card>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Recebido em Caixa
          </span>
          <p className="text-xl font-bold text-[#f8fafc] font-mono-numbers mt-1">
            {formatCurrency(totalRecebido)}
          </p>
          <Badge variant="bullish" className="mt-1">
            Conciliado
          </Badge>
        </Card>

        <Card>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Pendente de Recebimento
          </span>
          <p className="text-xl font-bold text-[#eab308] font-mono-numbers mt-1">
            {formatCurrency(totalPendente)}
          </p>
          <Badge variant="warning" className="mt-1">
            Aguardando compensação
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
              <option value="recebido">Apenas Recebidos</option>
              <option value="pendente">Apenas Pendentes</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1 text-xs text-[#f8fafc]"
            >
              <option value="all">Todas as Categorias</option>
              <option value="Salário">Salário / Pró-Labore</option>
              <option value="Dividendos & JCP">Dividendos & JCP</option>
              <option value="Freelance / Consultoria">Freelance / Consultoria</option>
              <option value="Rendimentos Financeiros">Rendimentos Financeiros</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <span className="text-[11px] font-mono-numbers text-[#94a3b8]">
            Exibindo {filteredIncomes.length} lançamentos
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
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Conta Vinculada</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4 text-right">Valor (R$)</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]/60">
              {filteredIncomes.map((inc) => {
                const targetAccount = data.contas.find((c) => c.id === inc.contaId);
                return (
                  <tr key={inc.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleIncomeStatus(inc.id)}
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                          inc.status === 'recebido'
                            ? 'bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/40'
                            : 'bg-[#eab308]/15 text-[#facc15] border-[#eab308]/40'
                        }`}
                        title="Clique para alternar o status"
                      >
                        {inc.status === 'recebido' ? (
                          <>
                            <CheckCircle2 size={12} />
                            RECEBIDO
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
                      {inc.descricao}
                      {inc.observacao && (
                        <span className="block text-[10px] text-[#94a3b8] font-normal">
                          {inc.observacao}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#dae2fd]">
                      <Badge variant="accent" className="text-[10px]">
                        {inc.categoria}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono-numbers text-[#94a3b8]">
                      {formatDate(inc.data)}
                    </td>
                    <td className="py-3 px-4 text-[#dae2fd]">
                      {targetAccount?.nome || 'Conta não vinculada'}
                    </td>
                    <td className="py-3 px-4">
                      {inc.recorrente ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#3b82f6]">
                          <Repeat size={11} /> Recorrente
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#94a3b8]">Única</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold font-mono-numbers text-[#22c55e]">
                      +{formatCurrency(inc.valor)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(inc)}
                          icon={<Edit2 size={13} />}
                          title="Editar receita"
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeletingIncome(inc)}
                          icon={<Trash2 size={13} />}
                          title="Excluir receita"
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredIncomes.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#94a3b8] text-xs">
                    Nenhuma receita encontrada para os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Add/Edit Income */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIncome ? 'Editar Receita' : 'Nova Receita'}
        subtitle="Registre uma entrada financeira única ou recorrente"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Descrição"
            placeholder="Ex: Salário Mensal, Bônus, Dividendos FIIs..."
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
              label="Data de Recebimento"
              type="date"
              isMono
              value={dataReceita}
              onChange={(e) => setDataReceita(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as IncomeCategory)}
            >
              <option value="Salário">Salário</option>
              <option value="Dividendos & JCP">Dividendos & JCP</option>
              <option value="Pró-Labore">Pró-Labore</option>
              <option value="Freelance / Consultoria">Freelance / Consultoria</option>
              <option value="Rendimentos Financeiros">Rendimentos Financeiros</option>
              <option value="Venda de Ativos">Venda de Ativos</option>
              <option value="Outros">Outros</option>
            </Select>

            <Select
              label="Conta de Depósito"
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
              onChange={(e) => setStatus(e.target.value as 'recebido' | 'pendente')}
            >
              <option value="recebido">Recebido (Compensado)</option>
              <option value="pendente">Pendente (A Compensar)</option>
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
                  Receita Recorrente Mensal
                </span>
              </label>
            </div>
          </div>

          <Input
            label="Observação (Opcional)"
            placeholder="Detalhes ou anotações..."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-[#334155]/60">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingIncome ? 'Salvar Alterações' : 'Cadastrar Receita'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirm Deletion */}
      <ConfirmModal
        isOpen={Boolean(deletingIncome)}
        onClose={() => setDeletingIncome(null)}
        onConfirm={() => {
          if (deletingIncome) {
            deleteIncome(deletingIncome.id);
          }
        }}
        title="Excluir Receita"
        description={
          <div className="space-y-2">
            <p>
              Tem certeza que deseja excluir a receita{' '}
              <strong className="text-[#f8fafc]">"{deletingIncome?.descricao}"</strong>?
            </p>
            {deletingIncome?.status === 'recebido' && (
              <p className="text-[11px] text-[#ef4444]">
                Aviso: O valor de {formatCurrency(deletingIncome?.valor)} será automaticamente estornado do saldo da conta correspondente.
              </p>
            )}
          </div>
        }
        confirmText="Sim, Excluir Receita"
      />
    </div>
  );
};
