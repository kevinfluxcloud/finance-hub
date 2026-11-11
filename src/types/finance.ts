export type AccountType = 'corrente' | 'poupanca' | 'investimento' | 'carteira';

export interface Account {
  id: string;
  nome: string;
  instituicao: string;
  saldo: number;
  tipo: AccountType;
  cor?: string;
  icone?: string;
}

export type TransactionType = 'receita' | 'despesa';

export type IncomeCategory = 
  | 'Salário' 
  | 'Dividendos & JCP' 
  | 'Pró-Labore' 
  | 'Freelance / Consultoria' 
  | 'Rendimentos Financeiros' 
  | 'Venda de Ativos' 
  | 'Outros';

export type ExpenseCategory = 
  | 'Moradia' 
  | 'Alimentação' 
  | 'Transporte' 
  | 'Saúde & Bem-estar' 
  | 'Educação & Desenvolvimento' 
  | 'Lazer & Viagens' 
  | 'Assinaturas & Serviços' 
  | 'Impostos & Taxas' 
  | 'Compras & Pessoal' 
  | 'Outros';

export interface Income {
  id: string;
  descricao: string;
  valor: number;
  data: string; // YYYY-MM-DD
  contaId: string;
  categoria: IncomeCategory;
  recorrente: boolean;
  status: 'recebido' | 'pendente';
  observacao?: string;
}

export interface Expense {
  id: string;
  descricao: string;
  valor: number;
  data: string; // YYYY-MM-DD
  contaId: string;
  categoria: ExpenseCategory;
  recorrente: boolean;
  status: 'pago' | 'pendente';
  observacao?: string;
}

export interface InstallmentPayment {
  numero: number; // 1, 2, ... parcelasTotal
  dataVencimento: string; // YYYY-MM-DD
  dataPagamento?: string; // YYYY-MM-DD (quando paguei)
  valorOriginal: number; // valor base da parcela
  valorPago?: number; // quanto foi pago
  antecipada: boolean; // se antecipei
  descontoEconomia?: number; // desconto ou economia ao antecipar
  status: 'pendente' | 'pago' | 'antecipado';
  contaId?: string;
  observacao?: string;
}

export interface Installment {
  id: string;
  descricao: string;
  valorTotal: number;
  parcelasTotal: number;
  parcelaAtual: number;
  valorParcela: number;
  categoria: ExpenseCategory;
  contaId: string;
  dataInicio: string; // YYYY-MM-DD
  status: 'ativo' | 'concluido';
  observacao?: string;
  historicoParcelas?: InstallmentPayment[];
}

export type DateFilterMode = 'mes' | 'ano' | 'intervalo' | 'tudo';

export interface DateFilterState {
  mode: DateFilterMode;
  year: number; // e.g. 2026
  month: number; // 1 to 12
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  label: string;
}

export type InvestmentCategory = 
  | 'Renda Fixa' 
  | 'Ações Brasil' 
  | 'Fundos Imobiliários (FIIs)' 
  | 'Internacional / BDRs' 
  | 'Criptoativos' 
  | 'Reserva de Emergência' 
  | 'Outros';

export interface InvestmentTransaction {
  id: string;
  data: string;
  tipo: 'aporte' | 'resgate' | 'dividendo';
  valor: number;
  observacao?: string;
}

export interface Investment {
  id: string;
  nome: string;
  codigo?: string; // e.g., PETR4, HGLG11, Tesouro Selic
  categoria: InvestmentCategory;
  valorInvestido: number;
  valorAtual: number;
  aportes: number; // total histórico de aportes adicionais
  resgates: number; // total histórico de resgates
  rentabilidade?: number; // percentual calculado
  historico?: InvestmentTransaction[];
  dataInicio: string;
  instituicao: string;
}

export type PayoffStrategy = 'bola_de_neve' | 'avalanche' | 'personalizado';

export interface Debt {
  id: string;
  nome: string; // e.g., Financiamento Imobiliário, Cartão de Crédito
  credor: string;
  saldoInicial: number;
  saldoAtual: number;
  taxaJurosMensal: number; // % ao mês
  valorParcela: number;
  parcelasRestantes: number;
  plano: PayoffStrategy;
  dataVencimento?: string;
  categoria?: 'Cartão' | 'Empréstimo' | 'Financiamento' | 'Outros';
}

export interface Goal {
  id: string;
  titulo: string;
  valorAlvo: number;
  acumulado: number;
  prazo: string; // YYYY-MM-DD
  categoria: string;
  prioridade: 'alta' | 'media' | 'baixa';
  status: 'em_andamento' | 'concluido';
  cor?: string;
}

export interface FinanceData {
  contas: Account[];
  receitas: Income[];
  despesas: Expense[];
  parcelamentos: Installment[];
  investimentos: Investment[];
  dividas: Debt[];
  metas: Goal[];
  configuracoes: {
    mesesReservaEmergencia: number; // padrão 6 meses
    moeda: string;
    estrategiaQuitacaoPadrao: PayoffStrategy;
  };
}
