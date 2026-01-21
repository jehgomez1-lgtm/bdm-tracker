
import React, { useState } from 'react';

interface LoginViewProps {
  onLogin: (identifier: string, pass: string) => Promise<void>;
  onRegister: () => void;
  isLoading: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onRegister, isLoading }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (identifier.trim() && password.trim()) {
      onLogin(identifier.trim(), password.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center stardust-bg p-6">
      <div className="bg-white/10 backdrop-blur-2xl p-10 md:p-14 rounded-[3.5rem] shadow-2xl border border-white/20 w-full max-w-lg animate-in zoom-in duration-500">
        <div className="mb-12 text-center">
          <div className="bg-indigo-600 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl animate-float">
            <i className="fa-solid fa-shield-halved text-white text-4xl"></i>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter italic leading-none">BDM Portal</h1>
          <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.4em] mt-4">Security Hub Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-2">Username or Email</label>
            <div className="relative">
              <i className="fa-solid fa-user absolute left-6 top-1/2 -translate-y-1/2 text-white/30"></i>
              <input 
                required
                autoComplete="username"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-white/20"
                placeholder="Enter 'admin'..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-2">Password</label>
            <div className="relative">
              <i className="fa-solid fa-lock absolute left-6 top-1/2 -translate-y-1/2 text-white/30"></i>
              <input 
                type="password" 
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-white/20"
                placeholder="Enter 'Admin2026'..."
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-6 rounded-3xl transition-all shadow-xl shadow-indigo-500/20 uppercase tracking-[0.3em] text-[11px] flex items-center justify-center active:scale-95 disabled:opacity-50"
          >
            {isLoading ? <i className="fa-solid fa-circle-notch animate-spin mr-3"></i> : <i className="fa-solid fa-right-to-bracket mr-3"></i>}
            {isLoading ? 'Verifying...' : 'Access Mission Control'}
          </button>
        </form>

        <div className="mt-10 pt-10 border-t border-white/5 text-center space-y-4">
          <div className="bg-indigo-500/10 rounded-2xl p-4 border border-indigo-500/20">
            <p className="text-indigo-200 text-[9px] font-black uppercase tracking-widest mb-1">System Default Login</p>
            <p className="text-white text-xs font-mono">
              User: <span className="text-indigo-300 select-all">admin</span><br/>
              Pass: <span className="text-indigo-300 select-all">Admin2026</span>
            </p>
          </div>
          <button 
            onClick={onRegister}
            className="text-indigo-400 hover:text-white font-black uppercase text-[10px] tracking-widest transition-colors"
          >
            New Personnel Registration →
          </button>
        </div>
      </div>
    </div>
  );
};
