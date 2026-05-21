'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { PageHeader } from '@/components/PageHeader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { Ticket } from '@/lib/types';

export default function EditTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    client_name: '', client_phone: '', client_email: '',
    from_location: '', to_location: '',
    departure_date: '', return_date: '', airline: '',
    original_price: '', sold_price: '', paid_amount: '',
    status: 'pending' as 'pending' | 'paid' | 'cancelled',
    notes: '',
  });

  useEffect(() => {
    fetch(`/api/tickets/${id}`)
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) {
          setTicket(data);
          setForm({
            client_name: data.client_name ?? '',
            client_phone: data.client_phone ?? '',
            client_email: data.client_email ?? '',
            from_location: data.from_location ?? '',
            to_location: data.to_location ?? '',
            departure_date: data.departure_date ?? '',
            return_date: data.return_date ?? '',
            airline: data.airline ?? '',
            original_price: String(data.original_price ?? ''),
            sold_price: String(data.sold_price ?? ''),
            paid_amount: String(data.paid_amount ?? ''),
            status: data.status ?? 'pending',
            notes: data.notes ?? '',
          });
        }
      })
      .catch(() => setError('Failed to load ticket'))
      .finally(() => setLoadingTicket(false));
  }, [id]);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const soldPrice = parseFloat(form.sold_price) || 0;
  const origPrice = parseFloat(form.original_price) || 0;
  const paidAmount = parseFloat(form.paid_amount) || 0;
  const commission = soldPrice - origPrice;
  const dueAmount = Math.max(0, soldPrice - paidAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        client_name: form.client_name.trim(),
        client_phone: form.client_phone.trim() || null,
        client_email: form.client_email.trim() || null,
        from_location: form.from_location.trim(),
        to_location: form.to_location.trim(),
        departure_date: form.departure_date,
        return_date: form.return_date || null,
        airline: form.airline.trim() || null,
        original_price: parseFloat(form.original_price),
        sold_price: parseFloat(form.sold_price),
        paid_amount: parseFloat(form.paid_amount),
        status: form.status,
        notes: form.notes.trim() || null,
      };

      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Failed to update ticket'); return; }

      router.push('/tickets');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingTicket) return <LoadingSpinner message="Loading ticket..." />;

  return (
    <Box>
      <PageHeader
        title={`Edit Ticket — ${ticket?.ticket_number ?? ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Tickets', href: '/tickets' },
          { label: 'Edit' },
        ]}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid size={12}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Client Information</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Client Name" value={form.client_name} onChange={set('client_name')} required fullWidth />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Phone" value={form.client_phone} onChange={set('client_phone')} fullWidth />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Email" type="email" value={form.client_email} onChange={set('client_email')} fullWidth />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={12}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Flight Details</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="From" value={form.from_location} onChange={set('from_location')} required fullWidth />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="To" value={form.to_location} onChange={set('to_location')} required fullWidth />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Departure Date" type="date" value={form.departure_date} onChange={set('departure_date')} required fullWidth slotProps={{ inputLabel: { shrink: true } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Return Date" type="date" value={form.return_date} onChange={set('return_date')} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Airline" value={form.airline} onChange={set('airline')} fullWidth />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={12}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Pricing</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="Original Price" type="number" value={form.original_price} onChange={set('original_price')} required fullWidth
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><AttachMoneyIcon fontSize="small" /></InputAdornment> } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="Sold Price" type="number" value={form.sold_price} onChange={set('sold_price')} required fullWidth
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><AttachMoneyIcon fontSize="small" /></InputAdornment> } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField label="Amount Paid" type="number" value={form.paid_amount} onChange={set('paid_amount')} required fullWidth
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><AttachMoneyIcon fontSize="small" /></InputAdornment> } }} />
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">Commission (auto)</Typography>
                    <Typography variant="body1" fontWeight={600} color={commission >= 0 ? 'success.main' : 'error.main'}>${commission.toFixed(2)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">Due Amount (auto)</Typography>
                    <Typography variant="body1" fontWeight={600} color={dueAmount > 0 ? 'warning.main' : 'success.main'}>${dueAmount.toFixed(2)}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={12}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select value={form.status} label="Status" onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as typeof form.status }))}>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="paid">Paid</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={12}>
                    <TextField label="Notes" value={form.notes} onChange={set('notes')} multiline rows={3} fullWidth />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={() => router.back()} disabled={isLoading}>Cancel</Button>
              <LoadingButton type="submit" variant="contained" loading={isLoading}>Save Changes</LoadingButton>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
