import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Edit2,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Goal } from '../../types/finance';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge, Button, Card, ConfirmModal, Input, Modal, Select } from '../common/UIComponents';

export const GoalsView: React.FC = () => {
  const { data, addGoal, updateGoal, deleteGoal, contributeToGoal } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);

  // Aporte modal
  const [activeGoalForAporte, setActiveGoalForAporte] = useState<Goal | null>(null);
  const [aporteAmount, setAporteAmount] = useState<number>(0);
  const [aporteAccountId, setAporteAccountId] = useState<string>(data.contas[0]?.id || '');

  // Form states
  const [titulo, setTitulo] = useState('');
  const [valorAlvo, setValorAlvo] = useState<number>(0);
  const [acumulado, setAcumulado] = useState<number>(0);
  const [prazo, setPrazo] = useState('2027-12-31');
  const [categoria, setCategoria] = useState('Patrimônio');
  const [prioridade, setPrioridade] = useState<'alta' | 'media' | 'baixa'>('alta');
  const [cor, setCor] = useState('#3B82F6');

  const resetForm = () => {
    setTitulo('');
    setValorAlvo(0);
    setAcumulado(0);
    setPrazo('2027-12-31');
    setCategoria('Patrimônio');
    setPrioridade('alta');
    setCor('#3B82F6');
    setEditingGoal(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setTitulo(goal.titulo);
    setValorAlvo(goal.valorAlvo);
    setAcumulado(goal.acumulado);
    setPrazo(goal.prazo);
    setCategoria(goal.categoria);
    setPrioridade(goal.prioridade);
    setCor(goal.cor || '#3B82F6');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || valorAlvo <= 0) return;

    if (editingGoal) {
      updateGoal(editingGoal.id, {
        titulo,
        valorAlvo: Number(valorAlvo),
        acumulado: Number(acumulado),
        prazo,
        categoria,
        prioridade,
        cor,
        status: Number(acumulado) >= Number(valorAlvo) ? 'concluido' : 'em_andamento',
      });
    } else {
      addGoal({
        titulo,
        valorAlvo: Number(valorAlvo),
        acumulado: Number(acumulado),
        prazo,
        categoria,
        prioridade,
        cor,
        status: Number(acumulado) >= Number(valorAlvo) ? 'concluido' : 'em_andamento',
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleExecuteAporte = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoalForAporte || aporteAmount <= 0) return;
    contributeToGoal(activeGoalForAporte.id, Number(aporteAmount), aporteAccountId);
    setActiveGoalForAporte(null);
    setAporteAmount(0);
  };

  const totalAlvoMetas = data.metas.reduce((sum, m) => sum + m.valorAlvo, 0);
  const totalAcumuladoMetas = data.metas.reduce((sum, m) => sum + m.acumulado, 0);
  const totalConcluidas = data.metas.filter((m) => m.status === 'concluido' || m.acumulado >= m.valorAlvo).length;

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#334155]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#f8fafc]">
            Metas & Planejamento Financeiro
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Acompanhe o progresso de conquistas patrimoniais, prazos e aportes necessários
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenAdd} icon={<Plus size={14} />}>
          Nova Meta
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-[#3b82f6]/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Capital Acumulado em Metas
          </span>
          <p className="text-xl font-bold text-[#f8fafc] font-mono-numbers mt-1">
            {formatCurrency(totalAcumuladoMetas)}
          </p>
          <span className="text-[10px] text-[#22c55e]">
            {totalAlvoMetas > 0 ? ((totalAcumuladoMetas / totalAlvoMetas) * 100).toFixed(1) : 0}% do total almejado
          </span>
        </Card>

        <Card>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Valor Alvo Total das Metas
          </span>
          <p className="text-xl font-bold text-[#94a3b8] font-mono-numbers mt-1">
            {formatCurrency(totalAlvoMetas)}
          </p>
          <span className="text-[10px] text-[#94a3b8]">{data.metas.length} objetivos cadastrados</span>
        </Card>

        <Card className="border-[#22c55e]/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Metas Conquistadas
          </span>
          <p className="text-xl font-bold text-[#22c55e] font-mono-numbers mt-1">
            {totalConcluidas} de {data.metas.length}
          </p>
          <Badge variant="bullish" className="mt-1">
            Sucesso Financeiro
          </Badge>
        </Card>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.metas.map((goal) => {
          const progresso = Math.min(100, (goal.acumulado / (goal.valorAlvo || 1)) * 100);
          const isFinished = goal.status === 'concluido' || progresso >= 100;
          const falta = Math.max(0, goal.valorAlvo - goal.acumulado);

          // Calculate required monthly contribution to hit goal by deadline
          const deadline = new Date(goal.prazo);
          const now = new Date();
          const monthsLeft = Math.max(
            1,
            (deadline.getFullYear() - now.getFullYear()) * 12 +
              (deadline.getMonth() - now.getMonth())
          );
          const aporteMensalNecessario = falta > 0 ? falta / monthsLeft : 0;

          return (
            <Card
              key={goal.id}
              className={`hover:border-[#3b82f6] transition-all flex flex-col justify-between ${
                isFinished ? 'border-[#22c55e]/40 bg-gradient-to-br from-[#131b2e] to-[#0f1f1a]' : ''
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: `${goal.cor || '#3b82f6'}20`, borderColor: goal.cor || '#3b82f6' }}
                      className="w-10 h-10 rounded border flex items-center justify-center text-[#3b82f6]"
                    >
                      <Target size={20} style={{ color: goal.cor || '#3b82f6' }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#f8fafc]">{goal.titulo}</h3>
                      <p className="text-xs text-[#94a3b8]">
                        {goal.categoria} • Prazo: {formatDate(goal.prazo)}
                      </p>
                    </div>
                  </div>

                  <Badge variant={isFinished ? 'bullish' : 'accent'}>
                    {isFinished ? 'CONQUISTADA' : `${progresso.toFixed(0)}%`}
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex justify-between text-xs font-mono-numbers">
                    <span className="text-[#94a3b8]">Progresso:</span>
                    <span className="font-bold text-[#f8fafc]">{progresso.toFixed(1)}%</span>
                  </div>

                  <div className="w-full bg-[#0b1326] h-3 rounded-full overflow-hidden border border-[#334155]/60">
                    <div
                      style={{
                        width: `${progresso}%`,
                        backgroundColor: goal.cor || '#3b82f6',
                      }}
                      className="h-full rounded-full transition-all duration-500 shadow"
                    />
                  </div>

                  <div className="flex justify-between text-[11px] font-mono-numbers text-[#94a3b8] pt-1">
                    <span>Acumulado: {formatCurrency(goal.acumulado)}</span>
                    <span>Alvo: {formatCurrency(goal.valorAlvo)}</span>
                  </div>
                </div>

                {/* Financial telemetry details */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-[#0b1326] p-2.5 rounded border border-[#334155]/60">
                  <div>
                    <span className="text-[10px] text-[#94a3b8] uppercase font-mono block">
                      Falta para Atingir
                    </span>
                    <span
                      className={`font-bold font-mono-numbers ${
                        falta === 0 ? 'text-[#22c55e]' : 'text-[#f8fafc]'
                      }`}
                    >
                      {falta === 0 ? 'Concluída!' : formatCurrency(falta)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#94a3b8] uppercase font-mono block">
                      Aporte Mensal Sugerido
                    </span>
                    <span className="font-bold font-mono-numbers text-[#3b82f6]">
                      {falta === 0 ? 'R$ 0,00' : `${formatCurrency(aporteMensalNecessario)} / mês`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-[#334155]/60 flex items-center justify-between">
                <div>
                  {!isFinished && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setActiveGoalForAporte(goal);
                        setAporteAmount(0);
                      }}
                      icon={<Coins size={13} />}
                    >
                      Aportar na Meta
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(goal)}
                    icon={<Edit2 size={13} />}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeletingGoal(goal)}
                    icon={<Trash2 size={13} />}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {data.metas.length === 0 && (
          <div className="col-span-2 py-12 text-center text-xs text-[#94a3b8]">
            Nenhuma meta cadastrada. Defina seus objetivos financeiros e acompanhe o acúmulo de capital.
          </div>
        )}
      </div>

      {/* Modal: Add/Edit Goal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGoal ? 'Editar Meta' : 'Nova Meta Financeira'}
        subtitle="Defina o alvo, o capital acumulado atual e o prazo desejado"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Título do Objetivo"
            placeholder="Ex: Viagem Europa, Troca de Veículo, Imóvel..."
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Valor Alvo Final (R$)"
              type="number"
              step="0.01"
              min="0.01"
              isMono
              value={valorAlvo || ''}
              onChange={(e) => setValorAlvo(parseFloat(e.target.value) || 0)}
              required
            />

            <Input
              label="Valor Já Acumulado (R$)"
              type="number"
              step="0.01"
              isMono
              value={acumulado || ''}
              onChange={(e) => setAcumulado(parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Data Limite / Prazo"
              type="date"
              isMono
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              required
            />

            <Select
              label="Prioridade"
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value as any)}
            >
              <option value="alta">Alta Prioridade</option>
              <option value="media">Média Prioridade</option>
              <option value="baixa">Baixa Prioridade</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option value="Patrimônio">Patrimônio & Riqueza</option>
              <option value="Segurança">Segurança & Reserva</option>
              <option value="Lazer">Lazer & Viagens</option>
              <option value="Bens">Aquisição de Bens</option>
              <option value="Dívidas">Quitação de Passivos</option>
              <option value="Outros">Outros</option>
            </Select>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">
                Cor de Destaque
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={cor}
                  onChange={(e) => setCor(e.target.value)}
                  className="w-10 h-8 rounded bg-transparent cursor-pointer border border-[#334155]"
                />
                <span className="text-xs text-[#94a3b8] font-mono">{cor}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#334155]/60">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingGoal ? 'Salvar Alterações' : 'Criar Meta'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Aporte na Meta */}
      <Modal
        isOpen={Boolean(activeGoalForAporte)}
        onClose={() => setActiveGoalForAporte(null)}
        title={`Aporte na Meta: ${activeGoalForAporte?.titulo}`}
        subtitle="Adicione capital à meta e debite da conta bancária correspondente"
      >
        <form onSubmit={handleExecuteAporte} className="space-y-4">
          <Input
            label="Valor a Aportar (R$)"
            type="number"
            step="0.01"
            min="0.01"
            isMono
            value={aporteAmount || ''}
            onChange={(e) => setAporteAmount(parseFloat(e.target.value) || 0)}
            required
          />

          <Select
            label="Debitar da Conta Corrente:"
            value={aporteAccountId}
            onChange={(e) => setAporteAccountId(e.target.value)}
          >
            {data.contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} (Disponível: {formatCurrency(c.saldo)})
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#334155]/60">
            <Button variant="secondary" type="button" onClick={() => setActiveGoalForAporte(null)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Confirmar Aporte
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirm Goal Deletion */}
      <ConfirmModal
        isOpen={Boolean(deletingGoal)}
        onClose={() => setDeletingGoal(null)}
        onConfirm={() => {
          if (deletingGoal) {
            deleteGoal(deletingGoal.id);
          }
        }}
        title="Excluir Meta Financeira"
        description={
          <div className="space-y-2">
            <p>
              Tem certeza que deseja excluir a meta{' '}
              <strong className="text-[#f8fafc]">"{deletingGoal?.titulo}"</strong>?
            </p>
            <p className="text-[11px] text-[#94a3b8]">
              Alvo: {formatCurrency(deletingGoal?.valorAlvo)} • Acumulado: {formatCurrency(deletingGoal?.acumulado)}.
            </p>
          </div>
        }
        confirmText="Sim, Excluir Meta"
      />
    </div>
  );
};
