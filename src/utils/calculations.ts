import { Debt, Expense, FinanceData, Installment, InstallmentPayment, Investment } from '../types/finance';

/**
 * SPEC Formula 1:
 * Patrimonio Liquido = Contas + Investimentos - Dividas
 */
export function calculateNetWorth(data: FinanceData): {
  totalContas: number;
  totalInvestimentos: number;
  totalDividas: number;
  patrimonioLiquido: number;
} {
  const totalContas = data.contas.reduce((sum, c) => sum + (c.saldo || 0), 0);
  const totalInvestimentos = data.investimentos.reduce((sum, i) => sum + (i.valorAtual || 0), 0);
  const totalDividas = data.dividas.reduce((sum, d) => sum + (d.saldoAtual || 0), 0);

  const patrimonioLiquido = totalContas + totalInvestimentos - totalDividas;

  return {
    totalContas,
    totalInvestimentos,
    totalDividas,
    patrimonioLiquido,
  };
}

/**
 * SPEC Formula 2:
 * Rentabilidade = ((Valor Atual - Valor Investido) / Valor Investido) * 100
 */
export function calculateInvestmentYield(valorAtual: number, valorInvestido: number): {
  rentabilidadePercent: number;
  lucroNominal: number;
} {
  if (valorInvestido <= 0) {
    return { rentabilidadePercent: 0, lucroNominal: 0 };
  }
  const lucroNominal = valorAtual - valorInvestido;
  const rentabilidadePercent = (lucroNominal / valorInvestido) * 100;
  return { rentabilidadePercent, lucroNominal };
}

/**
 * SPEC Formula 3:
 * Reserva de Emergencia = media dos ultimos 6 meses x 6
 * Also calculates currently allocated emergency funds and coverage months.
 */
export function calculateEmergencyReserve(
  data: FinanceData,
  currentYearMonth: string,
  customMultiplier: number = 6
): {
  mediaMensal6Meses: number;
  metaReservaTotal: number;
  saldoReservaAtual: number;
  coberturaMeses: number;
  percentualAtingido: number;
  historicoMensal: { mes: string; totalDespesas: number }[];
} {
  // Generate list of the last 6 months including current or preceding
  const [currYearStr, currMonthStr] = currentYearMonth.split('-');
  let y = parseInt(currYearStr, 10);
  let m = parseInt(currMonthStr, 10);

  const last6Months: string[] = [];
  for (let i = 0; i < 6; i++) {
    const monthFormatted = m < 10 ? `0${m}` : `${m}`;
    last6Months.unshift(`${y}-${monthFormatted}`);
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }

  // Calculate expenses for each of these 6 months
  const historicoMensal = last6Months.map((ym) => {
    const despesasDoMes = data.despesas
      .filter((d) => d.data.startsWith(ym))
      .reduce((sum, d) => sum + d.valor, 0);

    // Also include installment payments due in this month if active
    const parcelasDoMes = data.parcelamentos
      .filter((p) => p.status === 'ativo')
      .reduce((sum, p) => sum + p.valorParcela, 0);

    return {
      mes: ym,
      totalDespesas: despesasDoMes + parcelasDoMes,
    };
  });

  const sumDespesas = historicoMensal.reduce((sum, h) => sum + h.totalDespesas, 0);
  // Default to sensible baseline if there is little recorded history yet
  const mediaMensal6Meses = sumDespesas > 0 ? sumDespesas / 6 : 4500;
  const metaReservaTotal = mediaMensal6Meses * customMultiplier;

  // Find investment or account designated as emergency reserve
  const reservaInvestimentos = data.investimentos
    .filter((inv) => inv.categoria === 'Reserva de Emergência' || inv.nome.toLowerCase().includes('reserva') || inv.nome.toLowerCase().includes('selic'))
    .reduce((sum, inv) => sum + inv.valorAtual, 0);

  // If no explicit reserve investment, check poupança or liquidity in accounts
  const reservaContas = data.contas
    .filter((c) => c.tipo === 'poupanca' || c.nome.toLowerCase().includes('reserva') || c.nome.toLowerCase().includes('caixinha'))
    .reduce((sum, c) => sum + c.saldo, 0);

  const saldoReservaAtual = reservaInvestimentos + reservaContas;
  const coberturaMeses = mediaMensal6Meses > 0 ? saldoReservaAtual / mediaMensal6Meses : 0;
  const percentualAtingido = metaReservaTotal > 0 ? Math.min((saldoReservaAtual / metaReservaTotal) * 100, 100) : 0;

  return {
    mediaMensal6Meses,
    metaReservaTotal,
    saldoReservaAtual,
    coberturaMeses,
    percentualAtingido,
    historicoMensal,
  };
}

