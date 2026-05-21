'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import FlightRoundedIcon from '@mui/icons-material/FlightRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import { useAuthStore } from '@/stores/authStore';

const DRAWER_WIDTH = 260;

const iconMap: Record<string, React.ElementType> = {
  DashboardRounded: DashboardRoundedIcon,
  FlightRounded: FlightRoundedIcon,
  AssessmentRounded: AssessmentRoundedIcon,
  PeopleRounded: PeopleRoundedIcon,
  HistoryRounded: HistoryRoundedIcon,
  ListAltRounded: ListAltRoundedIcon,
  AddCircleRounded: AddCircleRoundedIcon,
};

interface NavItem {
  label: string;
  path: string;
  icon: string;
  children?: { label: string; path: string; icon: string }[];
  superAdminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'DashboardRounded' },
  {
    label: 'Tickets', path: '/tickets', icon: 'FlightRounded',
    children: [
      { label: 'All Tickets', path: '/tickets', icon: 'ListAltRounded' },
      { label: 'New Ticket', path: '/tickets/add', icon: 'AddCircleRounded' },
    ],
  },
  { label: 'Reports', path: '/reports', icon: 'AssessmentRounded' },
  { label: 'Users', path: '/users', icon: 'PeopleRounded', superAdminOnly: true },
  { label: 'Audit Log', path: '/audit', icon: 'HistoryRounded', superAdminOnly: true },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

function NavItems({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [expanded, setExpanded] = useState<string[]>(['/tickets']);

  const isSuperAdmin = user?.role === 'super_admin';

  const toggleExpand = (path: string) => {
    setExpanded((prev) => prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]);
  };

  const isActive = (path: string) => pathname === path;
  const isParentActive = (item: NavItem) =>
    item.children?.some((c) => pathname.startsWith(c.path)) ?? false;

  return (
    <List component="nav" sx={{ px: 1.5, py: 1 }}>
      {navItems.map((item) => {
        if (item.superAdminOnly && !isSuperAdmin) return null;
        const Icon = iconMap[item.icon];
        const hasChildren = item.children && item.children.length > 0;
        const isOpen = expanded.includes(item.path);
        const parentActive = isParentActive(item);

        return (
          <Box key={item.path}>
            <ListItemButton
              component={hasChildren ? 'div' : NextLink}
              {...(!hasChildren && { href: item.path, onClick: onClose })}
              onClick={hasChildren ? () => toggleExpand(item.path) : undefined}
              selected={!hasChildren && isActive(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                color: parentActive || isActive(item.path) ? 'primary.main' : 'text.secondary',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '& .MuiListItemIcon-root': { color: 'white' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
              {hasChildren && (isOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />)}
            </ListItemButton>

            {hasChildren && (
              <Collapse in={isOpen}>
                <List disablePadding sx={{ pl: 2 }}>
                  {item.children!.map((child) => {
                    const ChildIcon = iconMap[child.icon];
                    return (
                      <ListItemButton
                        key={child.path}
                        component={NextLink}
                        href={child.path}
                        onClick={onClose}
                        selected={isActive(child.path)}
                        sx={{
                          borderRadius: 2, mb: 0.5,
                          '&.Mui-selected': {
                            bgcolor: 'primary.main', color: 'white',
                            '&:hover': { bgcolor: 'primary.dark' },
                            '& .MuiListItemIcon-root': { color: 'white' },
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                          <ChildIcon sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText primary={child.label} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Collapse>
            )}
          </Box>
        );
      })}
    </List>
  );
}

function DrawerContent({ onClose }: { onClose: () => void }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 3, py: 2.5 }}>
        <Typography variant="h6" fontWeight={800} color="primary.main">PTA</Typography>
        <Typography variant="caption" color="text.secondary">Passenger Travel Agency</Typography>
      </Box>
      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <NavItems onClose={onClose} />
      </Box>
    </Box>
  );
}

export function Sidebar({ open, onClose }: Props) {
  return (
    <>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <DrawerContent onClose={onClose} />
      </Drawer>

      {/* Desktop permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
        open
      >
        <DrawerContent onClose={() => {}} />
      </Drawer>
    </>
  );
}
