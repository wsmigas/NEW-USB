import React from 'react';
import { HardDrive, Plus, Download, Upload, Users, LogOut, Sun, Moon, FileSpreadsheet, Database } from 'lucide-react';
import { Usuario } from '../types';

interface NavbarProps {
  currentUser: Usuario | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenNovo: () => void;
  onExportCsv: () => void;
  onDownloadTemplate: () => void;
  onOpenImport: () => void;
  onOpenUsers: () => void;
  onOpenDatabaseStatus: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  theme,
  onToggleTheme,
  onOpenNovo,
  onExportCsv,
  onDownloadTemplate,
  onOpenImport,
  onOpenUsers,
  onOpenDatabaseStatus,
  onLogout
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors bg-white/90 border-slate-200 text-slate-900 dark:bg-[#151821]/95 dark:border-slate-800 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Zone 1: Brand Title with icon */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                RIDIS
              </span>
              <span className="hidden sm:inline text-xs font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                DGLAB
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block leading-none mt-0.5">
              Gestão de Discos USB e Matrizes de Digitalização
            </p>
          </div>
        </div>

        {/* Zone 2: User profile & Theme switcher */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {currentUser.username}
              </span>
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide ${
                currentUser.is_admin 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300' 
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {currentUser.is_admin ? 'Admin' : 'Operador'}
              </span>
            </div>
          )}

          {/* Theme Switcher Toggle */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => theme !== 'light' && onToggleTheme()}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                theme === 'light' 
                  ? 'bg-white text-amber-600 shadow-xs' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Modo Claro"
              aria-label="Modo Claro"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => theme !== 'dark' && onToggleTheme()}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                theme === 'dark' 
                  ? 'bg-slate-700 text-blue-400 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
              title="Modo Escuro"
              aria-label="Modo Escuro"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={onOpenNovo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-98 shadow-sm transition-all"
            title="Registar novo disco USB"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Registo</span>
          </button>

          <button
            onClick={onDownloadTemplate}
            className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-cyan-500/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition-colors"
            title="Descarregar ficheiro template CSV modelo"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Template</span>
          </button>

          <button
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-emerald-600/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
            title="Exportar registos filtrados para formato CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            onClick={onOpenImport}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
            title="Importar discos via CSV"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Importar</span>
          </button>

          <button
            onClick={onOpenDatabaseStatus}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/50 transition-colors"
            title="Ver estado e descarregar base de dados SQLite 3 (gestao_discos.db)"
          >
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden md:inline font-mono">SQLite 3</span>
          </button>

          {currentUser?.is_admin && (
            <button
              onClick={onOpenUsers}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Gestão de Utilizadores"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Utilizadores</span>
            </button>
          )}

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Terminar sessão de utilizador"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>

      </div>
    </header>
  );
};