/**
 * PRD Feature: Debt Payoff Strategies Simulator (Snowball vs Avalanche)
 * - Snowball (Bola de Neve): sorts debts by lowest balance first
 * - Avalanche: sorts debts by highest interest rate first
 */
export interface PayoffSimulationResult {
  estrategia: 'bola_de_neve' | 'avalanche';
  mesesParaQuitacao: number;
  jurosTotaisPagos: number;
  economiaJurosVsMinimo: number;
  cronograma: {
    mes: number;
    saldoRestante: number;
    pagoJuros: number;
    pagoPrincipal: number;
    dividasQuitadasNesteMes: string[];
  }[];
}

export function simulateDebtPayoff(
  dividas: Debt[],
  aporteExtraMensal: number = 0,
  estrategia: 'bola_de_neve' | 'avalanche' = 'avalanche'
): PayoffSimulationResult {
  const activeDebts = dividas.filter((d) => d.saldoAtual > 0);
  if (activeDebts.length === 0) {
    return {
      estrategia,
      mesesParaQuitacao: 0,
      jurosTotaisPagos: 0,
      economiaJurosVsMinimo: 0,
      cronograma: [],
    };
  }

  // Clone debts for simulation
  let simulatedDebts = activeDebts.map((d) => ({
    id: d.id,
    nome: d.nome,
    saldo: d.saldoAtual,
    taxa: d.taxaJurosMensal / 100,
    minimo: Math.max(d.valorParcela, d.saldoAtual * 0.03), // minimum monthly obligation
  }));

  // Sort based on strategy
  if (estrategia === 'bola_de_neve') {
    simulatedDebts.sort((a, b) => a.saldo - b.saldo); // Smallest balance first
  } else {
    simulatedDebts.sort((a, b) => b.taxa - a.taxa); // Highest interest first
  }

  let mes = 0;
  let jurosTotaisPagos = 0;
  const cronograma: PayoffSimulationResult['cronograma'] = [];
  const maxMeses = 120; // safety ceiling (10 years)

  while (simulatedDebts.some((d) => d.saldo > 0.01) && mes < maxMeses) {
    mes++;
    let jurosMes = 0;
    let principalMes = 0;
    let extraDisponivel = aporteExtraMensal;
    const dividasQuitadasNesteMes: string[] = [];

    // 1. Apply monthly interest to each debt
    for (const debt of simulatedDebts) {
      if (debt.saldo > 0.01) {
        const juros = debt.saldo * debt.taxa;
        jurosMes += juros;
        debt.saldo += juros;
      }
    }

    // 2. Pay minimum payments
    for (const debt of simulatedDebts) {
      if (debt.saldo > 0.01) {
        const pagamentoMinimo = Math.min(debt.minimo, debt.saldo);
        debt.saldo -= pagamentoMinimo;
        principalMes += pagamentoMinimo;
      }
    }

    // Re-sort priority debt if needed
    if (estrategia === 'bola_de_neve') {
      simulatedDebts.sort((a, b) => (a.saldo > 0.01 ? a.saldo : 99999999) - (b.saldo > 0.01 ? b.saldo : 99999999));
    } else {
      simulatedDebts.sort((a, b) => (a.saldo > 0.01 ? b.taxa : -1) - (b.saldo > 0.01 ? b.taxa : -1));
    }

    // 3. Apply extra rollover and extra monthly cash to top-priority debt
    for (const debt of simulatedDebts) {
      if (debt.saldo > 0.01 && extraDisponivel > 0) {
        const pagamentoExtra = Math.min(extraDisponivel, debt.saldo);
        debt.saldo -= pagamentoExtra;
        principalMes += pagamentoExtra;
        extraDisponivel -= pagamentoExtra;

        if (debt.saldo <= 0.01) {
          debt.saldo = 0;
          dividasQuitadasNesteMes.push(debt.nome);
          // Rollover: the minimum payment from this paid-off debt is now free to attack the next!
          extraDisponivel += debt.minimo;
        }
      }
    }

    jurosTotaisPagos += jurosMes;
    const saldoRestante = simulatedDebts.reduce((sum, d) => sum + Math.max(0, d.saldo), 0);

    cronograma.push({
      mes,
      saldoRestante,
      pagoJuros: jurosMes,
      pagoPrincipal: principalMes,
      dividasQuitadasNesteMes,
    });
  }

  // Baseline estimation without extra cash for savings comparison
  const jurosBaselineEstimado = activeDebts.reduce(
    (sum, d) => sum + d.saldoAtual * (d.taxaJurosMensal / 100) * Math.min(d.parcelasRestantes || 24, 36),
    0
  );
  const economiaJurosVsMinimo = Math.max(0, jurosBaselineEstimado - jurosTotaisPagos);

  return {
    estrategia,
    mesesParaQuitacao: mes,
    jurosTotaisPagos,
    economiaJurosVsMinimo,
    cronograma,
  };
}

