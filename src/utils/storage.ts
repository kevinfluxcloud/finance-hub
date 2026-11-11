import * as XLSX from 'xlsx';
import { FinanceData, Installment } from '../types/finance';
import { ensureInstallmentHistory } from './calculations';

const STORAGE_KEY = 'pfh_personal_finance_hub_data_v1';

export const INITIAL_DATA: FinanceData = {
  contas: [
    {
      id: 'acc-1',
      nome: 'Itaú Personalité',
      instituicao: 'Banco Itaú',
      saldo: 18450.0,
      tipo: 'corrente',
      cor: '#EC7000',
    },
    {
      id: 'acc-2',
      nome: 'Nubank Ultravioleta',
      instituicao: 'Nubank',
      saldo: 9230.5,
      tipo: 'corrente',
      cor: '#820AD1',
    },
    {
      id: 'acc-3',
      nome: 'BTG Pactual Banking',
      instituicao: 'BTG Pactual',
      saldo: 35000.0,
      tipo: 'investimento',
      cor: '#002E6A',
    },
    {
      id: 'acc-4',
      nome: 'Carteira Física (Espécie)',
      instituicao: 'Dinheiro Vivo',
      saldo: 850.0,
      tipo: 'carteira',
      cor: '#10B981',
    },
  ],
  receitas: [
    {
      id: 'rec-1',
      descricao: 'Remuneração Mensal (Pró-Labore / Salário)',
      valor: 24500.0,
      data: '2026-11-05',
      contaId: 'acc-1',
      categoria: 'Salário',
      recorrente: true,
      status: 'recebido',
      observacao: 'Crédito em conta corrente Itaú',
    },
    {
      id: 'rec-2',
      descricao: 'Proventos FIIs (HGLG11 / KNIP11)',
      valor: 1420.8,
      data: '2026-11-15',
      contaId: 'acc-3',
      categoria: 'Dividendos & JCP',
      recorrente: true,
      status: 'pendente',
      observacao: 'Rendimentos isentos de IR creditados na corretora',
    },
    {
      id: 'rec-3',
      descricao: 'Consultoria Estratégica Pontual',
      valor: 6800.0,
      data: '2026-11-10',
      contaId: 'acc-2',
      categoria: 'Freelance / Consultoria',
      recorrente: false,
      status: 'recebido',
      observacao: 'Honorários assessoria Q4',
    },
    {
      id: 'rec-4',
      descricao: 'Dividendos Ações (WEGE3 / BBAS3)',
      valor: 890.5,
      data: '2026-10-20',
      contaId: 'acc-3',
      categoria: 'Dividendos & JCP',
      recorrente: false,
      status: 'recebido',
    },
    {
      id: 'rec-5',
      descricao: 'Remuneração Mensal Outubro',
      valor: 24500.0,
      data: '2026-10-05',
      contaId: 'acc-1',
      categoria: 'Salário',
      recorrente: true,
      status: 'recebido',
    },
    {
      id: 'rec-6',
      descricao: 'Remuneração Mensal Setembro',
      valor: 24500.0,
      data: '2026-09-05',
      contaId: 'acc-1',
      categoria: 'Salário',
      recorrente: true,
      status: 'recebido',
    },
    {
      id: 'rec-7',
      descricao: 'Remuneração Mensal Agosto',
      valor: 24500.0,
      data: '2026-08-05',
      contaId: 'acc-1',
      categoria: 'Salário',
      recorrente: true,
      status: 'recebido',
    },
    {
      id: 'rec-8',
      descricao: 'Remuneração Mensal Julho',
      valor: 24500.0,
      data: '2026-07-05',
      contaId: 'acc-1',
      categoria: 'Salário',
      recorrente: true,
      status: 'recebido',
    },
    {
      id: 'rec-9',
      descricao: 'Remuneração Mensal Junho',
      valor: 24500.0,
      data: '2026-06-05',
      contaId: 'acc-1',
      categoria: 'Salário',
      recorrente: true,
      status: 'recebido',
    },
  ],
  despesas: [
    {
      id: 'desp-1',
      descricao: 'Condomínio Residencial & IPTU',
      valor: 2450.0,
      data: '2026-11-10',
      contaId: 'acc-1',
      categoria: 'Moradia',
      recorrente: true,
      status: 'pago',
    },
    {
      id: 'desp-2',
      descricao: 'Supermercado & Empório Gourmet',
      valor: 3200.0,
      data: '2026-11-08',
      contaId: 'acc-2',
      categoria: 'Alimentação',
      recorrente: false,
      status: 'pago',
    },
    {
      id: 'desp-3',
      descricao: 'Plano de Saúde Familiar Executivo',
      valor: 1980.0,
      data: '2026-11-15',
      contaId: 'acc-1',
      categoria: 'Saúde & Bem-estar',
      recorrente: true,
      status: 'pendente',
    },
    {
      id: 'desp-4',
      descricao: 'Combustível & Tag de Pedágio',
      valor: 820.0,
      data: '2026-11-04',
      contaId: 'acc-2',
      categoria: 'Transporte',
      recorrente: true,
      status: 'pago',
    },
    {
      id: 'desp-5',
      descricao: 'Assinaturas Digitais (Bloomberg, Claude, Cloud)',
      valor: 450.0,
      data: '2026-11-12',
      contaId: 'acc-2',
      categoria: 'Assinaturas & Serviços',
      recorrente: true,
      status: 'pago',
    },
    {
      id: 'desp-6',
      descricao: 'Jantar e Lazer com Clientes/Família',
      valor: 1250.0,
      data: '2026-11-07',
      contaId: 'acc-2',
      categoria: 'Lazer & Viagens',
      recorrente: false,
      status: 'pago',
    },
    // Historical expenses for emergency fund calculation (Months 10, 09, 08, 07, 06)
    {
      id: 'desp-h1',
      descricao: 'Despesas Consolidadas Outubro',
      valor: 10400.0,
      data: '2026-10-15',
      contaId: 'acc-1',
      categoria: 'Moradia',
      recorrente: true,
      status: 'pago',
    },
    {
      id: 'desp-h2',
      descricao: 'Despesas Consolidadas Setembro',
      valor: 11200.0,
      data: '2026-09-15',
      contaId: 'acc-1',
      categoria: 'Moradia',
      recorrente: true,
      status: 'pago',
    },
    {
      id: 'desp-h3',
      descricao: 'Despesas Consolidadas Agosto',
      valor: 9850.0,
      data: '2026-08-15',
      contaId: 'acc-1',
      categoria: 'Moradia',
      recorrente: true,
      status: 'pago',
    },
    {
      id: 'desp-h4',
      descricao: 'Despesas Consolidadas Julho',
      valor: 12100.0,
      data: '2026-07-15',
      contaId: 'acc-1',
      categoria: 'Moradia',
      recorrente: true,
      status: 'pago',
    },
    {
      id: 'desp-h5',
      descricao: 'Despesas Consolidadas Junho',
      valor: 10900.0,
      data: '2026-06-15',
      contaId: 'acc-1',
      categoria: 'Moradia',
      recorrente: true,
      status: 'pago',
    },
  ],
  parcelamentos: [
    {
      id: 'parc-1',
      descricao: 'MacBook Pro M3 Max 16"',
      valorTotal: 21990.0,
      parcelasTotal: 10,
      parcelaAtual: 4,
      valorParcela: 2199.0,
      categoria: 'Educação & Desenvolvimento',
      contaId: 'acc-2',
      dataInicio: '2026-08-10',
      status: 'ativo',
      observacao: 'Equipamento de análise de dados e trabalho',
      historicoParcelas: [
        { numero: 1, dataVencimento: '2026-08-10', dataPagamento: '2026-08-08', valorOriginal: 2199.0, valorPago: 2199.0, antecipada: false, descontoEconomia: 0, status: 'pago', contaId: 'acc-2' },
        { numero: 2, dataVencimento: '2026-09-10', dataPagamento: '2026-09-09', valorOriginal: 2199.0, valorPago: 2199.0, antecipada: false, descontoEconomia: 0, status: 'pago', contaId: 'acc-2' },
        { numero: 3, dataVencimento: '2026-10-10', dataPagamento: '2026-10-10', valorOriginal: 2199.0, valorPago: 2199.0, antecipada: false, descontoEconomia: 0, status: 'pago', contaId: 'acc-2' },
        { numero: 4, dataVencimento: '2026-11-10', dataPagamento: '2026-10-25', valorOriginal: 2199.0, valorPago: 2089.0, antecipada: true, descontoEconomia: 110.0, status: 'antecipado', contaId: 'acc-2', observacao: 'Antecipação com 5% de desconto promocional no app' },
        { numero: 5, dataVencimento: '2026-12-10', valorOriginal: 2199.0, antecipada: false, status: 'pendente', contaId: 'acc-2' },
        { numero: 6, dataVencimento: '2027-01-10', valorOriginal: 2199.0, antecipada: false, status: 'pendente', contaId: 'acc-2' },
        { numero: 7, dataVencimento: '2027-02-10', valorOriginal: 2199.0, antecipada: false, status: 'pendente', contaId: 'acc-2' },
        { numero: 8, dataVencimento: '2027-03-10', valorOriginal: 2199.0, antecipada: false, status: 'pendente', contaId: 'acc-2' },
        { numero: 9, dataVencimento: '2027-04-10', valorOriginal: 2199.0, antecipada: false, status: 'pendente', contaId: 'acc-2' },
        { numero: 10, dataVencimento: '2027-05-10', valorOriginal: 2199.0, antecipada: false, status: 'pendente', contaId: 'acc-2' },
      ],
    },
    {
      id: 'parc-2',
      descricao: 'Seguro Auto Anual Porto Seguro',
      valorTotal: 5800.0,
      parcelasTotal: 6,
      parcelaAtual: 3,
      valorParcela: 966.67,
      categoria: 'Transporte',
      contaId: 'acc-1',
      dataInicio: '2026-09-01',
      status: 'ativo',
      historicoParcelas: [
        { numero: 1, dataVencimento: '2026-09-01', dataPagamento: '2026-09-01', valorOriginal: 966.67, valorPago: 966.67, antecipada: false, descontoEconomia: 0, status: 'pago', contaId: 'acc-1' },
        { numero: 2, dataVencimento: '2026-10-01', dataPagamento: '2026-10-01', valorOriginal: 966.67, valorPago: 966.67, antecipada: false, descontoEconomia: 0, status: 'pago', contaId: 'acc-1' },
        { numero: 3, dataVencimento: '2026-11-01', dataPagamento: '2026-11-01', valorOriginal: 966.67, valorPago: 966.67, antecipada: false, descontoEconomia: 0, status: 'pago', contaId: 'acc-1' },
        { numero: 4, dataVencimento: '2026-12-01', valorOriginal: 966.67, antecipada: false, status: 'pendente', contaId: 'acc-1' },
        { numero: 5, dataVencimento: '2027-01-01', valorOriginal: 966.67, antecipada: false, status: 'pendente', contaId: 'acc-1' },
        { numero: 6, dataVencimento: '2027-02-01', valorOriginal: 966.67, antecipada: false, status: 'pendente', contaId: 'acc-1' },
      ],
    },
    {
      id: 'parc-3',
      descricao: 'Mobiliário Home Office Ergonômico',
      valorTotal: 4800.0,
      parcelasTotal: 8,
      parcelaAtual: 7,
      valorParcela: 600.0,
      categoria: 'Moradia',
      contaId: 'acc-2',
      dataInicio: '2026-05-15',
      status: 'ativo',
      historicoParcelas: [
        { numero: 1, dataVencimento: '2026-05-15', dataPagamento: '2026-05-15', valorOriginal: 600.0, valorPago: 600.0, antecipada: false, status: 'pago', contaId: 'acc-2' },
        { numero: 2, dataVencimento: '2026-06-15', dataPagamento: '2026-06-15', valorOriginal: 600.0, valorPago: 600.0, antecipada: false, status: 'pago', contaId: 'acc-2' },
        { numero: 3, dataVencimento: '2026-07-15', dataPagamento: '2026-07-15', valorOriginal: 600.0, valorPago: 600.0, antecipada: false, status: 'pago', contaId: 'acc-2' },
        { numero: 4, dataVencimento: '2026-08-15', dataPagamento: '2026-08-15', valorOriginal: 600.0, valorPago: 600.0, antecipada: false, status: 'pago', contaId: 'acc-2' },
        { numero: 5, dataVencimento: '2026-09-15', dataPagamento: '2026-09-15', valorOriginal: 600.0, valorPago: 600.0, antecipada: false, status: 'pago', contaId: 'acc-2' },
        { numero: 6, dataVencimento: '2026-10-15', dataPagamento: '2026-10-15', valorOriginal: 600.0, valorPago: 600.0, antecipada: false, status: 'pago', contaId: 'acc-2' },
        { numero: 7, dataVencimento: '2026-11-15', dataPagamento: '2026-10-30', valorOriginal: 600.0, valorPago: 580.0, antecipada: true, descontoEconomia: 20.0, status: 'antecipado', contaId: 'acc-2', observacao: 'Antecipação da penúltima parcela' },
        { numero: 8, dataVencimento: '2026-12-15', valorOriginal: 600.0, antecipada: false, status: 'pendente', contaId: 'acc-2' },
      ],
    },
  ],
  investimentos: [
    {
      id: 'inv-1',
      nome: 'Tesouro Selic 2029 (Reserva Estratégica)',
      codigo: 'LFT-2029',
      categoria: 'Reserva de Emergência',
      valorInvestido: 50000.0,
      valorAtual: 54320.0,
      aportes: 50000.0,
      resgates: 0,
      rentabilidade: 8.64,
      dataInicio: '2025-10-01',
      instituicao: 'BTG Pactual',
    },
    {
      id: 'inv-2',
      nome: 'CDB Pós-Fixado 112% CDI',
      codigo: 'CDB-BANCO-MASTER',
      categoria: 'Renda Fixa',
      valorInvestido: 40000.0,
      valorAtual: 43800.0,
      aportes: 40000.0,
      resgates: 0,
      rentabilidade: 9.5,
      dataInicio: '2025-11-15',
      instituicao: 'BTG Pactual',
    },
    {
      id: 'inv-3',
      nome: 'Kinea Rendimentos Imobiliários',
      codigo: 'KNIP11',
      categoria: 'Fundos Imobiliários (FIIs)',
      valorInvestido: 35000.0,
      valorAtual: 37450.0,
      aportes: 35000.0,
      resgates: 0,
      rentabilidade: 7.0,
      dataInicio: '2025-08-01',
      instituicao: 'BTG Pactual',
    },
    {
      id: 'inv-4',
      nome: 'CSHG Logística FII',
      codigo: 'HGLG11',
      categoria: 'Fundos Imobiliários (FIIs)',
      valorInvestido: 30000.0,
      valorAtual: 32100.0,
      aportes: 30000.0,
      resgates: 0,
      rentabilidade: 7.0,
      dataInicio: '2025-07-15',
      instituicao: 'BTG Pactual',
    },
    {
      id: 'inv-5',
      nome: 'WEG S.A. Ord',
      codigo: 'WEGE3',
      categoria: 'Ações Brasil',
      valorInvestido: 25000.0,
      valorAtual: 29800.0,
      aportes: 25000.0,
      resgates: 0,
      rentabilidade: 19.2,
      dataInicio: '2025-04-10',
      instituicao: 'BTG Pactual',
    },
    {
      id: 'inv-6',
      nome: 'iShares S&P 500 BDR ETF',
      codigo: 'IVVB11',
      categoria: 'Internacional / BDRs',
      valorInvestido: 20000.0,
      valorAtual: 23600.0,
      aportes: 20000.0,
      resgates: 0,
      rentabilidade: 18.0,
      dataInicio: '2025-03-01',
      instituicao: 'BTG Pactual',
    },
    {
      id: 'inv-7',
      nome: 'Bitcoin Cold Storage',
      codigo: 'BTC',
      categoria: 'Criptoativos',
      valorInvestido: 15000.0,
      valorAtual: 22400.0,
      aportes: 15000.0,
      resgates: 0,
      rentabilidade: 49.33,
      dataInicio: '2025-01-20',
      instituicao: 'Hardware Wallet',
    },
  ],
  dividas: [
    {
      id: 'div-1',
      nome: 'Financiamento Imobiliário Sac',
      credor: 'Caixa Econômica',
      saldoInicial: 180000.0,
      saldoAtual: 68500.0,
      taxaJurosMensal: 0.78, // ~9.8% ao ano
      valorParcela: 1850.0,
      parcelasRestantes: 42,
      plano: 'avalanche',
      categoria: 'Financiamento',
    },
    {
      id: 'div-2',
      nome: 'Empréstimo Pessoal Executivo',
      credor: 'BTG Pactual Crédito',
      saldoInicial: 25000.0,
      saldoAtual: 9200.0,
      taxaJurosMensal: 1.45,
      valorParcela: 980.0,
      parcelasRestantes: 10,
      plano: 'bola_de_neve',
      categoria: 'Empréstimo',
    },
    {
      id: 'div-3',
      nome: 'Parcelamento Fatura Cartão Premium',
      credor: 'Itaú Cartões',
      saldoInicial: 12000.0,
      saldoAtual: 3400.0,
      taxaJurosMensal: 2.1,
      valorParcela: 1180.0,
      parcelasRestantes: 3,
      plano: 'bola_de_neve',
      categoria: 'Cartão',
    },
  ],
  metas: [
    {
      id: 'meta-1',
      titulo: 'Blindagem Reserva de Emergência (6 Meses)',
      valorAlvo: 65000.0,
      acumulado: 54320.0,
      prazo: '2027-03-31',
      categoria: 'Segurança',
      prioridade: 'alta',
      status: 'em_andamento',
      cor: '#4AE176',
    },
    {
      id: 'meta-2',
      titulo: 'Viagem em Família - Alpes Suíços & Itália',
      valorAlvo: 38000.0,
      acumulado: 22500.0,
      prazo: '2027-09-30',
      categoria: 'Lazer',
      prioridade: 'media',
      status: 'em_andamento',
      cor: '#3B82F6',
    },
    {
      id: 'meta-3',
      titulo: 'Quitação Integral de Empréstimos e Cartões',
      valorAlvo: 12600.0,
      acumulado: 8500.0,
      prazo: '2027-04-30',
      categoria: 'Dívidas',
      prioridade: 'alta',
      status: 'em_andamento',
      cor: '#EF4444',
    },
    {
      id: 'meta-4',
      titulo: 'Atingir Marco de R$ 500k em Patrimônio Líquido',
      valorAlvo: 500000.0,
      acumulado: 285550.5,
      prazo: '2028-12-31',
      categoria: 'Patrimônio',
      prioridade: 'alta',
      status: 'em_andamento',
      cor: '#C0C1FF',
    },
  ],
  configuracoes: {
    mesesReservaEmergencia: 6,
    moeda: 'BRL',
    estrategiaQuitacaoPadrao: 'avalanche',
  },
};

