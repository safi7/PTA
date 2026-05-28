'use client';

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import BackupIcon from '@mui/icons-material/Backup';
import DownloadIcon from '@mui/icons-material/Download';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function BackupReminderModal({ open, onClose }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/backup/export');
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename =
        res.headers.get('content-disposition')?.match(/filename="(.+?)"/)?.[1] ??
        `pta-backup-${new Date().toISOString().slice(0, 10)}.csv`;
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch {
      // If export fails, still close — user can retry next time
      onClose();
    } finally {
      setDownloading(false);
    }
  };

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      await fetch('/api/backup/dismiss', { method: 'POST' });
    } finally {
      setDismissing(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} maxWidth="sm" fullWidth disableEscapeKeyDown>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 3 }}>
        <BackupIcon color="primary" />
        Weekly Backup Reminder
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 1 }}>
          <DialogContentText>
            It has been over a week since the last data backup. We recommend downloading a backup
            of all tickets from this year to keep your records safe.
          </DialogContentText>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          The backup will include all tickets from January 1st of this year through today, exported as a CSV file.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={handleDismiss}
          disabled={downloading || dismissing}
          color="inherit"
          variant="outlined"
        >
          {dismissing ? 'Dismissing…' : 'Remind me tomorrow'}
        </Button>
        <LoadingButton
          onClick={handleDownload}
          loading={downloading}
          loadingPosition="start"
          startIcon={<DownloadIcon />}
          variant="contained"
          disabled={dismissing}
        >
          Download Backup
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
