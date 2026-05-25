'use client';

import { useState, useRef } from 'react';
import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { z } from 'zod';
import { PageHeader } from '@/components/PageHeader';
import { parseCSV, downloadCSV } from '@/lib/helpers/csv';

const COLUMN_GUIDE = [
  { name: 'client_name', required: true, type: 'text', example: 'John Doe' },
  { name: 'client_phone', required: false, type: 'text', example: '+1 555 0100' },
  { name: 'client_email', required: false, type: 'email', example: 'john@example.com' },
  { name: 'from_location', required: true, type: 'text', example: 'New York' },
  { name: 'to_location', required: true, type: 'text', example: 'London' },
  { name: 'departure_date', required: true, type: 'YYYY-MM-DD', example: '2025-06-15' },
  { name: 'return_date', required: false, type: 'YYYY-MM-DD', example: '2025-06-30' },
  { name: 'airline', required: false, type: 'text', example: 'British Airways' },
  { name: 'original_price', required: true, type: 'number', example: '800' },
  { name: 'sold_price', required: true, type: 'number', example: '950' },
  { name: 'paid_amount', required: true, type: 'number', example: '950' },
  { name: 'status', required: false, type: 'pending | paid | cancelled', example: 'pending' },
  { name: 'notes', required: false, type: 'text', example: 'Aisle seat requested' },
];

const TEMPLATE_ROW = {
  client_name: 'John Doe', client_phone: '+1 555 0100', client_email: 'john@example.com',
  from_location: 'New York', to_location: 'London', departure_date: '2025-06-15',
  return_date: '2025-06-30', airline: 'British Airways',
  original_price: 800, sold_price: 950, paid_amount: 950, status: 'pending', notes: '',
};

const rowSchema = z.object({
  client_name: z.string().min(1, 'client_name is required'),
  client_phone: z.string().optional(),
  client_email: z.union([z.string().email('Invalid email'), z.literal('')]).optional(),
  from_location: z.string().min(1, 'from_location is required'),
  to_location: z.string().min(1, 'to_location is required'),
  departure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'departure_date must be YYYY-MM-DD'),
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  airline: z.string().optional(),
  original_price: z.coerce.number({ invalid_type_error: 'original_price must be a number' }).min(0),
  sold_price: z.coerce.number({ invalid_type_error: 'sold_price must be a number' }).min(0),
  paid_amount: z.coerce.number({ invalid_type_error: 'paid_amount must be a number' }).min(0),
  status: z.enum(['pending', 'paid', 'cancelled']).optional().default('pending'),
  notes: z.string().optional(),
});

interface ParsedRow {
  index: number;
  data: Record<string, string>;
  error: string | null;
}

