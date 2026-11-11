import { DateFilterMode, DateFilterState } from '../types/finance';

/**
 * Utility formatters for Brazilian Real currency, percentages and dates.
 */

export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1).replace('.', ',')}k`;
  }
  return formatCurrency(value);
}

export function formatPercent(value: number | undefined | null, includeSign = true): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0,00%';
  }
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  if (!includeSign) {
    return `${formatted}%`;
  }

  if (value > 0) return `+${formatted}%`;
  if (value < 0) return `-${formatted}%`;
  return `${formatted}%`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateString);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

export function getMonthName(monthNumber: number): string {
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return monthNames[monthNumber - 1] || '';
}

export function getMonthLabel(yearMonth: string): string {
  // expects 'YYYY-MM'
  if (!yearMonth) return '';
  const [year, month] = yearMonth.split('-');
  const monthNum = parseInt(month, 10);
  return `${getMonthName(monthNum)} de ${year}`;
}

export function calculateDueDate(startDateStr: string, installmentIndex: number): string {
  if (!startDateStr) return new Date().toISOString().slice(0, 10);
  const [yStr, mStr, dStr] = startDateStr.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10) - 1;
  const d = parseInt(dStr, 10);

  const totalMonths = m + installmentIndex;
  const targetYear = y + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const clampedDay = Math.min(d, daysInTargetMonth);

  const finalMonthStr = targetMonth + 1 < 10 ? `0${targetMonth + 1}` : `${targetMonth + 1}`;
  const finalDayStr = clampedDay < 10 ? `0${clampedDay}` : `${clampedDay}`;
  return `${targetYear}-${finalMonthStr}-${finalDayStr}`;
}

export function buildDateFilter(
  mode: DateFilterMode,
  params?: {
    year?: number;
    month?: number;
    startDate?: string;
    endDate?: string;
  }
): DateFilterState {
  const now = new Date();
  const currentYear = params?.year ?? 2026;
  const currentMonth = params?.month ?? 11;

  if (mode === 'mes') {
    const monthStr = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    return {
      mode: 'mes',
      year: currentYear,
      month: currentMonth,
      startDate: `${currentYear}-${monthStr}-01`,
      endDate: `${currentYear}-${monthStr}-${daysInMonth < 10 ? '0' + daysInMonth : daysInMonth}`,
      label: `${getMonthName(currentMonth)} de ${currentYear}`,
    };
  }

  if (mode === 'ano') {
    return {
      mode: 'ano',
      year: currentYear,
      month: currentMonth,
      startDate: `${currentYear}-01-01`,
      endDate: `${currentYear}-12-31`,
      label: `Ano ${currentYear}`,
    };
  }

  if (mode === 'intervalo') {
    const sDate = params?.startDate || `${currentYear}-10-01`;
    const eDate = params?.endDate || `${currentYear}-11-30`;
    return {
      mode: 'intervalo',
      year: currentYear,
      month: currentMonth,
      startDate: sDate,
      endDate: eDate,
      label: `${formatDate(sDate)} até ${formatDate(eDate)}`,
    };
  }

  // mode === 'tudo'
  return {
    mode: 'tudo',
    year: currentYear,
    month: currentMonth,
    startDate: '2000-01-01',
    endDate: '2099-12-31',
    label: 'Todo o Período',
  };
}

export function isDateInFilter(dateString: string, filter: DateFilterState): boolean {
  if (!dateString) return false;
  if (filter.mode === 'tudo') return true;

  // Comparison in YYYY-MM-DD
  const dateOnly = dateString.slice(0, 10);
  return dateOnly >= filter.startDate && dateOnly <= filter.endDate;
}
