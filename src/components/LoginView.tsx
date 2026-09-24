import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { Usuario } from '../types';
import { HardDrive, AlertCircle, ArrowRight, ShieldCheck, User } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: Usuario) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const users = StorageService.getUsuarios();

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser) {
      setError('Indique o nome de utilizador.');
      return;
    }

    const matched = users.find(u => u.username.toLowerCase() === cleanUser);
    if (!matched) {
      // In this system, allow any known user or create a temporary session
      setError('Utilizador não registado na base de dados.');
      return;
    }

    StorageService.setCurrentUser(matched);
    onLoginSuccess(matched);
  };

  const handleQuickLogin = (user: Usuario) => {
    StorageService.setCurrentUser(user);
    onLoginSuccess(user);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#10131a] text-[#e1e1e6] flex flex-col justify-between overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background Grid Pattern */}
      <div 
        className="fixed inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(110, 168, 254, 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(110, 168, 254, 0.07) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Radial Glow */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 900px 600px at 85% 15%, rgba(13, 110, 253, 0.16), transparent 60%),
            radial-gradient(ellipse 700px 500px at 10% 90%, rgba(13, 110, 253, 0.10), transparent 60%)
          `
        }}
      />

      {/* SVG Disk Illustration */}
      <svg
        className="fixed -right-36 -bottom-36 w-[560px] h-[560px] md:w-[720px] md:h-[720px] z-0 opacity-80 pointer-events-none"
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="platterGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2a3040" />
            <stop offset="70%" stopColor="#1a1f2b" />
            <stop offset="100%" stopColor="#12151e" />
          </radialGradient>
          <linearGradient id="armGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3a4152" />
            <stop offset="100%" stopColor="#232833" />
          </linearGradient>
        </defs>

        <circle cx="200" cy="200" r="190" fill="url(#platterGrad)" stroke="#333c4d" strokeWidth="1" />
        <circle cx="200" cy="200" r="150" fill="none" stroke="#0d6efd" strokeWidth="0.6" opacity="0.25" />
        <circle cx="200" cy="200" r="115" fill="none" stroke="#0d6efd" strokeWidth="0.6" opacity="0.20" />
        <circle cx="200" cy="200" r="80" fill="none" stroke="#0d6efd" strokeWidth="0.6" opacity="0.16" />
        <circle cx="200" cy="200" r="45" fill="#1a1f2b" stroke="#333c4d" strokeWidth="1" />
        <circle cx="200" cy="200" r="14" fill="#0d6efd" opacity="0.55" />
        <circle cx="200" cy="200" r="5" fill="#e1e1e6" opacity="0.8" />

        <g transform="rotate(28 200 200)">
          <rect x="196" y="30" width="8" height="150" rx="4" fill="url(#armGrad)" />
          <circle cx="200" cy="30" r="13" fill="url(#armGrad)" stroke="#0d6efd" strokeWidth="1.2" opacity="0.9" />
        </g>

        <circle cx="55" cy="55" r="5" fill="#333c4d" />
        <circle cx="345" cy="55" r="5" fill="#333c4d" />
        <circle cx="55" cy="345" r="5" fill="#333c4d" />
        <circle cx="345" cy="345" r="5" fill="#333c4d" />
      </svg>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-[#1e212b]/80 backdrop-blur-xl shadow-2xl p-7 sm:p-9 transition-all">
          
          {/* Logo Mark */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <HardDrive className="w-7 h-7 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-center tracking-tight text-white mb-1">
            RIDIS
          </h1>
          <p className="text-xs text-center text-slate-400 leading-relaxed mb-6">
            Registo e Inventário de Discos USB e Matrizes<br />
            <strong className="text-slate-300 font-semibold">Direção-Geral do Livro, dos Arquivos e das Bibliotecas</strong>
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg border bg-rose-950/70 border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Utilizador
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: jmagalhaes"
                required
                autoFocus
                className="w-full text-xs rounded-xl px-3.5 py-2.5 bg-[#10131a]/80 border border-white/15 text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Palavra-passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full text-xs rounded-xl px-3.5 py-2.5 bg-[#10131a]/80 border border-white/15 text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:scale-98 shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              <span>Entrar no Sistema</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick preset logins */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <span className="text-[11px] text-slate-400 block mb-2 font-medium">
              Contas de demonstração para acesso direto:
            </span>
            <div className="flex flex-col gap-2">
              {users.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-slate-300 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {u.is_admin ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span className="font-mono font-medium">{u.username}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase">
                    {u.is_admin ? 'Admin' : 'Operador'}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-4 px-4 text-[11px] text-slate-500 leading-relaxed">
        <strong className="text-slate-400 font-semibold">DGLAB</strong> — Direção-Geral do Livro, dos Arquivos e das Bibliotecas
        <span className="mx-2 opacity-50">·</span>
        Serviços Centrais de Arquivo
        <br />
        Sistema de uso interno e exclusivo — Gestão de Suportes Físicos e Matrizes
      </footer>
    </div>
  );
};