interface ImportResult {
  created: number;
  errors: { row: number; message: string }[];
}

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const validRows = rows.filter((r) => !r.error);
  const invalidRows = rows.filter((r) => r.error);

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setFileError('Please upload a .csv file.');
      return;
    }
    setFileError(null);
    setResult(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { rows: rawRows } = parseCSV(text);
      const parsed: ParsedRow[] = rawRows.map((row, i) => {
        const res = rowSchema.safeParse(row);
        return {
          index: i + 1,
          data: row,
          error: res.success ? null : res.error.errors[0].message,
        };
      });
      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    try {
      const tickets = validRows.map((r) => {
        const parsed = rowSchema.parse(r.data);
        return {
          ...parsed,
          client_phone: parsed.client_phone || null,
          client_email: parsed.client_email || null,
          return_date: parsed.return_date || null,
          airline: parsed.airline || null,
          notes: parsed.notes || null,
        };
      });
      const res = await fetch('/api/tickets/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickets }),
      });
      const json = await res.json();
      setResult(json);
      if (json.created > 0) setRows([]);
    } catch {
      setFileError('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Import Tickets"
        subtitle="Upload a CSV file to bulk-create tickets"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Tickets', href: '/tickets' },
          { label: 'Import CSV' },
        ]}
        actions={
          <Button component={NextLink} href="/tickets" variant="outlined" startIcon={<ArrowBackIcon />} size="small">
            Back to Tickets
          </Button>
        }
      />

      {/* Column guide */}
      <Accordion defaultExpanded sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={600}>CSV Column Format Guide</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Column Name</TableCell>
                  <TableCell>Required</TableCell>
                  <TableCell>Type / Format</TableCell>
                  <TableCell>Example</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {COLUMN_GUIDE.map((col) => (
                  <TableRow key={col.name}>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{col.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={col.required ? 'Required' : 'Optional'}
                        size="small"
                        color={col.required ? 'primary' : 'default'}
                        variant={col.required ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{col.type}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' }}>{col.example}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => downloadCSV([TEMPLATE_ROW as unknown as Record<string, unknown>], 'tickets-template.csv')}
            >
              Download Template CSV
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Result banner */}
      {result && (
        <Alert
          severity={result.errors.length === 0 ? 'success' : result.created > 0 ? 'warning' : 'error'}
          sx={{ mb: 3 }}
          onClose={() => setResult(null)}
        >
          {result.created > 0 && <strong>{result.created} ticket{result.created !== 1 ? 's' : ''} imported successfully. </strong>}
          {result.errors.length > 0 && (
            <>
              {result.errors.length} row{result.errors.length !== 1 ? 's' : ''} failed:{' '}
              {result.errors.slice(0, 3).map((e) => `Row ${e.row}: ${e.message}`).join('; ')}
              {result.errors.length > 3 && ` and ${result.errors.length - 3} more.`}
            </>
          )}
        </Alert>
      )}

      {fileError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setFileError(null)}>{fileError}</Alert>
      )}

      {/* Upload area */}
      {rows.length === 0 && (
        <Card>
          <CardContent>
            <Box
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                py: 6,
                px: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'pointer',
                transition: 'border-color 0.15s',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <UploadFileIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
              <Typography variant="h6" color="text.secondary">Drop your CSV file here</Typography>
              <Typography variant="body2" color="text.disabled">or click to browse</Typography>
              <Button variant="outlined" size="small" sx={{ mt: 1 }} component="span">
                Choose File
              </Button>
            </Box>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              hidden
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {rows.length > 0 && (
        <Card>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h6" fontWeight={600}>Preview — {fileName}</Typography>
                <Chip label={`${validRows.length} valid`} color="success" size="small" icon={<CheckCircleIcon />} />
                {invalidRows.length > 0 && (
                  <Chip label={`${invalidRows.length} invalid`} color="error" size="small" icon={<ErrorIcon />} />
                )}
              </Box>
            }
            action={
              <Box sx={{ display: 'flex', gap: 1, mr: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => { setRows([]); setFileName(''); }}
                >
                  Clear
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleImport}
                  disabled={importing || validRows.length === 0}
                >
                  {importing ? 'Importing…' : `Import ${validRows.length} Row${validRows.length !== 1 ? 's' : ''}`}
                </Button>
              </Box>
            }
          />
          {importing && <LinearProgress />}
          <Divider />
          <TableContainer sx={{ maxHeight: 480 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 48 }}>#</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Route</TableCell>
                  <TableCell>Departure</TableCell>
                  <TableCell align="right">Original</TableCell>
                  <TableCell align="right">Sold</TableCell>
                  <TableCell align="right">Paid</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell sx={{ width: 200 }}>Validation</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.index}
                    sx={{ bgcolor: row.error ? 'error.50' : 'inherit', opacity: row.error ? 0.85 : 1 }}
                  >
                    <TableCell sx={{ color: 'text.disabled', fontFamily: 'monospace' }}>{row.index}</TableCell>
                    <TableCell>{row.data.client_name || '—'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {row.data.from_location} → {row.data.to_location}
                    </TableCell>
                    <TableCell>{row.data.departure_date || '—'}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{row.data.original_price || '—'}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{row.data.sold_price || '—'}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{row.data.paid_amount || '—'}</TableCell>
                    <TableCell>{row.data.status || 'pending'}</TableCell>
                    <TableCell>
                      {row.error ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'error.main' }}>
                          <ErrorIcon sx={{ fontSize: 14 }} />
                          <Typography variant="caption">{row.error}</Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
                          <CheckCircleIcon sx={{ fontSize: 14 }} />
                          <Typography variant="caption">Valid</Typography>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}