export function getInitialWorkspaceForUser(userName?: string): FinanceData {
  return {
    contas: [
      {
        id: `acc-main-${Date.now()}`,
        nome: 'Conta Corrente Principal',
        instituicao: 'Banco Principal',
        saldo: 0,
        tipo: 'corrente',
        cor: '#3b82f6',
      },
      {
        id: `acc-inv-${Date.now()}`,
        nome: 'Conta Investimentos & Reserva',
        instituicao: 'Corretora',
        saldo: 0,
        tipo: 'investimento',
        cor: '#10b981',
      },
      {
        id: `acc-wallet-${Date.now()}`,
        nome: 'Carteira Física',
        instituicao: 'Espécie',
        saldo: 0,
        tipo: 'carteira',
        cor: '#f59e0b',
      },
    ],
    receitas: [],
    despesas: [],
    parcelamentos: [],
    investimentos: [],
    dividas: [],
    metas: [],
    configuracoes: {
      mesesReservaEmergencia: 6,
      moeda: 'BRL',
      estrategiaQuitacaoPadrao: 'avalanche',
    },
  };
}

export function getUserStorageKey(userId?: string): string {
  if (!userId) return STORAGE_KEY;
  return `${STORAGE_KEY}_usr_${userId}`;
}

export function loadFinanceData(userId?: string, isNewAccount = false): FinanceData {
  try {
    const key = getUserStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      // If user has no local storage yet:
      // If this is a new registered user or specified user, create their clean isolated workspace.
      // If no user is specified (legacy or initial default demo), load INITIAL_DATA.
      const initial = (userId || isNewAccount) ? getInitialWorkspaceForUser() : INITIAL_DATA;
      saveFinanceData(initial, userId);
      return initial;
    }
    const parsed = JSON.parse(raw);
    const rawParcelas = (parsed.parcelamentos || []) as Installment[];
    const normalizedParcelas = rawParcelas.map(ensureInstallmentHistory);

    return {
      contas: parsed.contas || [],
      receitas: parsed.receitas || [],
      despesas: parsed.despesas || [],
      parcelamentos: normalizedParcelas,
      investimentos: parsed.investimentos || [],
      dividas: parsed.dividas || [],
      metas: parsed.metas || [],
      configuracoes: parsed.configuracoes || {
        mesesReservaEmergencia: 6,
        moeda: 'BRL',
        estrategiaQuitacaoPadrao: 'avalanche',
      },
    };
  } catch (err) {
    console.error('Failed to parse stored finance data:', err);
    return userId ? getInitialWorkspaceForUser() : INITIAL_DATA;
  }
}

