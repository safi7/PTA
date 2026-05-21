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
import NextLink from 'next/link';
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
];

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('today');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const [statsRes, chartRes] = await Promise.all([
        fetch(`/api/dashboard/stats?period=${p}`),
        fetch(`/api/dashboard/chart?period=${p}`),
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

  useEffect(() => { fetchData(period); }, [period, fetchData]);

  return (
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
      <Box sx={{ mb: 3, overflowX: 'auto' }}>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={(_, val) => val && setPeriod(val)}
          size="small"
          sx={{ flexWrap: 'nowrap', whiteSpace: 'nowrap' }}
        >
          {PERIODS.map((p) => (
            <ToggleButton key={p.value} value={p.value} sx={{ px: { xs: 1.5, sm: 2 } }}>
              {p.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

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
  );
}
