import type { ElementType } from 'react';

export interface NavItem {
  label: string;
  path: string;
  icon: ElementType;
  children?: Omit<NavItem, 'children'>[];
  superAdminOnly?: boolean;
}

export const navigationConfig: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'DashboardRounded' as unknown as ElementType,
  },
  {
    label: 'Tickets',
    path: '/tickets',
    icon: 'FlightRounded' as unknown as ElementType,
    children: [
      { label: 'All Tickets', path: '/tickets', icon: 'ListAltRounded' as unknown as ElementType },
      { label: 'New Ticket', path: '/tickets/add', icon: 'AddCircleRounded' as unknown as ElementType },
    ],
  },
  {
    label: 'Outstanding Dues',
    path: '/dues',
    icon: 'AccountBalanceWalletRounded' as unknown as ElementType,
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: 'AssessmentRounded' as unknown as ElementType,
  },
  {
    label: 'Users',
    path: '/users',
    icon: 'PeopleRounded' as unknown as ElementType,
    superAdminOnly: true,
  },
  {
    label: 'Audit Log',
    path: '/audit',
    icon: 'HistoryRounded' as unknown as ElementType,
    superAdminOnly: true,
  },
];
