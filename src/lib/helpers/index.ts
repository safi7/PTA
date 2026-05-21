import dayjs from 'dayjs';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date, format = 'MMM DD, YYYY'): string {
  return dayjs(date).format(format);
}

export function calculateDueAmount(soldPrice: number, paidAmount: number): number {
  return Math.max(0, soldPrice - paidAmount);
}

export function calculateCommission(soldPrice: number, originalPrice: number): number {
  return soldPrice - originalPrice;
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function getPeriodDates(period: string): { startDate: string; endDate: string; prevStartDate: string; prevEndDate: string } {
  const now = dayjs();
  switch (period) {
    case 'yesterday':
      return {
        startDate: now.subtract(1, 'day').startOf('day').toISOString(),
        endDate: now.subtract(1, 'day').endOf('day').toISOString(),
        prevStartDate: now.subtract(2, 'day').startOf('day').toISOString(),
        prevEndDate: now.subtract(2, 'day').endOf('day').toISOString(),
      };
    case 'this_week':
      return {
        startDate: now.startOf('week').toISOString(),
        endDate: now.endOf('week').toISOString(),
        prevStartDate: now.subtract(1, 'week').startOf('week').toISOString(),
        prevEndDate: now.subtract(1, 'week').endOf('week').toISOString(),
      };
    case 'this_month':
      return {
        startDate: now.startOf('month').toISOString(),
        endDate: now.endOf('month').toISOString(),
        prevStartDate: now.subtract(1, 'month').startOf('month').toISOString(),
        prevEndDate: now.subtract(1, 'month').endOf('month').toISOString(),
      };
    case 'this_year':
      return {
        startDate: now.startOf('year').toISOString(),
        endDate: now.endOf('year').toISOString(),
        prevStartDate: now.subtract(1, 'year').startOf('year').toISOString(),
        prevEndDate: now.subtract(1, 'year').endOf('year').toISOString(),
      };
    default: // today
      return {
        startDate: now.startOf('day').toISOString(),
        endDate: now.endOf('day').toISOString(),
        prevStartDate: now.subtract(1, 'day').startOf('day').toISOString(),
        prevEndDate: now.subtract(1, 'day').endOf('day').toISOString(),
      };
  }
}
