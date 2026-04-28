import Link from 'next/link';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import { isAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await isAuthenticated()) {
    redirect('/');
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8B0000]">
            Resume Admin
          </p>
          <h1 className="mt-2 text-3xl font-black text-gray-900">Owner sign in</h1>
          <p className="mt-2 text-sm text-gray-600">
            Editing is restricted to the resume owner. Public visitors can still read the resume.
          </p>
        </div>

        <LoginForm />

        <p className="mt-4 text-center text-sm text-gray-500">
          <Link href="/" className="text-[#8B0000] hover:underline">
            Return to resume
          </Link>
        </p>
      </div>
    </div>
  );
}
