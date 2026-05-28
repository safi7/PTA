'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Providers } from '@/components/Providers';
import { DashboardLayout } from '@/components/Layout';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { BackupReminderModal } from '@/components/BackupReminderModal';
import { useAuthStore } from '@/stores/authStore';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, fetchMe } = useAuthStore();
  const router = useRouter();
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [backupChecked, setBackupChecked] = useState(false);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || backupChecked) return;
    setBackupChecked(true);
    fetch('/api/backup/status')
      .then((r) => r.json())
      .then(({ data }) => {
        if (data?.should_show) setBackupModalOpen(true);
      })
      .catch(() => {/* non-critical */});
  }, [isAuthenticated, backupChecked]);

  if (isLoading) return <LoadingSpinner fullScreen message="Loading..." />;
  if (!isAuthenticated) return null;

  return (
    <>
      {children}
      <BackupReminderModal open={backupModalOpen} onClose={() => setBackupModalOpen(false)} />
    </>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AuthGuard>
        <DashboardLayout>{children}</DashboardLayout>
      </AuthGuard>
    </Providers>
  );
}
