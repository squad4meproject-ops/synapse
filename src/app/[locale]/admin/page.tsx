import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isUserAdmin } from '@/lib/queries/admin';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('admin');
  return {
    title: t('title'),
  };
}

export default async function AdminPage() {
  const t = await getTranslations('admin');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const isAdmin = await isUserAdmin(user.id);
  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{t('notAdmin')}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{t('notAdminDesc')}</p>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}
