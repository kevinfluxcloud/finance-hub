import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Banknote,
  Edit2,
  Landmark,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Account, AccountType } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';
import { Badge, Button, Card, CardHeader, ConfirmModal, Input, Modal, Select } from '../common/UIComponents';

export const AccountsView: React.FC = () => {
  const { data, addAccount, updateAccount, deleteAccount, transferFunds } = useFinance();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [instituicao, setInstituicao] = useState('');
  const [saldo, setSaldo] = useState<number>(0);
  const [tipo, setTipo] = useState<AccountType>('corrente');
  const [cor, setCor] = useState('#3B82F6');

  // Transfer states
  const [sourceAccountId, setSourceAccountId] = useState(data.contas[0]?.id || '');
  const [targetAccountId, setTargetAccountId] = useState(data.contas[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState<number>(0);

  const resetForm = () => {
    setNome('');
    setInstituicao('');
    setSaldo(0);
    setTipo('corrente');
    setCor('#3B82F6');
    setEditingAccount(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setNome(acc.nome);
    setInstituicao(acc.instituicao);
    setSaldo(acc.saldo);
    setTipo(acc.tipo);
    setCor(acc.cor || '#3B82F6');
    setIsAddModalOpen(true);
  };

  const handleSubmitAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    if (editingAccount) {
      updateAccount(editingAccount.id, {
        nome,
        instituicao,
        saldo: Number(saldo),
        tipo,
        cor,
      });
    } else {
      addAccount({
        nome,
        instituicao,
        saldo: Number(saldo),
        tipo,
        cor,
      });
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferAmount <= 0 || sourceAccountId === targetAccountId) return;
    transferFunds(sourceAccountId, targetAccountId, Number(transferAmount));
    setIsTransferModalOpen(false);
    setTransferAmount(0);
  };

  const totalSaldo = data.contas.reduce((sum, c) => sum + c.saldo, 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#334155]/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#f8fafc]">
            Gestão de Contas & Saldos
          </h1>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Administração de contas bancárias, corretoras, reservas e carteiras de liquidez
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsTransferModalOpen(true)}
            icon={<ArrowLeftRight size={14} className="text-[#3b82f6]" />}
          >
            Transferência entre Contas
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            icon={<Plus size={14} />}
          >
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Overview Metric Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-[#131b2e] to-[#1e293b]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Saldo Consolidado em Contas
          </span>
          <p className="text-xl font-bold text-[#f8fafc] font-mono-numbers mt-1">
            {formatCurrency(totalSaldo)}
          </p>
          <span className="text-[11px] text-[#22c55e] mt-1 block">
            {data.contas.length} contas monitoradas ativas
          </span>
        </Card>

        <Card>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Maior Concentração de Caixa
          </span>
          {(() => {
            const topAcc = [...data.contas].sort((a, b) => b.saldo - a.saldo)[0];
            return (
              <>
                <p className="text-sm font-bold text-[#f8fafc] mt-1 truncate">
                  {topAcc?.nome || 'Nenhuma'}
                </p>
                <p className="text-xs font-mono-numbers text-[#94a3b8]">
                  {formatCurrency(topAcc?.saldo || 0)} (
                  {totalSaldo > 0 ? (((topAcc?.saldo || 0) / totalSaldo) * 100).toFixed(1) : 0}%)
                </p>
              </>
            );
          })()}
        </Card>

        <Card>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] font-mono">
            Liquidez Disponível para Emergência
          </span>
          <p className="text-sm font-bold text-[#eab308] font-mono-numbers mt-1">
            {formatCurrency(
              data.contas
                .filter((c) => c.tipo === 'poupanca' || c.nome.toLowerCase().includes('reserva'))
                .reduce((s, c) => s + c.saldo, 0)
            )}
          </p>
          <span className="text-[10px] text-[#94a3b8]">Pronta resposta / D+0</span>
        </Card>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.contas.map((acc) => (
          <Card
            key={acc.id}
            className="hover:border-[#3b82f6] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    style={{ backgroundColor: `${acc.cor || '#3b82f6'}25`, borderColor: acc.cor || '#3b82f6' }}
                    className="w-10 h-10 rounded border flex items-center justify-center text-white"
                  >
                    {acc.tipo === 'investimento' ? (
                      <Landmark size={20} style={{ color: acc.cor || '#3b82f6' }} />
                    ) : acc.tipo === 'carteira' ? (
                      <Banknote size={20} style={{ color: acc.cor || '#3b82f6' }} />
                    ) : (
                      <Wallet size={20} style={{ color: acc.cor || '#3b82f6' }} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#f8fafc]">{acc.nome}</h3>
                    <p className="text-xs text-[#94a3b8]">{acc.instituicao}</p>
                  </div>
                </div>

                <Badge variant={acc.saldo >= 0 ? 'bullish' : 'bearish'} className="text-[10px]">
                  {acc.tipo.toUpperCase()}
                </Badge>
              </div>

              <div className="mt-5 space-y-1">
                <span className="text-[10px] text-[#94a3b8] uppercase font-mono tracking-wider">
                  Saldo Atual
                </span>
                <p
                  className={`text-xl font-bold font-mono-numbers ${
                    acc.saldo >= 0 ? 'text-[#f8fafc]' : 'text-[#ef4444]'
                  }`}
                >
                  {formatCurrency(acc.saldo)}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#334155]/60 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenEdit(acc)}
                icon={<Edit2 size={13} />}
              >
                Editar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeletingAccount(acc)}
                icon={<Trash2 size={13} />}
              >
                Excluir
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal: Add/Edit Account */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingAccount ? 'Editar Conta' : 'Nova Conta'}
        subtitle="Cadastre ou atualize os parâmetros da conta bancária ou carteira"
      >
        <form onSubmit={handleSubmitAccount} className="space-y-4">
          <Input
            label="Nome da Conta"
            placeholder="Ex: Nubank Principal, Itaú Personnalité..."
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />

          <Input
            label="Instituição / Banco"
            placeholder="Ex: Nubank, Itaú, BTG, Santander, Carteira..."
            value={instituicao}
            onChange={(e) => setInstituicao(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Saldo Atual (R$)"
              type="number"
              step="0.01"
              isMono
              value={saldo}
              onChange={(e) => setSaldo(parseFloat(e.target.value) || 0)}
              required
            />

            <Select
              label="Tipo de Conta"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as AccountType)}
            >
              <option value="corrente">Conta Corrente</option>
              <option value="poupanca">Poupança</option>
              <option value="investimento">Corretora / Investimentos</option>
              <option value="carteira">Carteira / Espécie</option>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">
              Cor de Identificação
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="w-10 h-8 rounded bg-transparent cursor-pointer border border-[#334155]"
              />
              <span className="text-xs text-[#94a3b8] font-mono">{cor}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#334155]/60">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingAccount ? 'Salvar Alterações' : 'Criar Conta'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Transfer Between Accounts */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Transferência entre Contas"
        subtitle="Mova saldo entre suas contas sem impactar o cálculo de receitas/despesas"
      >
        <form onSubmit={handleTransfer} className="space-y-4">
          <Select
            label="Conta de Origem (Debitar)"
            value={sourceAccountId}
            onChange={(e) => setSourceAccountId(e.target.value)}
          >
            {data.contas.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.nome} (Saldo: {formatCurrency(acc.saldo)})
              </option>
            ))}
          </Select>

          <Select
            label="Conta de Destino (Creditar)"
            value={targetAccountId}
            onChange={(e) => setTargetAccountId(e.target.value)}
          >
            {data.contas.map((acc) => (
              <option key={acc.id} value={acc.id} disabled={acc.id === sourceAccountId}>
                {acc.nome} (Saldo: {formatCurrency(acc.saldo)})
              </option>
            ))}
          </Select>

          <Input
            label="Valor a Transferir (R$)"
            type="number"
            step="0.01"
            min="0.01"
            isMono
            value={transferAmount || ''}
            onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
            required
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-[#334155]/60">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Confirmar Transferência
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirm Account Deletion */}
      <ConfirmModal
        isOpen={Boolean(deletingAccount)}
        onClose={() => setDeletingAccount(null)}
        onConfirm={() => {
          if (deletingAccount) {
            deleteAccount(deletingAccount.id);
          }
        }}
        title="Excluir Conta"
        description={
          <div className="space-y-2">
            <p>
              Tem certeza que deseja excluir a conta{' '}
              <strong className="text-[#f8fafc]">"{deletingAccount?.nome}"</strong>?
            </p>
            <p className="text-[11px] text-[#ef4444]">
              Saldo atual de {formatCurrency(deletingAccount?.saldo)} deixará de ser contabilizado no patrimônio líquido.
            </p>
          </div>
        }
        confirmText="Sim, Excluir Conta"
      />
    </div>
  );
};
