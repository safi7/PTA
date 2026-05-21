'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

interface Props {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  color?: string;
  loading?: boolean;
}

export function StatsCard({ title, value, change, icon, color = '#1e40af', loading = false }: Props) {
  const isPositive = (change ?? 0) > 0;
  const isNeutral = change === undefined || change === 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: `${color}18`,
              color,
            }}
          >
            {icon}
          </Box>
        </Box>

        {loading ? (
          <>
            <Skeleton width="60%" height={36} />
            <Skeleton width="40%" height={20} sx={{ mt: 0.5 }} />
          </>
        ) : (
          <>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
              {value}
            </Typography>
            {change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {isNeutral ? (
                  <TrendingFlatIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                ) : isPositive ? (
                  <TrendingUpIcon fontSize="small" color="success" />
                ) : (
                  <TrendingDownIcon fontSize="small" color="error" />
                )}
                <Typography
                  variant="body2"
                  color={isNeutral ? 'text.secondary' : isPositive ? 'success.main' : 'error.main'}
                  fontWeight={500}
                >
                  {isNeutral ? 'No change' : `${isPositive ? '+' : ''}${change.toFixed(1)}% vs previous`}
                </Typography>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
