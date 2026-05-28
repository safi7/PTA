'use client';

import { useState, useEffect, useCallback } from 'react';
import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import TableSortLabel from '@mui/material/TableSortLabel';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import EditIcon from '@mui/icons-material/Edit';
import { PageHeader } from '@/components/PageHeader';
import type { Ticket } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/helpers';

const statusColors: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  paid: 'success',
  cancelled: 'error',
};

type SortBy = 'date' | 'amount';
type SortDir = 'asc' | 'desc';

function SummaryCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Card>
      <CardContent sx={{ py: 2.5, px: 3 }}>
        <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
        <Typography variant="h5" fontWeight={700} color={color ?? 'text.primary'} sx={{ mt: 0.5 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function DuesPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [totalDue, setTotalDue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        pageSize: String(rowsPerPage),
        sortBy,
        sortDir,
      });
      const res = await fetch(`/api/dues?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setTickets(json.data ?? []);
      setTotal(json.total ?? 0);
      setTotalDue(json.totalDue ?? 0);
    } catch {
      setError('Failed to load outstanding dues. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, sortBy, sortDir]);

  useEffect(() => { fetchDues(); }, [fetchDues]);

  const handleSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
    setPage(0);
  };

  return (
    <Box>
      <PageHeader
        title="Outstanding Dues"
        subtitle={`${total} bookings with unpaid balances`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Outstanding Dues' },
        ]}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Summary cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            label="Total Outstanding"
            value={loading ? '—' : formatCurrency(totalDue)}
            color="warning.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            label="Bookings with Dues"
            value={loading ? '—' : String(total)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            label="Average Due"
            value={loading || total === 0 ? '—' : formatCurrency(totalDue / total)}
          />
        </Grid>
      </Grid>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ticket #</TableCell>
                <TableCell>Client</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Route</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  <TableSortLabel
                    active={sortBy === 'date'}
                    direction={sortBy === 'date' ? sortDir : 'desc'}
                    onClick={() => handleSort('date')}
                  >
                    Booked On
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Sold Price</TableCell>
                <TableCell align="right" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Paid</TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortBy === 'amount'}
                    direction={sortBy === 'amount' ? sortDir : 'desc'}
                    onClick={() => handleSort('amount')}
                  >
                    Due Amount
                  </TableSortLabel>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No outstanding dues — all bookings are fully paid.
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id} hover>
                    <TableCell>
                      <Box sx={{ fontFamily: 'monospace', fontSize: 12 }}>{ticket.ticket_number}</Box>
                    </TableCell>
                    <TableCell>
                      <Box fontWeight={500}>{ticket.client_name}</Box>
                      {ticket.client_phone && (
                        <Box sx={{ fontSize: 11, color: 'text.secondary' }}>{ticket.client_phone}</Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      {ticket.from_location} → {ticket.to_location}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      {formatDate(ticket.created_at, 'MMM DD, YYYY')}
                    </TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                      {formatCurrency(ticket.sold_price)}
                    </TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', lg: 'table-cell' }, color: 'text.secondary' }}>
                      {formatCurrency(ticket.paid_amount)}
                    </TableCell>
                    <TableCell align="right">
                      <Box fontWeight={700} color="warning.main">
                        {formatCurrency(ticket.due_amount)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ticket.status}
                        color={statusColors[ticket.status]}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit ticket">
                        <IconButton size="small" component={NextLink} href={`/tickets/${ticket.id}/edit`}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </Card>
    </Box>
  );
}
