'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { ChartDataPoint } from '@/lib/types';

interface Props {
  data: ChartDataPoint[];
  loading?: boolean;
}

function formatY(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value}`;
}

export function SalesChart({ data, loading = false }: Props) {
  if (loading) {
    return (
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Skeleton width={200} height={28} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={300} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Revenue Overview"
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
        sx={{ pb: 0 }}
      />
      <CardContent>
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} />
              <YAxis tickFormatter={formatY} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'Tickets' ? String(value) : `$${value.toLocaleString()}`,
                  name,
                ]}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#1e40af" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="commission" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Commission" />
              <Line dataKey="tickets" stroke="#059669" strokeWidth={2} dot={false} name="Tickets" />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
