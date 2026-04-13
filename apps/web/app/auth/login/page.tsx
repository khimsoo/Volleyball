'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('Login result', { data, error });

    if (error || !data.session) {
      setError(error?.message ?? 'Login failed');
      setLoading(false);
      return;
    }

    if (data.session) {
      const { error: setSessionError } = await supabase.auth.setSession(data.session);
      console.log('Login setSession result', { setSessionError });
      if (setSessionError) {
        setError('Failed to establish session');
        setLoading(false);
        return;
      }
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
          <p className="text-slate-400 text-sm mt-1">Sign in to your coach dashboard</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5
                           text-white placeholder:text-slate-500 text-sm focus:outline-none
                           focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="coach@school.edu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5
                           text-white placeholder:text-slate-500 text-sm focus:outline-none
                           focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="••••••••"
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
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            New coach?{' '}
            <Link href="/auth/signup" className="text-brand-400 hover:text-brand-300 font-medium">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
