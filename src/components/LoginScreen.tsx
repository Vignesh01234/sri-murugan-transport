import React, { useState } from 'react';
import { 
  Lock, User, Shield, CheckCircle2, AlertCircle, 
  HardDrive, KeyRound, ArrowRight, Laptop, Sparkles, Download 
} from 'lucide-react';
import type { User as UserType } from '../types/index';
import { api, DEFAULT_USERS } from '../services/api';
import { TransportLogo } from './TransportLogo';

interface Props {
  onLoginSuccess: (user: UserType) => void;
  onOpenInstallModal?: () => void;
}

export const LoginScreen: React.FC<Props> = ({ onLoginSuccess, onOpenInstallModal }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await api.login(username, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (userItem: typeof DEFAULT_USERS[number]) => {
    setUsername(userItem.username);
    setPassword(userItem.password);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Card Header with Transport Logo */}
        <div className="bg-slate-900 p-6 text-white text-center border-b border-slate-800 relative">
          <div className="flex justify-center mb-3">
            <div className="p-2 bg-slate-800/80 rounded-2xl border border-slate-700 shadow-inner">
              <TransportLogo size="lg" />
            </div>
          </div>
          <h1 className="text-xl font-black uppercase tracking-wider text-white">
            SRI MURUGAN TRANSPORT
          </h1>
          <p className="text-xs text-blue-300 font-semibold mt-1">
            Transport Management System (TMS)
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded-full text-[11px] text-emerald-300 font-medium">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Offline Local PC Disk Storage</span>
          </div>
        </div>

        {/* Login Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">User Sign In</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your credentials to manage LRs, payments, and fleet records.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 font-medium animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Username / User ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. admin or staff1"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-slate-900 bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password or 4-Digit PIN
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password or PIN (e.g. 1234)"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-slate-900 bg-slate-50/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Remember session on this PC</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? 'Verifying Offline Credentials...' : 'Sign In to Sri Murugan TMS'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Demo Accounts */}
          <div className="pt-2 border-t border-slate-100">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Quick 1-Click Offline Logins:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_USERS.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u)}
                  className={`p-2 text-left rounded-lg border text-xs transition-all ${
                    username === u.username
                      ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-bold'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-medium'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{u.role.replace('Administrator', 'Admin')}</span>
                    {username === u.username && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {u.username} / {u.password}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 text-center flex items-center justify-between text-[11px] text-slate-500">
          {onOpenInstallModal ? (
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="flex items-center gap-1.5 font-bold text-blue-700 hover:text-blue-900 cursor-pointer py-1 px-2.5 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PC Offline App</span>
            </button>
          ) : (
            <span className="flex items-center gap-1 font-medium">
              <Laptop className="w-3.5 h-3.5 text-blue-600" />
              Runs locally on this PC
            </span>
          )}
          <span className="text-slate-500 font-mono font-semibold">100% Offline PC Edition</span>
        </div>
      </div>
    </div>
  );
};
