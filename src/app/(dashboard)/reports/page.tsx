'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableFooter from '@mui/material/TableFooter';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Grid';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { PageHeader } from '@/components/PageHeader';
import { StatsCard } from '@/components/Dashboard/StatsCard';
import type { MonthlyReport } from '@/lib/types';
import { formatCurrency } from '@/lib/helpers';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import DownloadIcon from '@mui/icons-material/Download';
import Button from '@mui/material/Button';
import { downloadCSV } from '@/lib/helpers/csv';

export default function ReportsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([new Date().getFullYear()]);
  const [monthly, setMonthly] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async (y: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/report?year=${y}`);
      const json = await res.json();
      if (json.data) {
        setMonthly(json.data.monthly ?? []);
        setAvailableYears(json.data.availableYears ?? [y]);
      }
    } catch {
      // keep state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReport(year); }, [year, fetchReport]);

  const totals = monthly.reduce(
    (acc, m) => ({
      revenue: acc.revenue + m.revenue,
      commission: acc.commission + m.commission,
      paid: acc.paid + m.paid,
      due: acc.due + m.due,
      tickets: acc.tickets + m.tickets,
    }),
    { revenue: 0, commission: 0, paid: 0, due: 0, tickets: 0 }
  );

  return (
    <Box>
      <PageHeader
        title="Annual Report"
        subtitle={`Detailed performance report for ${year}`}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Reports' }]}
        actions={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Year</InputLabel>
              <Select value={year} label="Year" onChange={(e) => setYear(Number(e.target.value))}>
                {availableYears.map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              disabled={loading || monthly.length === 0}
              onClick={() =>
                downloadCSV(
                  monthly.map((m) => ({
                    month: m.month,
                    tickets: m.tickets,
                    revenue: m.revenue,
                    original_cost: m.originalCost,
                    commission: m.commission,
                    paid: m.paid,
                    outstanding_due: m.due,
                  })),
                  `report-${year}.csv`
                )
              }
            >
              Export CSV
            </Button>
          </Box>
        }
      />

      {/* Summary cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard title="Total Revenue" value={formatCurrency(totals.revenue)} icon={<AttachMoneyIcon />} color="#1e40af" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard title="Total Tickets" value={String(totals.tickets)} icon={<ConfirmationNumberIcon />} color="#7c3aed" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard title="Total Commission" value={formatCurrency(totals.commission)} icon={<TrendingUpIcon />} color="#059669" loading={loading} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard title="Total Outstanding" value={formatCurrency(totals.due)} icon={<AccountBalanceIcon />} color="#d97706" loading={loading} />
        </Grid>
      </Grid>

      {/* Bar chart */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Monthly Revenue" titleTypographyProps={{ variant: 'h6', fontWeight: 600 }} sx={{ pb: 0 }} />
        <CardContent>
          <Box sx={{ width: '100%', height: 280 }}>
            {loading ? (
              <Skeleton variant="rectangular" height={280} />
            ) : (
              <ResponsiveContainer>
                <BarChart data={monthly} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => v.slice(0, 3)} tickLine={false} />
                  <YAxis tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v: number, n: string) => [`$${v.toLocaleString()}`, n]} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#1e40af" radius={[4, 4, 0, 0]} name="Revenue" />
                  <Bar dataKey="commission" fill="#059669" radius={[4, 4, 0, 0]} name="Commission" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Monthly table */}
      <Card>
        <CardHeader title={`Monthly Breakdown — ${year}`} titleTypographyProps={{ variant: 'h6', fontWeight: 600 }} />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Month</TableCell>
                <TableCell align="right">Tickets</TableCell>
                <TableCell align="right">Revenue</TableCell>
                <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Cost</TableCell>
                <TableCell align="right">Commission</TableCell>
                <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>Paid</TableCell>
                <TableCell align="right">Due</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                monthly.map((row) => (
                  <TableRow key={row.monthNum} hover sx={{ opacity: row.tickets === 0 ? 0.5 : 1 }}>
                    <TableCell sx={{ fontWeight: 500 }}>{row.month}</TableCell>
                    <TableCell align="right">{row.tickets}</TableCell>
                    <TableCell align="right">{formatCurrency(row.revenue)}</TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{formatCurrency(row.originalCost)}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main' }}>{formatCurrency(row.commission)}</TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>{formatCurrency(row.paid)}</TableCell>
                    <TableCell align="right" sx={{ color: row.due > 0 ? 'warning.main' : 'text.secondary' }}>{formatCurrency(row.due)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow sx={{ '& td': { fontWeight: 700, borderTop: '2px solid', borderColor: 'divider' } }}>
                <TableCell>Total</TableCell>
                <TableCell align="right">{totals.tickets}</TableCell>
                <TableCell align="right">{formatCurrency(totals.revenue)}</TableCell>
                <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>—</TableCell>
                <TableCell align="right" sx={{ color: 'success.main' }}>{formatCurrency(totals.commission)}</TableCell>
                <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>{formatCurrency(totals.paid)}</TableCell>
                <TableCell align="right" sx={{ color: totals.due > 0 ? 'warning.main' : 'text.secondary' }}>{formatCurrency(totals.due)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
