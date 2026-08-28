import React, { useState } from 'react';
import { Building2, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, collegeSettings } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter your administrator username and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.message || 'Invalid username or password. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setUsername('devika');
    setPassword('Devika@23');
    setError('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 text-left">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-2xl text-left ring-1 ring-white/10">
          {/* College Header */}
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-slate-950 shadow-xl shadow-indigo-500/30 ring-2 ring-indigo-500/40">
              <img src="/logo.png" alt="FFMS VNR VJIET" className="h-full w-full object-cover" />
            </div>
            <h2 className="mt-4 text-xs font-extrabold uppercase tracking-wide text-indigo-400 line-clamp-2 px-2">
              {collegeSettings?.college_name || 'Vallurupalli Nageswara Rao Vignana Jyothi Institute of Engineering &Technology'}
            </h2>
            <h1 className="mt-1 text-xl font-extrabold text-white">
              {collegeSettings?.system_name || 'Faculty File Management System'}
            </h1>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 px-3 py-1 text-[11px] font-bold text-indigo-300">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              <span>DEPARTMENT OF CSE- (CYS, DS) & AI&DS</span>
            </div>
          </div>

          {/* Quick Demo Sign In Pill */}
          <div className="mt-5 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 p-3 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                <KeyRound className="h-3.5 w-3.5" />
                <span>Admin: Mrs. P. Devika</span>
              </div>
              <button
                type="button"
                onClick={handleQuickFill}
                className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-indigo-500 transition active:scale-95 cursor-pointer"
              >
                Auto Fill
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Username: <span className="font-mono text-indigo-300 font-bold">devika</span> &nbsp;|&nbsp; Password: <span className="font-mono text-indigo-300 font-bold">Devika@23</span>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 rounded-2xl bg-rose-950/80 p-3 text-xs font-medium text-rose-300 border border-rose-800 flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300">
                Administrator Username
              </label>
              <div className="relative mt-1.5">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. devika"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="e.g. Devika@23"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 pl-10 pr-10 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In as Administrator'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs font-medium text-slate-400">
          VNR VJIET • DEPARTMENT OF CSE- (CYS, DS) & AI&DS
        </p>
      </div>
    </div>
  );
}
