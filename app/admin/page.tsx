import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminIndexPage() {
  const user = await getSessionUser();
  if (user?.role === 'ADMIN') {
    redirect('/admin/dashboard');
  }
  redirect('/admin/login');
}
