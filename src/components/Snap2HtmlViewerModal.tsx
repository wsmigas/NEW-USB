import React, { useState, useEffect } from 'react';
import { DiscoUSB } from '../types';
import { StorageService } from '../services/storage';
import {
  X,
  Search,
  FileText,
  Copy,
  Check,
  FolderOpen,
  ExternalLink,
  Layers,
  Globe,
  Loader2
} from 'lucide-react';

interface Snap2HtmlViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  disco: DiscoUSB | null;
}

export const Snap2HtmlViewerModal: React.FC<Snap2HtmlViewerModalProps> = ({
  isOpen,
  onClose,
  disco
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'index' | 'iframe'>('index');
  const [loadedFiles, setLoadedFiles] = useState<string[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && disco) {
      setSearchTerm('');
      if (disco.relatorio_files && disco.relatorio_files.length > 0) {
        setLoadedFiles(disco.relatorio_files);
        setIsLoadingFiles(false);
      } else if (disco.relatorio_path || disco.has_relatorio) {
        setIsLoadingFiles(true);
        StorageService.fetchReportFilesAsync(disco.id)
          .then(files => {
            setLoadedFiles(files);
            setIsLoadingFiles(false);
          })
          .catch(() => {
            setIsLoadingFiles(false);
          });
      } else {
        setLoadedFiles([]);
        setIsLoadingFiles(false);
      }
    }
  }, [isOpen, disco]);

  if (!isOpen || !disco) return null;

  const files = loadedFiles;
  const filteredFiles = files.filter(f => 
    !searchTerm || f.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = (fileName: string) => {
    navigator.clipboard.writeText(fileName);
    setCopiedFile(fileName);
    setTimeout(() => setCopiedFile(null), 1500);
  };

  const reportUrl = disco.relatorio_path
    ? `/api/reports/${encodeURIComponent(disco.relatorio_path)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className={`relative w-full rounded-2xl border bg-white dark:bg-[#1a1e29] border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 transition-all ${
        viewMode === 'iframe' ? 'max-w-5xl' : 'max-w-3xl'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151821]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono">
                  {disco.id_disco || disco.ticket_num}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-semibold font-mono">
                  {disco.arquivo}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Relatório Snap2HTML: {disco.relatorio_path || 'Snapshot digital'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {reportUrl && (
              <a
                href={reportUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Abrir em novo separador do navegador"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir Original</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Disk Info Banner */}
        <div className="px-6 py-3 bg-slate-100/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Projeto:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{disco.projeto || '-'}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Série / Disco:</span>
            <span className="font-semibold font-mono text-slate-800 dark:text-slate-200 truncate block">{disco.tamanho_disco} · {disco.marca}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Nº de Série:</span>
            <span className="font-semibold font-mono text-slate-800 dark:text-slate-200 truncate block">{disco.numero_serie}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Total Imagens:</span>
            <span className="font-semibold font-mono text-blue-600 dark:text-blue-400">{(disco.total_imagens || files.length).toLocaleString('pt-PT')}</span>
          </div>
        </div>

        {/* View Mode Tabs */}
        {disco.relatorio_path && (
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#13161f] px-6">
            <button
              onClick={() => setViewMode('index')}
              className={`flex items-center gap-1.5 py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
                viewMode === 'index'
                  ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400 dark:border-cyan-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Lista Rápida Indexada ({files.length})</span>
            </button>
            <button
              onClick={() => setViewMode('iframe')}
              className={`flex items-center gap-1.5 py-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
                viewMode === 'iframe'
                  ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400 dark:border-cyan-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Visualizador Web Snap2HTML</span>
            </button>
          </div>
        )}

        {/* Mode 1: Indexed List */}
        {viewMode === 'index' && (
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar ficheiro neste disco (ex: PT-ADPRT-001.tif)..."
                  className="w-full text-xs pl-9 pr-8 py-2 rounded-lg border bg-slate-50 dark:bg-[#11141c] border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-mono"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono shrink-0 flex items-center gap-1">
                <FolderOpen className="w-4 h-4 text-cyan-500" />
                <span>{filteredFiles.length} de {files.length} ficheiros indexados</span>
              </div>
            </div>

            {/* Files List Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-[360px] overflow-y-auto">
              {isLoadingFiles ? (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                  <p>A carregar lista de ficheiros indexados da base de dados...</p>
                </div>
              ) : filteredFiles.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors font-mono"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-slate-400 text-[11px] w-6 shrink-0">{idx + 1}.</span>
                        <span className="text-slate-800 dark:text-slate-200 truncate font-medium">{file}</span>
                      </div>

                      <button
                        onClick={() => handleCopy(file)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shrink-0 text-[11px]"
                        title="Copiar nome do ficheiro"
                      >
                        {copiedFile === file ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-500 font-sans">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="font-sans">Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                  {searchTerm ? (
                    <p>Nenhum ficheiro encontrado com o termo "{searchTerm}".</p>
                  ) : (
                    <p>Este registo ainda não possui ficheiros indexados. Pode importar o ficheiro .html no formulário de edição.</p>
                  )}
                </div>
              )}
            </div>

            <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
              Dica: Pode pesquisar estes ficheiros a partir da barra de pesquisa principal do RIDIS digitando <code>PT-...</code> ou o código do documento.
            </p>
          </div>
        )}

        {/* Mode 2: Interactive iFrame */}
        {viewMode === 'iframe' && (
          <div className="p-4">
            <div className="w-full h-[520px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900">
              <iframe
                src={reportUrl || ''}
                title="Relatório Snap2HTML"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151821] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            Fechar Visualizador
          </button>
        </div>

      </div>
    </div>
  );
};