export function saveFinanceData(data: FinanceData, userId?: string): void {
  try {
    const key = getUserStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save finance data to localStorage:', err);
  }
}

export function exportToJSON(data: FinanceData): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `Personal_Finance_Hub_Backup_${timestamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToExcel(data: FinanceData): void {
  const wb = XLSX.utils.book_new();

  // 1. Contas
  const contasRows = data.contas.map((c) => ({
    ID: c.id,
    Nome: c.nome,
    Instituição: c.instituicao,
    Tipo: c.tipo,
    'Saldo (R$)': c.saldo,
  }));
  const wsContas = XLSX.utils.json_to_sheet(contasRows);
  XLSX.utils.book_append_sheet(wb, wsContas, 'Contas');

  // 2. Receitas
  const receitasRows = data.receitas.map((r) => ({
    Descrição: r.descricao,
    'Valor (R$)': r.valor,
    Data: r.data,
    Categoria: r.categoria,
    ContaID: r.contaId,
    Recorrente: r.recorrente ? 'Sim' : 'Não',
    Status: r.status,
    Observação: r.observacao || '',
  }));
  const wsReceitas = XLSX.utils.json_to_sheet(receitasRows);
  XLSX.utils.book_append_sheet(wb, wsReceitas, 'Receitas');

  // 3. Despesas
  const despesasRows = data.despesas.map((d) => ({
    Descrição: d.descricao,
    'Valor (R$)': d.valor,
    Data: d.data,
    Categoria: d.categoria,
    ContaID: d.contaId,
    Recorrente: d.recorrente ? 'Sim' : 'Não',
    Status: d.status,
  }));
  const wsDespesas = XLSX.utils.json_to_sheet(despesasRows);
  XLSX.utils.book_append_sheet(wb, wsDespesas, 'Despesas');

  // 4. Parcelamentos
  const parcelasRows = data.parcelamentos.map((p) => ({
    Descrição: p.descricao,
    'Valor Total (R$)': p.valorTotal,
    'Parcela Atual': p.parcelaAtual,
    'Total Parcelas': p.parcelasTotal,
    'Valor da Parcela (R$)': p.valorParcela,
    Categoria: p.categoria,
    'Data Início': p.dataInicio,
    Status: p.status,
  }));
  const wsParcelas = XLSX.utils.json_to_sheet(parcelasRows);
  XLSX.utils.book_append_sheet(wb, wsParcelas, 'Parcelamentos');

  // 5. Investimentos
  const invRows = data.investimentos.map((i) => ({
    Ativo: i.nome,
    Código: i.codigo || '',
    Categoria: i.categoria,
    'Valor Investido (R$)': i.valorInvestido,
    'Valor Atual (R$)': i.valorAtual,
    'Rentabilidade (%)': i.rentabilidade || ((i.valorAtual - i.valorInvestido) / (i.valorInvestido || 1)) * 100,
    Instituição: i.instituicao,
  }));
  const wsInv = XLSX.utils.json_to_sheet(invRows);
  XLSX.utils.book_append_sheet(wb, wsInv, 'Investimentos');

  // 6. Dívidas
  const dividasRows = data.dividas.map((d) => ({
    Dívida: d.nome,
    Credor: d.credor,
    'Saldo Inicial (R$)': d.saldoInicial,
    'Saldo Atual (R$)': d.saldoAtual,
    'Taxa Juros Mensal (%)': d.taxaJurosMensal,
    'Parcela Mensal (R$)': d.valorParcela,
    'Parcelas Restantes': d.parcelasRestantes,
    Estratégia: d.plano,
  }));
  const wsDividas = XLSX.utils.json_to_sheet(dividasRows);
  XLSX.utils.book_append_sheet(wb, wsDividas, 'Dívidas');

  // 7. Metas
  const metasRows = data.metas.map((m) => ({
    Meta: m.titulo,
    'Valor Alvo (R$)': m.valorAlvo,
    'Acumulado (R$)': m.acumulado,
    'Progresso (%)': ((m.acumulado / m.valorAlvo) * 100).toFixed(1),
    Prazo: m.prazo,
    Categoria: m.categoria,
    Prioridade: m.prioridade,
    Status: m.status,
  }));
  const wsMetas = XLSX.utils.json_to_sheet(metasRows);
  XLSX.utils.book_append_sheet(wb, wsMetas, 'Metas');

  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Personal_Finance_Hub_Relatorio_${timestamp}.xlsx`);
}

export function exportToCSV(data: FinanceData): void {
  // Quick export of transactions & balances to CSV
  let csv = 'Tipo;Descrição;Categoria;Valor;Data;Status\n';
  data.receitas.forEach((r) => {
    csv += `Receita;${r.descricao};${r.categoria};${r.valor.toFixed(2)};${r.data};${r.status}\n`;
  });
  data.despesas.forEach((d) => {
    csv += `Despesa;${d.descricao};${d.categoria};${d.valor.toFixed(2)};${d.data};${d.status}\n`;
  });

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Extrato_Financeiro_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
