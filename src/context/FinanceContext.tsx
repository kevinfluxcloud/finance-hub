import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Account,
  DateFilterMode,
  DateFilterState,
  Debt,
  Expense,
  FinanceData,
  Goal,
  Income,
  Installment,
  InstallmentPayment,
  Investment,
  PayoffStrategy,
} from '../types/finance';
import { calculateEmergencyReserve, calculateNetWorth, ensureInstallmentHistory } from '../utils/calculations';
import { buildDateFilter, isDateInFilter } from '../utils/formatters';
import { INITIAL_DATA, loadFinanceData, saveFinanceData } from '../utils/storage';
import { getStoredSupabaseConfig, getSupabaseClient } from '../lib/supabase';
import {
  fetchFinanceDataFromSupabase,
  pushFinanceDataToSupabase,
  subscribeToSupabaseRealtime,
} from '../services/supabaseSync';
import { useAuth } from './AuthContext';

export type NavigationTab =
  | 'dashboard'
  | 'contas'
  | 'receitas'
  | 'despesas'
  | 'parcelamentos'
  | 'investimentos'
  | 'dividas'
  | 'reserva'
  | 'metas'
  | 'relatorios'
  | 'configuracoes';

interface FinanceContextType {
  data: FinanceData;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  selectedMonth: string; // 'YYYY-MM'
  setSelectedMonth: (month: string) => void;

  // Flexible Date Range Filter (Mês, Ano, Entre Datas, Tudo)
  dateFilter: DateFilterState;
  setDateFilter: (filter: DateFilterState) => void;
  setDateFilterPreset: (
    mode: DateFilterMode,
    params?: { year?: number; month?: number; startDate?: string; endDate?: string }
  ) => void;
  isDateInActiveFilter: (dateStr: string) => boolean;

  // Computed metrics
  netWorth: {
    totalContas: number;
    totalInvestimentos: number;
    totalDividas: number;
    patrimonioLiquido: number;
  };
  totalReceitasMes: number;
  totalDespesasMes: number;
  saldoLivreMes: number;
  emergencyFund: ReturnType<typeof calculateEmergencyReserve>;
  totalInvestimentos: number;
  totalInvestido: number;
  rentabilidadeGeral: number;
  totalDividas: number;

  // Account operations
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  transferFunds: (sourceId: string, targetId: string, amount: number, desc?: string) => void;

