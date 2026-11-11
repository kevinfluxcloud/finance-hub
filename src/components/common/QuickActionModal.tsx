import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Plus,
  ShieldAlert,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import {
  ExpenseCategory,
  IncomeCategory,
  InvestmentCategory,
  PayoffStrategy,
} from '../../types/finance';
import { Button, Input, Modal, Select } from './UIComponents';

type ActionTab = 'receita' | 'despesa' | 'parcelamento' | 'investimento' | 'divida' | 'meta';

export const QuickActionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { data, selectedMonth, addIncome, addExpense, addInstallment, addInvestment, addDebt, addGoal } = useFinance();
  const [activeTab, setActiveTab] = useState<ActionTab>('receita');

  // Common Form States
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState<number>(0);
  const [dataLcto, setDataLcto] = useState(`${selectedMonth}-10`);
  const [contaId, setContaId] = useState(data.contas[0]?.id || '');

  // Specific States
  const [incomeCategory, setIncomeCategory] = useState<IncomeCategory>('Salário');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Moradia');
  const [recorrente, setRecorrente] = useState(false);
  const [status, setStatus] = useState<'recebido' | 'pago' | 'pendente'>('recebido');

  // Installment
  const [parcelasTotal, setParcelasTotal] = useState(10);
  const [parcelaAtual, setParcelaAtual] = useState(1);

  // Investment
  const [ticker, setTicker] = useState('');
  const [investmentCategory, setInvestmentCategory] = useState<InvestmentCategory>('Renda Fixa');
  const [instituicao, setInstituicao] = useState('BTG Pactual');

  // Debt
  const [credor, setCredor] = useState('');
  const [taxaJuros, setTaxaJuros] = useState(1.5);
  const [valorParcela, setValorParcela] = useState(0);

  // Goal
  const [prazoMeta, setPrazoMeta] = useState('2027-12-31');

  const resetAll = () => {
    setDescricao('');
    setValor(0);
    setDataLcto(`${selectedMonth}-10`);
    setContaId(data.contas[0]?.id || '');
    setIncomeCategory('Salário');
    setExpenseCategory('Moradia');
    setRecorrente(false);
    setStatus('recebido');
    setParcelasTotal(10);
    setParcelaAtual(1);
    setTicker('');
    setInvestmentCategory('Renda Fixa');
    setInstituicao('BTG Pactual');
    setCredor('');
    setTaxaJuros(1.5);
    setValorParcela(0);
    setPrazoMeta('2027-12-31');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) return;

    if (activeTab === 'receita') {
      addIncome({
        descricao,
        valor: Number(valor),
        data: dataLcto,
        contaId,
        categoria: incomeCategory,
        recorrente,
        status: status === 'pendente' ? 'pendente' : 'recebido',
      });
    } else if (activeTab === 'despesa') {
      addExpense({
        descricao,
        valor: Number(valor),
        data: dataLcto,
        contaId,
        categoria: expenseCategory,
        recorrente,
        status: status === 'pendente' ? 'pendente' : 'pago',
      });
    } else if (activeTab === 'parcelamento') {
      const vParcela = valorParcela > 0 ? valorParcela : valor / (parcelasTotal || 1);
      addInstallment({
        descricao,
        valorTotal: Number(valor),
        parcelasTotal: Number(parcelasTotal),
        parcelaAtual: Number(parcelaAtual),
        valorParcela: Number(vParcela),
        categoria: expenseCategory,
        contaId,
        dataInicio: dataLcto,
        status: parcelaAtual >= parcelasTotal ? 'concluido' : 'ativo',
      });
    } else if (activeTab === 'investimento') {
      addInvestment({
        nome: descricao,
        codigo: ticker,
        categoria: investmentCategory,
        valorInvestido: Number(valor),
        valorAtual: Number(valor),
        aportes: Number(valor),
        resgates: 0,
        dataInicio: dataLcto,
        instituicao,
      });
    } else if (activeTab === 'divida') {
      addDebt({
        nome: descricao,
        credor,
        saldoInicial: Number(valor),
        saldoAtual: Number(valor),
        taxaJurosMensal: Number(taxaJuros),
        valorParcela: Number(valorParcela),
        parcelasRestantes: Number(parcelasTotal),
        plano: 'avalanche',
        categoria: 'Financiamento',
      });
    } else if (activeTab === 'meta') {
      addGoal({
        titulo: descricao,
        valorAlvo: Number(valor),
        acumulado: 0,
        prazo: prazoMeta,
        categoria: 'Patrimônio',
        prioridade: 'alta',
        status: 'em_andamento',
        cor: '#3B82F6',
      });
    }

    resetAll();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Lançamento Rápido"
      subtitle="Selecione o tipo de registro financeiro que deseja criar"
    >
      {/* Tab Switcher */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-[#0b1326] p-1 rounded border border-[#334155]">
        <button
          type="button"
          onClick={() => {
            setActiveTab('receita');
            setStatus('recebido');
          }}
          className={`flex flex-col items-center justify-center p-2 rounded text-[11px] font-semibold transition-colors ${
            activeTab === 'receita'
              ? 'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40'
              : 'text-[#94a3b8] hover:text-[#f8fafc]'
          }`}
        >
          <ArrowDownLeft size={16} />
          <span>Receita</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('despesa');
            setStatus('pago');
          }}
          className={`flex flex-col items-center justify-center p-2 rounded text-[11px] font-semibold transition-colors ${
            activeTab === 'despesa'
              ? 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40'
              : 'text-[#94a3b8] hover:text-[#f8fafc]'
          }`}
        >
          <ArrowUpRight size={16} />
          <span>Despesa</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('parcelamento')}
          className={`flex flex-col items-center justify-center p-2 rounded text-[11px] font-semibold transition-colors ${
            activeTab === 'parcelamento'
              ? 'bg-[#3b82f6]/20 text-[#93c5fd] border border-[#3b82f6]/40'
              : 'text-[#94a3b8] hover:text-[#f8fafc]'
          }`}
        >
          <CreditCard size={16} />
          <span>Parcela</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('investimento')}
          className={`flex flex-col items-center justify-center p-2 rounded text-[11px] font-semibold transition-colors ${
            activeTab === 'investimento'
              ? 'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40'
              : 'text-[#94a3b8] hover:text-[#f8fafc]'
          }`}
        >
          <TrendingUp size={16} />
          <span>Ativo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('divida')}
          className={`flex flex-col items-center justify-center p-2 rounded text-[11px] font-semibold transition-colors ${
            activeTab === 'divida'
              ? 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40'
              : 'text-[#94a3b8] hover:text-[#f8fafc]'
          }`}
        >
          <ShieldAlert size={16} />
          <span>Dívida</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('meta')}
          className={`flex flex-col items-center justify-center p-2 rounded text-[11px] font-semibold transition-colors ${
            activeTab === 'meta'
              ? 'bg-[#a855f7]/20 text-[#d8b4fe] border border-[#a855f7]/40'
              : 'text-[#94a3b8] hover:text-[#f8fafc]'
          }`}
        >
          <Target size={16} />
          <span>Meta</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          label={
            activeTab === 'meta'
              ? 'Título da Meta'
              : activeTab === 'investimento'
              ? 'Nome do Ativo'
              : activeTab === 'divida'
              ? 'Nome do Passivo / Financiamento'
              : 'Descrição'
          }
          placeholder="Ex: Salário, Aluguel, MacBook Pro, WEG, Financiamento..."
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={activeTab === 'meta' ? 'Valor Alvo (R$)' : 'Valor (R$)'}
            type="number"
            step="0.01"
            min="0.01"
            isMono
            value={valor || ''}
            onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
            required
          />

          <Input
            label={activeTab === 'meta' ? 'Prazo da Meta' : 'Data do Registro'}
            type="date"
            isMono
            value={activeTab === 'meta' ? prazoMeta : dataLcto}
            onChange={(e) =>
              activeTab === 'meta' ? setPrazoMeta(e.target.value) : setDataLcto(e.target.value)
            }
            required
          />
        </div>

        {/* Dynamic Category / Account Fields */}
        {activeTab === 'receita' && (
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Categoria"
              value={incomeCategory}
              onChange={(e) => setIncomeCategory(e.target.value as any)}
            >
              <option value="Salário">Salário / Pró-Labore</option>
              <option value="Dividendos & JCP">Dividendos & JCP</option>
              <option value="Freelance / Consultoria">Freelance / Consultoria</option>
              <option value="Rendimentos Financeiros">Rendimentos Financeiros</option>
              <option value="Outros">Outros</option>
            </Select>

            <Select
              label="Conta de Depósito"
              value={contaId}
              onChange={(e) => setContaId(e.target.value)}
            >
              {data.contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </div>
        )}

        {activeTab === 'despesa' && (
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Categoria"
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value as any)}
            >
              <option value="Moradia">Moradia</option>
              <option value="Alimentação">Alimentação</option>
              <option value="Transporte">Transporte</option>
              <option value="Saúde & Bem-estar">Saúde & Bem-estar</option>
              <option value="Educação & Desenvolvimento">Educação</option>
              <option value="Lazer & Viagens">Lazer & Viagens</option>
              <option value="Assinaturas & Serviços">Assinaturas</option>
              <option value="Outros">Outros</option>
            </Select>

            <Select
              label="Conta de Débito"
              value={contaId}
              onChange={(e) => setContaId(e.target.value)}
            >
              {data.contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </div>
        )}

        {activeTab === 'parcelamento' && (
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Qtd Parcelas"
              type="number"
              min="1"
              isMono
              value={parcelasTotal}
              onChange={(e) => setParcelasTotal(parseInt(e.target.value, 10) || 1)}
              required
            />
            <Input
              label="Parcela Atual"
              type="number"
              min="1"
              isMono
              value={parcelaAtual}
              onChange={(e) => setParcelaAtual(parseInt(e.target.value, 10) || 1)}
              required
            />
            <Select
              label="Cartão / Conta"
              value={contaId}
              onChange={(e) => setContaId(e.target.value)}
            >
              {data.contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </div>
        )}

        {activeTab === 'investimento' && (
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Código / Ticker"
              placeholder="Ex: PETR4, HGLG11"
              isMono
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
            />
            <Select
              label="Classe"
              value={investmentCategory}
              onChange={(e) => setInvestmentCategory(e.target.value as any)}
            >
              <option value="Renda Fixa">Renda Fixa</option>
              <option value="Ações Brasil">Ações Brasil</option>
              <option value="Fundos Imobiliários (FIIs)">FIIs</option>
              <option value="Internacional / BDRs">Internacional</option>
              <option value="Criptoativos">Cripto</option>
              <option value="Reserva de Emergência">Reserva</option>
            </Select>
            <Input
              label="Custódia"
              value={instituicao}
              onChange={(e) => setInstituicao(e.target.value)}
              required
            />
          </div>
        )}

        {activeTab === 'divida' && (
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Credor"
              placeholder="Ex: Caixa, BTG..."
              value={credor}
              onChange={(e) => setCredor(e.target.value)}
              required
            />
            <Input
              label="Taxa (% a.m.)"
              type="number"
              step="0.01"
              isMono
              value={taxaJuros}
              onChange={(e) => setTaxaJuros(parseFloat(e.target.value) || 0)}
              required
            />
            <Input
              label="Parcela (R$)"
              type="number"
              step="0.01"
              isMono
              value={valorParcela || ''}
              onChange={(e) => setValorParcela(parseFloat(e.target.value) || 0)}
              required
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-[#334155]/60">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            Confirmar e Registrar
          </Button>
        </div>
      </form>
    </Modal>
  );
};
