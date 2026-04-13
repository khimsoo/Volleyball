'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    orgName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1. Create auth user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Signup failed');
      setLoading(false);
      return;
    }

    // 2. If session was returned in signup response, set it explicitly
    // This ensures the RPC call has proper authentication context
    if (data.session) {
      const { error: setSessionError } = await supabase.auth.setSession(data.session);
      if (setSessionError) {
        setError('Failed to establish session');
        setLoading(false);
        return;
      }
    }

    // 3. Bootstrap org + user profile via RPC
    const { error: rpcError } = await supabase.rpc('bootstrap_coach_organization', {
      p_first_name: form.firstName,
      p_last_name: form.lastName,
      p_org_name: form.orgName,
    });

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🏐</span>
          <h1 className="text-2xl font-black text-white mt-3">VolleyTrainer</h1>
          <p className="text-slate-400 text-sm mt-1">Create your coach account</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">First name</label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={set('firstName')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5
                             text-white text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Last name</label>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={set('lastName')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5
                             text-white text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">School / Club name</label>
              <input
                type="text"
                required
                value={form.orgName}
                onChange={set('orgName')}
                placeholder="e.g. Singapore Sports School"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5
                           text-white placeholder:text-slate-500 text-sm focus:outline-none
                           focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={set('email')}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5
                           text-white placeholder:text-slate-500 text-sm focus:outline-none
                           focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={set('password')}
                placeholder="Min. 8 characters"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5
                           text-white placeholder:text-slate-500 text-sm focus:outline-none
                           focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-sm mt-2"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
