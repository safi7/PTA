'use client';

import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import HistoryIcon from '@mui/icons-material/History';
import type { PriceChangeEntry } from '@/lib/types';
import { formatCurrency } from '@/lib/helpers';

const FIELD_LABELS: Record<string, string> = {
  original_price: 'Original Price',
  sold_price: 'Sold Price',
  paid_amount: 'Paid Amount',
  due_amount: 'Due Amount',
  commission: 'Commission',
};

interface Props {
  open: boolean;
  ticketId: string | null;
  ticketNumber?: string;
  onClose: () => void;
}

export function PriceHistoryModal({ open, ticketId, ticketNumber, onClose }: Props) {
  const [history, setHistory] = useState<PriceChangeEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !ticketId) return;
    setLoading(true);
    fetch(`/api/tickets/${ticketId}/price-history`)
      .then((r) => r.json())
      .then((j) => setHistory(j.data ?? []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [open, ticketId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <HistoryIcon color="primary" />
        Price Change History
        {ticketNumber && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', fontFamily: 'monospace' }}>
            {ticketNumber}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ p: 2 }}>
            {[1, 2].map((i) => <Skeleton key={i} height={80} sx={{ mb: 1 }} />)}
          </Box>
        ) : history.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>
            <HistoryIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
            <Typography variant="body2">No price changes recorded</Typography>
          </Box>
        ) : (
          history.map((entry, idx) => (
            <Box key={entry.id}>
              {idx > 0 && <Divider />}
              <Box sx={{ px: 3, py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {new Date(entry.changed_at).toLocaleString()}
                  </Typography>
                  {entry.changed_by && (
                    <Chip
                      label={entry.changed_by.full_name || entry.changed_by.username}
                      size="small"
                      variant="outlined"
                      sx={{ ml: 'auto' }}
                    />
                  )}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {entry.changes.map((ch) => {
                    const increased = ch.new > ch.old;
                    return (
                      <Box
                        key={ch.field}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                          px: 1.5,
                          py: 0.75,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110 }}>
                          {FIELD_LABELS[ch.field] ?? ch.field}
                        </Typography>
                        <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.disabled' }}>
                          {formatCurrency(ch.old)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">→</Typography>
                        <Typography variant="body2" fontWeight={600} color={increased ? 'success.main' : 'error.main'}>
                          {formatCurrency(ch.new)}
                        </Typography>
                        {increased
                          ? <TrendingUpIcon fontSize="small" color="success" sx={{ ml: 'auto' }} />
                          : <TrendingDownIcon fontSize="small" color="error" sx={{ ml: 'auto' }} />}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          ))
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
