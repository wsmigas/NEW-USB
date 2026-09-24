import React from 'react';
import { DatabaseStatus } from '../types';
import { StorageService } from '../services/storage';
import { X, Database, Download, CheckCircle2, Server, HardDrive, ShieldCheck, Terminal } from 'lucide-react';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: DatabaseStatus | null;
  onOpenImport?: () => void;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({
  isOpen,
  onClose,
  status,
  onOpenImport
}) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    StorageService.downloadSqliteDb();
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-xl rounded-2xl border bg-white dark:bg-[#1a1e29] border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151821]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Base de Dados SQLite 3
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Estado do armazenamento persistente do RIDIS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status banner */}
          <div className="p-4 rounded-xl border bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold text-emerald-900 dark:text-emerald-200 block mb-0.5">
                Base de dados SQLite 3 ativa e sincronizada em disco
              </span>
              <p className="text-emerald-800 dark:text-emerald-300">
                Todos os registos de discos USB, utilizadores, relatórios Snap2HTML e métricas são gravados no ficheiro binário padrão <code>gestao_discos.db</code>.
              </p>
            </div>
          </div>

          {/* Properties grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border bg-slate-50 dark:bg-[#12151e] border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px] mb-1 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-blue-500" />
                <span>Motor / Tipo</span>
              </span>
              <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                {status?.dbType || 'SQLite 3'}
              </span>
            </div>

            <div className="p-3 rounded-lg border bg-slate-50 dark:bg-[#12151e] border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px] mb-1 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-cyan-500" />
                <span>Ficheiro da BD</span>
              </span>
              <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                {status?.filename || 'gestao_discos.db'}
              </span>
            </div>

            <div className="p-3 rounded-lg border bg-slate-50 dark:bg-[#12151e] border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px] mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Total de Discos Gravados</span>
              </span>
              <span className="font-bold font-mono text-blue-600 dark:text-blue-400 text-sm">
                {status?.totalDiscos ?? '-'}
              </span>
            </div>

            <div className="p-3 rounded-lg border bg-slate-50 dark:bg-[#12151e] border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px] mb-1">
                Tamanho do Ficheiro em Disco
              </span>
              <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                {status ? formatBytes(status.sizeBytes) : 'Disponível'}
              </span>
            </div>
          </div>

          {/* SQLite schema info */}
          <div className="p-3.5 rounded-lg border bg-slate-900 text-slate-200 border-slate-800 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-slate-400 mb-2 font-sans font-semibold text-xs">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Compatibilidade e Linha de Comandos</span>
            </div>
            <p className="text-slate-300 font-sans text-xs mb-2">
              Pode descarregar o ficheiro e colocá-lo diretamente no seu servidor Linux:
            </p>
            <div className="bg-black/60 p-2.5 rounded border border-white/10 text-emerald-400 select-all overflow-x-auto">
              # Copiar para o diretório da aplicação:<br />
              cp gestao_discos.db /opt/app_nr/gestao_discos.db<br />
              # Ou inspecionar via terminal:<br />
              sqlite3 gestao_discos.db "SELECT ticket_num, numero_serie, arquivo FROM discos_usb;"
            </div>
          </div>

          {/* Download & Upload Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col justify-between p-3.5 rounded-xl border bg-slate-50 dark:bg-[#12151e] border-slate-200 dark:border-slate-800">
              <div className="mb-2.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Exportar Cópia de Segurança
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Descarregue o ficheiro binário <code>gestao_discos.db</code>.
                </span>
              </div>

              <button
                onClick={handleDownload}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descarregar .db</span>
              </button>
            </div>

            {onOpenImport && (
              <div className="flex flex-col justify-between p-3.5 rounded-xl border bg-emerald-50/50 dark:bg-[#121d18] border-emerald-200 dark:border-emerald-900/60">
                <div className="mb-2.5">
                  <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 block">
                    Restaurar Base Antiga
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Carregar ficheiro <code>gestao_discos.db</code> antigo ou relatórios Snap2HTML.
                  </span>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenImport();
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-colors"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Importar Ficheiro .db</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151821] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