/**
 * Builds or repairs the detailed parcel-by-parcel payment history for an installment
 */
export function ensureInstallmentHistory(inst: Installment): Installment {
  const total = Math.max(1, inst.parcelasTotal || 1);
  const current = inst.parcelaAtual || 0;
  const history = inst.historicoParcelas ? [...inst.historicoParcelas] : [];

  const existingMap = new Map(history.map((h) => [h.numero, h]));
  const fullHistory: InstallmentPayment[] = [];

  for (let i = 1; i <= total; i++) {
    const existing = existingMap.get(i);
    // Approximate due date 1 month apart starting from dataInicio
    let dueDate = inst.dataInicio || '2026-08-10';
    try {
      const [y, m, d] = dueDate.split('-').map(Number);
      const totalM = (m - 1) + (i - 1);
      const targetY = y + Math.floor(totalM / 12);
      const targetM = ((totalM % 12) + 12) % 12;
      const daysInTargetM = new Date(targetY, targetM + 1, 0).getDate();
      const clampedD = Math.min(d, daysInTargetM);
      const targetMStr = targetM + 1 < 10 ? `0${targetM + 1}` : `${targetM + 1}`;
      const targetDStr = clampedD < 10 ? `0${clampedD}` : `${clampedD}`;
      dueDate = `${targetY}-${targetMStr}-${targetDStr}`;
    } catch {
      // fallback
    }

    if (existing) {
      fullHistory.push({
        ...existing,
        numero: i,
        valorOriginal: existing.valorOriginal || inst.valorParcela,
        dataVencimento: existing.dataVencimento || dueDate,
      });
    } else {
      const isAlreadyPaid = i <= current;
      const parcelaStatus: 'pago' | 'pendente' = isAlreadyPaid ? 'pago' : 'pendente';
      fullHistory.push({
        numero: i,
        dataVencimento: dueDate,
        dataPagamento: isAlreadyPaid ? dueDate : undefined,
        valorOriginal: inst.valorParcela,
        valorPago: isAlreadyPaid ? inst.valorParcela : undefined,
        antecipada: false,
        descontoEconomia: 0,
        status: parcelaStatus,
        contaId: inst.contaId,
      });
    }
  }

  const paidCount = fullHistory.filter((p) => p.status === 'pago' || p.status === 'antecipado').length;
  const isFinished = paidCount >= total;

  return {
    ...inst,
    parcelasTotal: total,
    parcelaAtual: paidCount,
    status: isFinished ? 'concluido' : 'ativo',
    historicoParcelas: fullHistory,
  };
}
