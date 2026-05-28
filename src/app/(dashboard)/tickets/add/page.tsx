'use client';

import { useState, useEffect } from 'react';
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
import { useAuthStore } from '@/stores/authStore';

interface AdminOption {
  id: string;
  username: string;
  full_name: string;
}

export default function AddTicketPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [admins, setAdmins] = useState<AdminOption[]>([]);

  const [form, setForm] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    client_address: '',
    from_location: '',
    to_location: '',
    departure_date: '',
    return_date: '',
    airline: '',
    original_price: '',
    sold_price: '',
    paid_amount: '',
    status: 'pending' as 'pending' | 'paid' | 'cancelled',
    notes: '',
    created_by: '',
  });

  useEffect(() => {
    fetch('/api/users/active')
      .then((r) => r.json())
      .then(({ data }) => {
        if (Array.isArray(data)) {
          setAdmins(data);
          if (user?.id) {
            setForm((prev) => ({ ...prev, created_by: user.id }));
          }
        }
      })
      .catch(() => {/* non-critical */});
  }, [user?.id]);

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
        client_address: form.client_address.trim() || null,
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
        ...(form.created_by ? { created_by: form.created_by } : {}),
      };

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Failed to create ticket'); return; }

      router.push('/tickets');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="New Ticket"
        subtitle="Create a new flight ticket booking"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Tickets', href: '/tickets' },
          { label: 'New Ticket' },
        ]}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Client Info */}
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
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Address (optional)" value={form.client_address} onChange={set('client_address')} fullWidth multiline rows={1} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Flight Info */}
          <Grid size={12}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Flight Details</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="From" value={form.from_location} onChange={set('from_location')} required fullWidth placeholder="e.g. Kabul (KBL)" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="To" value={form.to_location} onChange={set('to_location')} required fullWidth placeholder="e.g. Dubai (DXB)" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Departure Date" type="date" value={form.departure_date} onChange={set('departure_date')} required fullWidth slotProps={{ inputLabel: { shrink: true } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Return Date (optional)" type="date" value={form.return_date} onChange={set('return_date')} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Airline (optional)" value={form.airline} onChange={set('airline')} fullWidth />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Pricing */}
          <Grid size={12}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Pricing</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Original Price"
                      type="number"
                      value={form.original_price}
                      onChange={set('original_price')}
                      required fullWidth
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><AttachMoneyIcon fontSize="small" /></InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Sold Price"
                      type="number"
                      value={form.sold_price}
                      onChange={set('sold_price')}
                      required fullWidth
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><AttachMoneyIcon fontSize="small" /></InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Amount Paid"
                      type="number"
                      value={form.paid_amount}
                      onChange={set('paid_amount')}
                      required fullWidth
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><AttachMoneyIcon fontSize="small" /></InputAdornment> } }}
                    />
                  </Grid>
                </Grid>

                {(soldPrice > 0 || origPrice > 0) && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary">Commission (calculated)</Typography>
                        <Typography variant="body1" fontWeight={600} color={commission >= 0 ? 'success.main' : 'error.main'}>
                          ${commission.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary">Due Amount (calculated)</Typography>
                        <Typography variant="body1" fontWeight={600} color={dueAmount > 0 ? 'warning.main' : 'success.main'}>
                          ${dueAmount.toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Status, Booked By & Notes */}
          <Grid size={12}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={form.status}
                        label="Status"
                        onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as typeof form.status }))}
                      >
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="paid">Paid</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {admins.length > 0 && (
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth>
                        <InputLabel>Booked By</InputLabel>
                        <Select
                          value={form.created_by}
                          label="Booked By"
                          onChange={(e) => setForm((p) => ({ ...p, created_by: e.target.value }))}
                        >
                          {admins.map((a) => (
                            <MenuItem key={a.id} value={a.id}>
                              {a.full_name || a.username}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                  <Grid size={12}>
                    <TextField
                      label="Notes (optional)"
                      value={form.notes}
                      onChange={set('notes')}
                      multiline rows={3} fullWidth
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Actions */}
          <Grid size={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={() => router.back()} disabled={isLoading}>Cancel</Button>
              <LoadingButton type="submit" variant="contained" loading={isLoading}>Create Ticket</LoadingButton>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
