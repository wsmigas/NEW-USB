import React, { useState } from 'react';
import { DiscoUSB } from '../types';
import { Copy, Check, FileText, Pencil, Trash2, MessageSquare, MapPin } from 'lucide-react';

interface DiskCardProps {
  disco: DiscoUSB;
  isAdmin: boolean;
  onEdit: (disco: DiscoUSB) => void;
  onDelete: (id: number) => void;
  onViewReport: (disco: DiscoUSB) => void;
}

export const DiskCard: React.FC<DiskCardProps> = ({
  disco,
  isAdmin,
  onEdit,
  onDelete,
  onViewReport
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 1500);
  };

  return (
    <div className="rounded-xl border p-4 mb-3 transition-all duration-200 bg-white dark:bg-[#1a1e29] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        
        {/* 1. Arquivo e Remetente (col-span-2) */}
        <div className="md:col-span-2 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
              {disco.arquivo || '-'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" title={disco.remetente || '-'}>
            {disco.remetente || '-'}
          </p>
        </div>

        {/* 2. Datas e Ticket de Entrada (col-span-2) */}
        <div className="md:col-span-2 min-w-0">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono block">
            {disco.data_entrada || '-'}
          </span>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
            <span className="shrink-0 text-[11px]">Ticket:</span>
            {disco.ticket_num ? (
              <button
                type="button"
                onClick={() => handleCopy(disco.ticket_num, 'ticket_num')}
                className="group inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-mono transition-colors text-left truncate"
                title="Clique para copiar o número do ticket"
              >
                <span className="truncate">{disco.ticket_num}</span>
                {copiedField === 'ticket_num' ? (
                  <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                ) : (
                  <Copy className="w-3 h-3 text-blue-500 opacity-60 group-hover:opacity-100 shrink-0" />
                )}
              </button>
            ) : (
              <span>-</span>
            )}
          </div>
        </div>

        {/* 3. ID Disco, Projeto e Sala (Localização) (col-span-3) */}
        <div className="md:col-span-3 min-w-0">
          <button
            type="button"
            onClick={() => onEdit(disco)}
            className="font-bold text-sm text-blue-600 dark:text-blue-400 hover:underline text-left truncate block max-w-full"
            title="Editar disco"
          >
            {disco.id_disco || 'Sem ID'}
          </button>
          
          <div className="mt-1 flex items-center gap-2 flex-wrap text-xs">
            {disco.projeto && (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                Proj: {disco.projeto}
              </span>
            )}
            {disco.localizacao && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                <span className="truncate max-w-[120px]">{disco.localizacao}</span>
              </div>
            )}
          </div>
        </div>

        {/* 4. Capacidade, Marca e S/N (col-span-2) */}
        <div className="md:col-span-2 min-w-0">
          <div className="text-xs text-slate-800 dark:text-slate-200 font-medium truncate">
            {disco.tamanho_disco || '-'} {disco.marca ? `· ${disco.marca}` : ''}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5" title={`S/N: ${disco.numero_serie || '-'}`}>
            S/N: {disco.numero_serie || '-'}
          </div>
        </div>

        {/* 5. Badges de Estado V | I | A (col-span-1) */}
        <div className="md:col-span-1 flex items-center md:justify-center gap-1.5 py-1">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs ${
              disco.verificado ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
            title={`Verificado (V): ${disco.verificado ? 'SIM' : 'NÃO'}`}
          >
            V
          </span>
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs ${
              disco.integrado ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
            title={`Integrado (I): ${disco.integrado ? 'SIM' : 'NÃO'}`}
          >
            I
          </span>
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs ${
              disco.armazenado_servidor ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
            title={`Armazenado no Servidor (A): ${disco.armazenado_servidor ? 'SIM' : 'NÃO'}`}
          >
            A
          </span>
        </div>

        {/* 6. Ticket de Integração, Total Imagens & Ações (col-span-2) */}
        <div className="md:col-span-2 flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span className="shrink-0 text-[11px]">Ticket Integ:</span>
              {disco.ticket_integracao ? (
                <button
                  type="button"
                  onClick={() => handleCopy(disco.ticket_integracao, 'ticket_integracao')}
                  className="group inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-mono transition-colors text-left truncate"
                  title="Clique para copiar o ticket de integração"
                >
                  <span className="truncate">{disco.ticket_integracao}</span>
                  {copiedField === 'ticket_integracao' ? (
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                  ) : (
                    <Copy className="w-3 h-3 text-blue-500 opacity-60 group-hover:opacity-100 shrink-0" />
                  )}
                </button>
              ) : (
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                  {disco.integrado ? 'S/ Ticket' : '-'}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block mt-0.5">
              Total img: <strong className="text-slate-700 dark:text-slate-300 font-mono">{(disco.total_imagens || 0).toLocaleString('pt-PT')}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {disco.relatorio_path && (
              <button
                type="button"
                onClick={() => onViewReport(disco)}
                className="p-1.5 rounded-lg border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition-colors"
                title="Ver relatório de ficheiros Snap2HTML"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => onEdit(disco)}
              className="p-1.5 rounded-lg border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
              title="Editar registo"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => onDelete(disco.id)}
                className="p-1.5 rounded-lg border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Eliminar registo permanentemente"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Observações row */}
      {disco.observacoes && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
          <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
          <span className="leading-relaxed">{disco.observacoes}</span>
        </div>
      )}
    </div>
  );
};