  // Transaction operations
  addIncome: (income: Omit<Income, 'id'>) => void;
  updateIncome: (id: string, income: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  toggleIncomeStatus: (id: string) => void;

  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  toggleExpenseStatus: (id: string) => void;

  // Installment operations with detailed per-parcel payment & early antecipation tracking
  addInstallment: (installment: Omit<Installment, 'id'>) => void;
  updateInstallment: (id: string, installment: Partial<Installment>) => void;
  deleteInstallment: (id: string) => void;
  advanceInstallment: (
    id: string,
    options?: {
      dataPagamento?: string;
      valorPago?: number;
      antecipada?: boolean;
      contaId?: string;
      observacao?: string;
    }
  ) => void;
  paySingleParcela: (
    installmentId: string,
    parcelaNumero: number,
    details: {
      dataPagamento: string;
      valorPago: number;
      antecipada: boolean;
      contaId?: string;
      observacao?: string;
    }
  ) => void;
  unpaySingleParcela: (installmentId: string, parcelaNumero: number) => void;

  // Investment operations
  addInvestment: (investment: Omit<Investment, 'id'>) => void;
  updateInvestment: (id: string, investment: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;
  registerInvestmentAporte: (id: string, valor: number, debitAccount?: string) => void;
  registerInvestmentResgate: (id: string, valor: number, creditAccount?: string) => void;

  // Debt operations
  addDebt: (debt: Omit<Debt, 'id'>) => void;
  updateDebt: (id: string, debt: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  amortizeDebt: (id: string, valor: number, accountId?: string) => void;

  // Goal operations
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (id: string, amount: number, sourceAccountId?: string) => void;

  // Global actions
  resetToSampleData: () => void;
  clearAllData: () => void;
  importData: (importedData: FinanceData) => void;

  // Supabase real-time sync & persistence
  isSupabaseConnected: boolean;
  isSupabaseSyncing: boolean;
  lastSupabaseSync: Date | null;
  supabaseError: string | null;
  syncToSupabase: () => Promise<void>;
  syncFromSupabase: () => Promise<void>;
  refreshSupabaseConnection: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id;

  const [data, setData] = useState<FinanceData>(() => loadFinanceData(userId));
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  
  // Reload data whenever active user switches (e.g. login, logout, user switch)
  useEffect(() => {
    isRemoteUpdateRef.current = true;
    const userWorkspace = loadFinanceData(userId);
    setData(userWorkspace);
  }, [userId]);

  // Default to November 2026 based on metadata
  const [dateFilter, setDateFilter] = useState<DateFilterState>(() =>
    buildDateFilter('mes', { year: 2026, month: 11 })
  );

  const selectedMonth = useMemo(() => {
    const mStr = dateFilter.month < 10 ? `0${dateFilter.month}` : `${dateFilter.month}`;
    return `${dateFilter.year}-${mStr}`;
  }, [dateFilter]);

  const setSelectedMonth = (ym: string) => {
    if (!ym) return;
    const [y, m] = ym.split('-').map(Number);
    setDateFilter(buildDateFilter('mes', { year: y || 2026, month: m || 11 }));
  };

  const setDateFilterPreset = (
    mode: DateFilterMode,
    params?: { year?: number; month?: number; startDate?: string; endDate?: string }
  ) => {
    setDateFilter(buildDateFilter(mode, params));
  };

  const isDateInActiveFilter = (dateStr: string) => {
    return isDateInFilter(dateStr, dateFilter);
  };

  // Supabase Sync States
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState(false);
  const [lastSupabaseSync, setLastSupabaseSync] = useState<Date | null>(null);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  const isRemoteUpdateRef = useRef(false);
  const autoSyncDebounceTimerRef = useRef<any>(null);
  const currentDataRef = useRef<FinanceData>(data);

  useEffect(() => {
    currentDataRef.current = data;
  }, [data]);

  // Unified updater that ensures immediate synchronous persistence to localStorage
  const updateFinanceData = useCallback(
    (updater: (prev: FinanceData) => FinanceData) => {
      setData((prev) => {
        const next = updater(prev);
        currentDataRef.current = next;
        saveFinanceData(next, userId);
        return next;
      });
    },
    [userId]
  );

  // Pull data from Supabase for current active user
  const syncFromSupabase = useCallback(async () => {
    setIsSupabaseSyncing(true);
    setSupabaseError(null);
    try {
      const res = await fetchFinanceDataFromSupabase(userId);
      const localCurrent = currentDataRef.current || loadFinanceData(userId);

      const localHasItems =
        localCurrent.contas.some((c) => c.saldo !== 0) ||
        localCurrent.receitas.length > 0 ||
        localCurrent.despesas.length > 0 ||
        localCurrent.investimentos.length > 0 ||
        localCurrent.dividas.length > 0 ||
        localCurrent.metas.length > 0;

      if (res.success && res.data) {
        const remoteHasItems =
          res.data.contas.some((c) => c.saldo !== 0) ||
          res.data.receitas.length > 0 ||
          res.data.despesas.length > 0 ||
          res.data.investimentos.length > 0 ||
          res.data.dividas.length > 0 ||
          res.data.metas.length > 0;

        // If local user has records but remote Supabase is completely blank,
        // push local records to Supabase to initialize cloud database!
        if (localHasItems && !remoteHasItems) {
          await pushFinanceDataToSupabase(localCurrent, userId);
          setIsSupabaseConnected(true);
          setLastSupabaseSync(new Date());
          return;
        }

        // Remote has active data: apply remote data
        isRemoteUpdateRef.current = true;
        setData(res.data);
        currentDataRef.current = res.data;
        saveFinanceData(res.data, userId);
        setIsSupabaseConnected(true);
        setLastSupabaseSync(new Date());
      } else if (res.success && !res.data) {
        // Connected, but database has no row yet for this user. Push current local workspace!
        setIsSupabaseConnected(true);
        await pushFinanceDataToSupabase(localCurrent, userId);
        setLastSupabaseSync(new Date());
      } else {
        setSupabaseError(res.error || 'Erro ao carregar dados do Supabase.');
      }
    } catch (err: any) {
      setSupabaseError(err.message || 'Falha na conexão com Supabase.');
    } finally {
      setIsSupabaseSyncing(false);
    }
  }, [userId]);

  // Push local data to Supabase for current active user
  const syncToSupabase = useCallback(async () => {
    setIsSupabaseSyncing(true);
    setSupabaseError(null);
    try {
      const current = currentDataRef.current || data;
      const res = await pushFinanceDataToSupabase(current, userId);
      if (res.success) {
        setIsSupabaseConnected(true);
        setLastSupabaseSync(new Date());
      } else {
        setSupabaseError(res.error || 'Falha ao sincronizar dados com o Supabase.');
      }
    } catch (err: any) {
      setSupabaseError(err.message || 'Falha ao sincronizar dados com o Supabase.');
    } finally {
      setIsSupabaseSyncing(false);
    }
  }, [data, userId]);

  // Refresh and check connection
  const refreshSupabaseConnection = useCallback(async () => {
    const config = getStoredSupabaseConfig();
    if (!config.url || !config.anonKey) {
      setIsSupabaseConnected(false);
      return;
    }
    await syncFromSupabase();
  }, [syncFromSupabase]);

  // Initial load and Realtime listener bound to current userId
  useEffect(() => {
    const config = getStoredSupabaseConfig();
    if (config.url && config.anonKey) {
      syncFromSupabase();
    }

    // Subscribe to realtime broadcast from Supabase strictly for this user
    const unsubscribe = subscribeToSupabaseRealtime(userId, (remoteData) => {
      isRemoteUpdateRef.current = true;
      setData(remoteData);
      currentDataRef.current = remoteData;
      saveFinanceData(remoteData, userId);
      setLastSupabaseSync(new Date());
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  // Debounced auto-sync to Supabase when data changes locally
  useEffect(() => {
    saveFinanceData(data, userId);

    // Skip if update was triggered by remote Supabase Realtime broadcast
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    const config = getStoredSupabaseConfig();
    if (config.url && config.anonKey && config.autoSync) {
      if (autoSyncDebounceTimerRef.current) {
        clearTimeout(autoSyncDebounceTimerRef.current);
      }
      autoSyncDebounceTimerRef.current = setTimeout(async () => {
        setIsSupabaseSyncing(true);
        try {
          const res = await pushFinanceDataToSupabase(data, userId);
          if (res.success) {
            setIsSupabaseConnected(true);
            setLastSupabaseSync(new Date());
            setSupabaseError(null);
          }
        } catch (err: any) {
          console.warn('Auto-sync to Supabase failed:', err);
        } finally {
          setIsSupabaseSyncing(false);
        }
      }, 500);
    }

    return () => {
      if (autoSyncDebounceTimerRef.current) {
        clearTimeout(autoSyncDebounceTimerRef.current);
      }
    };
  }, [data, userId]);

  // Calculations
  const netWorth = useMemo(() => calculateNetWorth(data), [data]);

  const emergencyFund = useMemo(() => {
    return calculateEmergencyReserve(
      data,
      selectedMonth,
      data.configuracoes?.mesesReservaEmergencia || 6
    );
  }, [data, selectedMonth]);

  // Filtered period transactions (respecting month, year, or custom range)
  const totalReceitasMes = useMemo(() => {
    return data.receitas
      .filter((r) => isDateInFilter(r.data, dateFilter))
      .reduce((sum, r) => sum + r.valor, 0);
  }, [data.receitas, dateFilter]);

  const totalDespesasMes = useMemo(() => {
    const despesas = data.despesas
      .filter((d) => isDateInFilter(d.data, dateFilter))
      .reduce((sum, d) => sum + d.valor, 0);

    // Active installments due or paid in the active period
    const parcelas = data.parcelamentos
      .filter((p) => {
        if (p.status !== 'ativo') return false;
        if (p.historicoParcelas && p.historicoParcelas.length > 0) {
          return p.historicoParcelas.some((hp) =>
            hp.status === 'pago' || hp.status === 'antecipado'
              ? isDateInFilter(hp.dataPagamento || hp.dataVencimento, dateFilter)
              : isDateInFilter(hp.dataVencimento, dateFilter)
          );
        }
        return true;
      })
      .reduce((sum, p) => sum + p.valorParcela, 0);

    return despesas + parcelas;
  }, [data.despesas, data.parcelamentos, dateFilter]);

  const saldoLivreMes = totalReceitasMes - totalDespesasMes;

  const totalInvestimentos = useMemo(() => {
    return data.investimentos.reduce((sum, i) => sum + i.valorAtual, 0);
  }, [data.investimentos]);

  const totalInvestido = useMemo(() => {
    return data.investimentos.reduce((sum, i) => sum + i.valorInvestido, 0);
  }, [data.investimentos]);

  const rentabilidadeGeral = useMemo(() => {
    if (totalInvestido <= 0) return 0;
    return ((totalInvestimentos - totalInvestido) / totalInvestido) * 100;
  }, [totalInvestimentos, totalInvestido]);

  const totalDividas = useMemo(() => {
    return data.dividas.reduce((sum, d) => sum + d.saldoAtual, 0);
  }, [data.dividas]);

  // --- ACCOUNTS ---
  const addAccount = (account: Omit<Account, 'id'>) => {
    const newAccount: Account = {
      ...account,
      id: `acc-${Date.now()}`,
    };
    updateFinanceData((prev) => ({
      ...prev,
      contas: [...prev.contas, newAccount],
    }));
  };

  const updateAccount = (id: string, patch: Partial<Account>) => {
    updateFinanceData((prev) => ({
      ...prev,
      contas: prev.contas.map((acc) => (acc.id === id ? { ...acc, ...patch } : acc)),
    }));
  };

  const deleteAccount = (id: string) => {
    updateFinanceData((prev) => ({
      ...prev,
      contas: prev.contas.filter((acc) => acc.id !== id),
    }));
  };

  const transferFunds = (sourceId: string, targetId: string, amount: number) => {
    if (amount <= 0 || sourceId === targetId) return;
    updateFinanceData((prev) => ({
      ...prev,
      contas: prev.contas.map((acc) => {
        if (acc.id === sourceId) return { ...acc, saldo: acc.saldo - amount };
        if (acc.id === targetId) return { ...acc, saldo: acc.saldo + amount };
        return acc;
      }),
    }));
  };

  // --- INCOMES ---
  const addIncome = (income: Omit<Income, 'id'>) => {
    const newIncome: Income = {
      ...income,
      id: `rec-${Date.now()}`,
    };

    updateFinanceData((prev) => {
      // If received, update account balance
      let updatedContas = prev.contas;
      if (newIncome.status === 'recebido' && newIncome.contaId) {
        updatedContas = prev.contas.map((acc) =>
          acc.id === newIncome.contaId ? { ...acc, saldo: acc.saldo + newIncome.valor } : acc
        );
      }
      return {
        ...prev,
        contas: updatedContas,
        receitas: [newIncome, ...prev.receitas],
      };
    });
  };

  const updateIncome = (id: string, patch: Partial<Income>) => {
    updateFinanceData((prev) => {
      const existing = prev.receitas.find((r) => r.id === id);
      if (!existing) return prev;
      const updated = { ...existing, ...patch };

      let updatedContas = prev.contas;
      if (existing.status === 'recebido' && existing.contaId) {
        updatedContas = updatedContas.map((acc) =>
          acc.id === existing.contaId ? { ...acc, saldo: acc.saldo - existing.valor } : acc
        );
      }
      if (updated.status === 'recebido' && updated.contaId) {
        updatedContas = updatedContas.map((acc) =>
          acc.id === updated.contaId ? { ...acc, saldo: acc.saldo + updated.valor } : acc
        );
      }

      return {
        ...prev,
        contas: updatedContas,
        receitas: prev.receitas.map((r) => (r.id === id ? updated : r)),
      };
    });
  };

  const deleteIncome = (id: string) => {
    updateFinanceData((prev) => {
      const inc = prev.receitas.find((r) => r.id === id);
      let updatedContas = prev.contas;
      if (inc && inc.status === 'recebido' && inc.contaId) {
        updatedContas = prev.contas.map((acc) =>
          acc.id === inc.contaId ? { ...acc, saldo: acc.saldo - inc.valor } : acc
        );
      }
      return {
        ...prev,
        contas: updatedContas,
        receitas: prev.receitas.filter((r) => r.id !== id),
      };
    });
  };

  const toggleIncomeStatus = (id: string) => {
    updateFinanceData((prev) => {
      const inc = prev.receitas.find((r) => r.id === id);
      if (!inc) return prev;

      const newStatus = inc.status === 'recebido' ? 'pendente' : 'recebido';
      const balanceDelta = newStatus === 'recebido' ? inc.valor : -inc.valor;

      const updatedContas = prev.contas.map((c) =>
        c.id === inc.contaId ? { ...c, saldo: c.saldo + balanceDelta } : c
      );

      return {
        ...prev,
        contas: updatedContas,
        receitas: prev.receitas.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
      };
    });
  };

  // --- EXPENSES ---
  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expense,
      id: `desp-${Date.now()}`,
    };

    updateFinanceData((prev) => {
      let updatedContas = prev.contas;
      if (newExpense.status === 'pago' && newExpense.contaId) {
        updatedContas = prev.contas.map((acc) =>
          acc.id === newExpense.contaId ? { ...acc, saldo: acc.saldo - newExpense.valor } : acc
        );
      }
      return {
        ...prev,
        contas: updatedContas,
        despesas: [newExpense, ...prev.despesas],
      };
    });
  };

  const updateExpense = (id: string, patch: Partial<Expense>) => {
    updateFinanceData((prev) => {
      const existing = prev.despesas.find((d) => d.id === id);
      if (!existing) return prev;
      const updated = { ...existing, ...patch };

      let updatedContas = prev.contas;
      if (existing.status === 'pago' && existing.contaId) {
        updatedContas = updatedContas.map((acc) =>
          acc.id === existing.contaId ? { ...acc, saldo: acc.saldo + existing.valor } : acc
        );
      }
      if (updated.status === 'pago' && updated.contaId) {
        updatedContas = updatedContas.map((acc) =>
          acc.id === updated.contaId ? { ...acc, saldo: acc.saldo - updated.valor } : acc
        );
      }

      return {
        ...prev,
        contas: updatedContas,
        despesas: prev.despesas.map((d) => (d.id === id ? updated : d)),
      };
    });
  };

  const deleteExpense = (id: string) => {
    updateFinanceData((prev) => {
      const exp = prev.despesas.find((d) => d.id === id);
      let updatedContas = prev.contas;
      if (exp && exp.status === 'pago' && exp.contaId) {
        updatedContas = prev.contas.map((acc) =>
          acc.id === exp.contaId ? { ...acc, saldo: acc.saldo + exp.valor } : acc
        );
      }
      return {
        ...prev,
        contas: updatedContas,
        despesas: prev.despesas.filter((d) => d.id !== id),
      };
    });
  };

  const toggleExpenseStatus = (id: string) => {
    updateFinanceData((prev) => {
      const exp = prev.despesas.find((d) => d.id === id);
      if (!exp) return prev;

      const newStatus = exp.status === 'pago' ? 'pendente' : 'pago';
      const balanceDelta = newStatus === 'pago' ? -exp.valor : exp.valor;

      const updatedContas = prev.contas.map((c) =>
        c.id === exp.contaId ? { ...c, saldo: c.saldo + balanceDelta } : c
      );

      return {
        ...prev,
        contas: updatedContas,
        despesas: prev.despesas.map((d) => (d.id === id ? { ...d, status: newStatus } : d)),
      };
    });
  };

  // --- INSTALLMENTS WITH DETAILED PARCEL PAYMENT & ANTECIPATION ---
  const addInstallment = (installment: Omit<Installment, 'id'>) => {
    const newInst: Installment = ensureInstallmentHistory({
      ...installment,
      id: `parc-${Date.now()}`,
    });
    updateFinanceData((prev) => ({
      ...prev,
      parcelamentos: [newInst, ...prev.parcelamentos],
    }));
  };

  const updateInstallment = (id: string, patch: Partial<Installment>) => {
    updateFinanceData((prev) => ({
      ...prev,
      parcelamentos: prev.parcelamentos.map((p) => {
        if (p.id !== id) return p;
        return ensureInstallmentHistory({ ...p, ...patch });
      }),
    }));
  };

  const deleteInstallment = (id: string) => {
    updateFinanceData((prev) => ({
      ...prev,
      parcelamentos: prev.parcelamentos.filter((p) => p.id !== id),
    }));
  };

  const paySingleParcela = (
    installmentId: string,
    parcelaNumero: number,
    details: {
      dataPagamento: string;
      valorPago: number;
      antecipada: boolean;
      contaId?: string;
      observacao?: string;
    }
  ) => {
    updateFinanceData((prev) => {
      const target = prev.parcelamentos.find((p) => p.id === installmentId);
      if (!target) return prev;

      const normalized = ensureInstallmentHistory(target);
      const targetContaId = details.contaId || target.contaId;

      const updatedHistory: InstallmentPayment[] = (normalized.historicoParcelas || []).map(
        (p): InstallmentPayment => {
          if (p.numero !== parcelaNumero) return p;
          const discount = Math.max(0, p.valorOriginal - details.valorPago);
          const parcelaStatus: 'antecipado' | 'pago' = details.antecipada ? 'antecipado' : 'pago';
          return {
            ...p,
            status: parcelaStatus,
            dataPagamento: details.dataPagamento,
            valorPago: details.valorPago,
            antecipada: details.antecipada,
            descontoEconomia: discount,
            contaId: targetContaId,
            observacao: details.observacao || p.observacao,
          };
        }
      );

      const paidCount = updatedHistory.filter(
        (p) => p.status === 'pago' || p.status === 'antecipado'
      ).length;
      const isFinished = paidCount >= normalized.parcelasTotal;

      let updatedContas = prev.contas;
      if (details.valorPago > 0 && targetContaId) {
        updatedContas = prev.contas.map((c) =>
          c.id === targetContaId ? { ...c, saldo: c.saldo - details.valorPago } : c
        );
      }

      if (isFinished) {
        try {
          confetti({ particleCount: 85, spread: 75, origin: { y: 0.65 } });
        } catch {}
      }

      return {
        ...prev,
        contas: updatedContas,
        parcelamentos: prev.parcelamentos.map((p) =>
          p.id === installmentId
            ? {
                ...normalized,
                parcelaAtual: paidCount,
                status: isFinished ? 'concluido' : 'ativo',
                historicoParcelas: updatedHistory,
              }
            : p
        ),
      };
    });
  };

  const unpaySingleParcela = (installmentId: string, parcelaNumero: number) => {
    updateFinanceData((prev) => {
      const target = prev.parcelamentos.find((p) => p.id === installmentId);
      if (!target) return prev;

      const normalized = ensureInstallmentHistory(target);
      const targetParcela = normalized.historicoParcelas?.find((p) => p.numero === parcelaNumero);
      if (!targetParcela || targetParcela.status === 'pendente') return prev;

      const refundedAmount = targetParcela.valorPago || targetParcela.valorOriginal;
      const targetContaId = targetParcela.contaId || target.contaId;

      let updatedContas = prev.contas;
      if (refundedAmount > 0 && targetContaId) {
        updatedContas = prev.contas.map((c) =>
          c.id === targetContaId ? { ...c, saldo: c.saldo + refundedAmount } : c
        );
      }

      const updatedHistory: InstallmentPayment[] = (normalized.historicoParcelas || []).map(
        (p): InstallmentPayment => {
          if (p.numero !== parcelaNumero) return p;
          return {
            ...p,
            status: 'pendente',
            dataPagamento: undefined,
            valorPago: undefined,
            antecipada: false,
            descontoEconomia: 0,
          };
        }
      );

      const paidCount = updatedHistory.filter(
        (p) => p.status === 'pago' || p.status === 'antecipado'
      ).length;

      return {
        ...prev,
        contas: updatedContas,
        parcelamentos: prev.parcelamentos.map((p) =>
          p.id === installmentId
            ? {
                ...normalized,
                parcelaAtual: paidCount,
                status: paidCount >= normalized.parcelasTotal ? 'concluido' : 'ativo',
                historicoParcelas: updatedHistory,
              }
            : p
        ),
      };
    });
  };

  const advanceInstallment = (
    id: string,
    options?: {
      dataPagamento?: string;
      valorPago?: number;
      antecipada?: boolean;
      contaId?: string;
      observacao?: string;
    }
  ) => {
    updateFinanceData((prev) => {
      const p = prev.parcelamentos.find((item) => item.id === id);
      if (!p) return prev;

      const normalized = ensureInstallmentHistory(p);
      const nextPending = normalized.historicoParcelas?.find((item) => item.status === 'pendente');
      if (!nextPending) return prev;

      const payDate = options?.dataPagamento || new Date().toISOString().slice(0, 10);
      const isAntecipada = options?.antecipada ?? (payDate < nextPending.dataVencimento);
      const payAmount = options?.valorPago !== undefined ? options.valorPago : nextPending.valorOriginal;
      const targetContaId = options?.contaId || p.contaId;
      const discount = Math.max(0, nextPending.valorOriginal - payAmount);

      const updatedHistory: InstallmentPayment[] = (normalized.historicoParcelas || []).map(
        (item): InstallmentPayment => {
          if (item.numero !== nextPending.numero) return item;
          const parcelaStatus: 'antecipado' | 'pago' = isAntecipada ? 'antecipado' : 'pago';
          return {
            ...item,
            status: parcelaStatus,
            dataPagamento: payDate,
            valorPago: payAmount,
            antecipada: isAntecipada,
            descontoEconomia: discount,
            contaId: targetContaId,
            observacao: options?.observacao || item.observacao,
          };
        }
      );

      const paidCount = updatedHistory.filter(
        (item) => item.status === 'pago' || item.status === 'antecipado'
      ).length;
      const isFinished = paidCount >= normalized.parcelasTotal;

      let updatedContas = prev.contas;
      if (payAmount > 0 && targetContaId) {
        updatedContas = prev.contas.map((acc) =>
          acc.id === targetContaId ? { ...acc, saldo: acc.saldo - payAmount } : acc
        );
      }

      if (isFinished) {
        try {
          confetti({ particleCount: 75, spread: 65, origin: { y: 0.7 } });
        } catch {}
      }

      return {
        ...prev,
        contas: updatedContas,
        parcelamentos: prev.parcelamentos.map((item) =>
          item.id === id
            ? {
                ...normalized,
                parcelaAtual: paidCount,
                status: isFinished ? 'concluido' : 'ativo',
                historicoParcelas: updatedHistory,
              }
            : item
        ),
      };
    });
  };

  // --- INVESTMENTS ---
  const addInvestment = (investment: Omit<Investment, 'id'>) => {
    const newInv: Investment = {
      ...investment,
      id: `inv-${Date.now()}`,
      rentabilidade:
        investment.valorInvestido > 0
          ? ((investment.valorAtual - investment.valorInvestido) / investment.valorInvestido) * 100
          : 0,
    };
    updateFinanceData((prev) => ({
      ...prev,
      investimentos: [...prev.investimentos, newInv],
    }));
  };

  const updateInvestment = (id: string, patch: Partial<Investment>) => {
    updateFinanceData((prev) => ({
      ...prev,
      investimentos: prev.investimentos.map((inv) => {
        if (inv.id !== id) return inv;
        const merged = { ...inv, ...patch };
        const rentabilidade =
          merged.valorInvestido > 0
            ? ((merged.valorAtual - merged.valorInvestido) / merged.valorInvestido) * 100
            : 0;
        return { ...merged, rentabilidade };
      }),
    }));
  };

  const deleteInvestment = (id: string) => {
    updateFinanceData((prev) => ({
      ...prev,
      investimentos: prev.investimentos.filter((inv) => inv.id !== id),
    }));
  };

  const registerInvestmentAporte = (id: string, valor: number, debitAccountId?: string) => {
    if (valor <= 0) return;
    updateFinanceData((prev) => {
      const updatedContas = debitAccountId
        ? prev.contas.map((acc) =>
            acc.id === debitAccountId ? { ...acc, saldo: acc.saldo - valor } : acc
          )
        : prev.contas;

      const updatedInv = prev.investimentos.map((inv) => {
        if (inv.id !== id) return inv;
        const novoInvestido = inv.valorInvestido + valor;
        const novoAtual = inv.valorAtual + valor;
        const rentabilidade =
          novoInvestido > 0 ? ((novoAtual - novoInvestido) / novoInvestido) * 100 : 0;
        return {
          ...inv,
          valorInvestido: novoInvestido,
          valorAtual: novoAtual,
          aportes: (inv.aportes || 0) + valor,
          rentabilidade,
        };
      });

      return {
        ...prev,
        contas: updatedContas,
        investimentos: updatedInv,
      };
    });
  };

  const registerInvestmentResgate = (id: string, valor: number, creditAccountId?: string) => {
    if (valor <= 0) return;
    updateFinanceData((prev) => {
      const updatedContas = creditAccountId
        ? prev.contas.map((acc) =>
            acc.id === creditAccountId ? { ...acc, saldo: acc.saldo + valor } : acc
          )
        : prev.contas;

      const updatedInv = prev.investimentos.map((inv) => {
        if (inv.id !== id) return inv;
        const novoAtual = Math.max(0, inv.valorAtual - valor);
        const novoInvestido = Math.max(0, inv.valorInvestido - valor);
        const rentabilidade =
          novoInvestido > 0 ? ((novoAtual - novoInvestido) / novoInvestido) * 100 : 0;
        return {
          ...inv,
          valorAtual: novoAtual,
          valorInvestido: novoInvestido,
          resgates: (inv.resgates || 0) + valor,
          rentabilidade,
        };
      });

      return {
        ...prev,
        contas: updatedContas,
        investimentos: updatedInv,
      };
    });
  };

  // --- DEBTS ---
  const addDebt = (debt: Omit<Debt, 'id'>) => {
    const newDebt: Debt = {
      ...debt,
      id: `div-${Date.now()}`,
    };
    updateFinanceData((prev) => ({
      ...prev,
      dividas: [...prev.dividas, newDebt],
    }));
  };

  const updateDebt = (id: string, patch: Partial<Debt>) => {
    updateFinanceData((prev) => ({
      ...prev,
      dividas: prev.dividas.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }));
  };

  const deleteDebt = (id: string) => {
    updateFinanceData((prev) => ({
      ...prev,
      dividas: prev.dividas.filter((d) => d.id !== id),
    }));
  };

  const amortizeDebt = (id: string, valor: number, accountId?: string) => {
    if (valor <= 0) return;
    updateFinanceData((prev) => {
      const targetDebt = prev.dividas.find((d) => d.id === id);
      if (!targetDebt) return prev;

      const newSaldo = Math.max(0, targetDebt.saldoAtual - valor);
      const isPaidOff = newSaldo === 0;

      const updatedContas = accountId
        ? prev.contas.map((acc) =>
            acc.id === accountId ? { ...acc, saldo: acc.saldo - valor } : acc
          )
        : prev.contas;

      if (isPaidOff) {
        try {
          confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
        } catch {
          // ignore
        }
      }

      return {
        ...prev,
        contas: updatedContas,
        dividas: prev.dividas.map((d) =>
          d.id === id
            ? {
                ...d,
                saldoAtual: newSaldo,
                parcelasRestantes:
                  d.valorParcela > 0
                    ? Math.max(0, Math.ceil(newSaldo / d.valorParcela))
                    : d.parcelasRestantes,
              }
            : d
        ),
      };
    });
  };

  // --- GOALS ---
  const addGoal = (goal: Omit<Goal, 'id'>) => {
    const newGoal: Goal = {
      ...goal,
      id: `meta-${Date.now()}`,
    };
    updateFinanceData((prev) => ({
      ...prev,
      metas: [...prev.metas, newGoal],
    }));
  };

  const updateGoal = (id: string, patch: Partial<Goal>) => {
    updateFinanceData((prev) => ({
      ...prev,
      metas: prev.metas.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  };

  const deleteGoal = (id: string) => {
    updateFinanceData((prev) => ({
      ...prev,
      metas: prev.metas.filter((m) => m.id !== id),
    }));
  };

  const contributeToGoal = (id: string, amount: number, sourceAccountId?: string) => {
    if (amount <= 0) return;
    updateFinanceData((prev) => {
      const targetGoal = prev.metas.find((m) => m.id === id);
      if (!targetGoal) return prev;

      const newAcumulado = targetGoal.acumulado + amount;
      const isAchieved = newAcumulado >= targetGoal.valorAlvo;

      const updatedContas = sourceAccountId
        ? prev.contas.map((acc) =>
            acc.id === sourceAccountId ? { ...acc, saldo: acc.saldo - amount } : acc
          )
        : prev.contas;

      if (isAchieved && targetGoal.status !== 'concluido') {
        try {
          confetti({
            particleCount: 100,
            spread: 90,
            origin: { y: 0.5 },
            colors: ['#22C55E', '#3B82F6', '#ADC6FF', '#FFD700'],
          });
        } catch {
          // ignore
        }
      }

      return {
        ...prev,
        contas: updatedContas,
        metas: prev.metas.map((m) =>
          m.id === id
            ? {
                ...m,
                acumulado: newAcumulado,
                status: isAchieved ? 'concluido' : 'em_andamento',
              }
            : m
        ),
      };
    });
  };

  // --- RECOVERY / BACKUP ---
  const resetToSampleData = () => {
    updateFinanceData(() => INITIAL_DATA);
  };

  const clearAllData = () => {
    const emptyData: FinanceData = {
      contas: [],
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
    updateFinanceData(() => emptyData);
  };

  const importData = (imported: FinanceData) => {
    if (!imported) return;
    updateFinanceData(() => imported);
  };

  return (
    <FinanceContext.Provider
      value={{
        data,
        activeTab,
        setActiveTab,
        selectedMonth,
        setSelectedMonth,
        dateFilter,
        setDateFilter,
        setDateFilterPreset,
        isDateInActiveFilter,
        netWorth,
        totalReceitasMes,
        totalDespesasMes,
        saldoLivreMes,
        emergencyFund,
        totalInvestimentos,
        totalInvestido,
        rentabilidadeGeral,
        totalDividas,
        addAccount,
        updateAccount,
        deleteAccount,
        transferFunds,
        addIncome,
        updateIncome,
        deleteIncome,
        toggleIncomeStatus,
        addExpense,
        updateExpense,
        deleteExpense,
        toggleExpenseStatus,
        addInstallment,
        updateInstallment,
        deleteInstallment,
        advanceInstallment,
        paySingleParcela,
        unpaySingleParcela,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        registerInvestmentAporte,
        registerInvestmentResgate,
        addDebt,
        updateDebt,
        deleteDebt,
        amortizeDebt,
        addGoal,
        updateGoal,
        deleteGoal,
        contributeToGoal,
        resetToSampleData,
        clearAllData,
        importData,
        isSupabaseConnected,
        isSupabaseSyncing,
        lastSupabaseSync,
        supabaseError,
        syncToSupabase,
        syncFromSupabase,
        refreshSupabaseConnection,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
