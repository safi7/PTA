'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import LoadingButton from '@mui/lab/LoadingButton';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { PageHeader } from '@/components/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/lib/types';
import { formatDate } from '@/lib/helpers';

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ username: '', email: '', full_name: '', password: '', role: 'admin' as 'admin' | 'super_admin' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setUsers(json.data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleActive = async (u: User) => {
    const res = await fetch(`/api/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !u.is_active }),
    });
    if (res.ok) fetchUsers();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/users/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error); }
      setDeleteId(null);
      fetchUsers();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const json = await res.json();
      if (!res.ok) { setCreateError(json.error ?? 'Failed to create user'); return; }
      setCreateOpen(false);
      setNewUser({ username: '', email: '', full_name: '', password: '', role: 'admin' });
      fetchUsers();
    } catch {
      setCreateError('Network error. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Users"
        subtitle="Manage admin accounts"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Users' }]}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            New User
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Username</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Last Login</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}
                  </TableRow>
                ))
              ) : users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{u.full_name}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{u.username}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{u.email}</TableCell>
                  <TableCell>
                    <Chip label={u.role.replace('_', ' ')} size="small" color={u.role === 'super_admin' ? 'primary' : 'default'} sx={{ textTransform: 'capitalize' }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={u.is_active ? 'Active' : 'Disabled'} size="small" color={u.is_active ? 'success' : 'error'} />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    {u.last_login_at ? formatDate(u.last_login_at, 'MMM DD, YYYY HH:mm') : '—'}
                  </TableCell>
                  <TableCell align="right">
                    {u.id !== currentUser?.id && (
                      <>
                        <Tooltip title={u.is_active ? 'Disable' : 'Enable'}>
                          <IconButton size="small" onClick={() => handleToggleActive(u)} color={u.is_active ? 'warning' : 'success'}>
                            {u.is_active ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteId(u.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create user dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
          <Box component="form" id="create-user-form" onSubmit={handleCreate} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Full Name" value={newUser.full_name} onChange={(e) => setNewUser((p) => ({ ...p, full_name: e.target.value }))} required fullWidth />
            <TextField label="Username" value={newUser.username} onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))} required fullWidth />
            <TextField label="Email" type="email" value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} required fullWidth />
            <TextField label="Password (min 8 chars)" type="password" value={newUser.password} onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} required fullWidth />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={newUser.role} label="Role" onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value as typeof newUser.role }))}>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="super_admin">Super Admin</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} disabled={createLoading}>Cancel</Button>
          <LoadingButton type="submit" form="create-user-form" variant="contained" loading={createLoading}>Create User</LoadingButton>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete User"
        message="This user will be permanently deleted and cannot be recovered."
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
}
