export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  from_location: string;
  to_location: string;
  departure_date: string;
  return_date: string | null;
  airline: string | null;
  original_price: number;
  sold_price: number;
  paid_amount: number;
  due_amount: number;
  commission: number;
  status: 'pending' | 'paid' | 'cancelled';
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: Pick<User, 'id' | 'username' | 'full_name'>;
  has_price_changes?: boolean;
}

export interface PriceChangeEntry {
  id: string;
  changed_at: string;
  changed_by: { username: string; full_name: string } | null;
  changes: { field: string; old: number; new: number }[];
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: Pick<User, 'id' | 'username' | 'full_name'>;
}

export interface DashboardStats {
  totalRevenue: number;
  totalTickets: number;
  totalCommission: number;
  totalDue: number;
  revenueChange: number;
  ticketsChange: number;
  commissionChange: number;
  period: string;
  startDate: string;
  endDate: string;
}

export interface ChartDataPoint {
  date: string;
  revenue: number;
  tickets: number;
  commission: number;
}

export interface MonthlyReport {
  month: string;
  monthNum: number;
  revenue: number;
  originalCost: number;
  commission: number;
  paid: number;
  due: number;
  tickets: number;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type Period = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'this_year' | 'custom';
