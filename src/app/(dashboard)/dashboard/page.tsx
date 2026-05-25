'use client';

import { useState, useEffect, useCallback } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import NextLink from 'next/link';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { PageHeader } from '@/components/PageHeader';
import { StatsCard } from '@/components/Dashboard/StatsCard';
import { SalesChart } from '@/components/Dashboard/SalesChart';
import type { DashboardStats, ChartDataPoint, Period } from '@/lib/types';
import { formatCurrency } from '@/lib/helpers';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom' },
];

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('today');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [customFrom, setCustomFrom] = useState<Dayjs | null>(dayjs().subtract(7, 'day'));
  const [customTo, setCustomTo] = useState<Dayjs | null>(dayjs());

  const fetchData = useCallback(async (p: Period, from?: Dayjs | null, to?: Dayjs | null) => {
    setLoading(true);
    try {
      const buildUrl = (base: string) => {
        if (p === 'custom' && from && to) {
          return `${base}?period=custom&startDate=${from.startOf('day').toISOString()}&endDate=${to.endOf('day').toISOString()}`;
        }
        return `${base}?period=${p}`;
      };
      const [statsRes, chartRes] = await Promise.all([
        fetch(buildUrl('/api/dashboard/stats')),
        fetch(buildUrl('/api/dashboard/chart')),
      ]);
      const [statsJson, chartJson] = await Promise.all([statsRes.json(), chartRes.json()]);
      setStats(statsJson.data ?? null);
      setChartData(chartJson.data ?? []);
    } catch {
      // keep previous data on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (period === 'custom') {
      if (customFrom && customTo) fetchData('custom', customFrom, customTo);
    } else {
      fetchData(period);
    }
  }, [period, customFrom, customTo, fetchData]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <PageHeader
          title="Dashboard"
          subtitle="Sales overview and performance metrics"
          actions={
            <Button
              component={NextLink}
              href="/reports"
              variant="outlined"
              startIcon={<AssessmentIcon />}
              size="small"
            >
              View Full Report
            </Button>
          }
        />

        {/* Period selector */}
        <Box sx={{ mb: 2, overflowX: 'auto' }}>
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={(_, val) => val && setPeriod(val)}
            size="small"
            sx={{ flexWrap: 'nowrap', whiteSpace: 'nowrap' }}
          >
            {PERIODS.map((p) => (
              <ToggleButton key={p.value} value={p.value} sx={{ px: { xs: 1.5, sm: 2 } }}>
                {p.value === 'custom' && <CalendarMonthIcon fontSize="small" sx={{ mr: 0.5 }} />}
                {p.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {/* Custom date range pickers */}
        {period === 'custom' && (
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <DatePicker
              label="From"
              value={customFrom}
              onChange={(v) => setCustomFrom(v)}
              maxDate={customTo ?? dayjs()}
              slotProps={{ textField: { size: 'small' } }}
            />
            <DatePicker
              label="To"
              value={customTo}
              onChange={(v) => setCustomTo(v)}
              minDate={customFrom ?? undefined}
              maxDate={dayjs()}
              slotProps={{ textField: { size: 'small' } }}
            />
          </Box>
        )}

        {/* Stats cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatsCard
              title="Total Revenue"
              value={stats ? formatCurrency(stats.totalRevenue) : '$0.00'}
              change={stats?.revenueChange}
              icon={<AttachMoneyIcon />}
              color="#1e40af"
              loading={loading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatsCard
              title="Tickets Sold"
              value={stats ? String(stats.totalTickets) : '0'}
              change={stats?.ticketsChange}
              icon={<ConfirmationNumberIcon />}
              color="#7c3aed"
              loading={loading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatsCard
              title="Commission"
              value={stats ? formatCurrency(stats.totalCommission) : '$0.00'}
              change={stats?.commissionChange}
              icon={<TrendingUpIcon />}
              color="#059669"
              loading={loading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatsCard
              title="Outstanding Due"
              value={stats ? formatCurrency(stats.totalDue) : '$0.00'}
              icon={<AccountBalanceIcon />}
              color="#d97706"
              loading={loading}
            />
          </Grid>
        </Grid>

        {/* Chart */}
        <SalesChart data={chartData} loading={loading} />

        {/* Period label */}
        {stats && !loading && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Showing data from {new Date(stats.startDate).toLocaleDateString()} to {new Date(stats.endDate).toLocaleDateString()}
          </Typography>
        )}
      </Box>
    </LocalizationProvider>
  );
}
