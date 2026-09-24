import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { DiscoUSB } from '../types';
import {
  X,
  Upload,
  FileSpreadsheet,
  Database,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Link,
  HelpCircle,
  Check,
  AlertCircle
} from 'lucide-react';

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (importedCount: number, errorsCount: number, messages: string[]) => void;
  onDatabaseRestored?: (totalDiscos: number, totalUsuarios: number) => void;
  onReportsImported?: (matchedCount: number, total: number) => void;
  discos?: DiscoUSB[];
}

type TabType = 'csv' | 'sqlite' | 'reports';

export const ImportCsvModal: React.FC<ImportCsvModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  onDatabaseRestored,
  onReportsImported,
  discos = []
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('csv');

  // --- CSV State ---
  const [csvContent, setCsvContent] = useState<string>('');
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [previewLines, setPreviewLines] = useState<string[]>([]);
  const [isProcessingCsv, setIsProcessingCsv] = useState<boolean>(false);
  const [csvError, setCsvError] = useState<string>('');

  // --- SQLite 3 DB State ---
  const [dbFile, setDbFile] = useState<File | null>(null);
  const [isProcessingDb, setIsProcessingDb] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string>('');
  const [dbSuccessMessage, setDbSuccessMessage] = useState<string>('');

  // --- Snap2HTML Reports State ---
  const [reportFiles, setReportFiles] = useState<File[]>([]);
  const [assignments, setAssignments] = useState<Record<string, number>>({});
  const [isProcessingReports, setIsProcessingReports] = useState<boolean>(false);
  const [reportsResult, setReportsResult] = useState<{
    matchedCount: number;
    savedCount: number;
    details: any[];
  } | null>(null);
  const [reportsError, setReportsError] = useState<string>('');
  const [showMatchHelp, setShowMatchHelp] = useState<boolean>(false);

  // Auto-detect matching disk based on filename
  const detectMatchingDiskId = (fileName: string): number | null => {
    const lower = fileName.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const d of discos) {
      const t = (d.ticket_num || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const id = (d.id_disco || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const sn = (d.numero_serie || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const rel = (d.relatorio_path || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      if (rel && (lower.includes(rel) || rel.includes(lower))) return d.id;
      if (t && t.length >= 3 && lower.includes(t)) return d.id;
      if (id && id.length >= 3 && lower.includes(id)) return d.id;
      if (sn && sn.length >= 4 && lower.includes(sn)) return d.id;
    }
    return null;
  };

  if (!isOpen) return null;

  // --- Handlers: CSV ---
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setCsvError('Por favor selecione um ficheiro com extensão .csv');
      return;
    }

    setCsvFileName(file.name);
    setCsvError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0).slice(0, 5);
      setPreviewLines(lines);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImportCsv = async () => {
    if (!csvContent) {
      setCsvError('Selecione primeiro um ficheiro CSV para importar.');
      return;
    }

    setIsProcessingCsv(true);
    try {
      const result = await StorageService.importCSVAsync(csvContent);
      onImportComplete(result.importedCount, result.errorsCount, result.messages);
      onClose();
    } catch (err: any) {
      setCsvError(`Erro ao processar ficheiro CSV: ${err?.message || 'Formato inválido'}`);
    } finally {
      setIsProcessingCsv(false);
    }
  };

  // --- Handlers: SQLite Database ---
  const handleDbFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.db') && !file.name.toLowerCase().endsWith('.sqlite') && !file.name.toLowerCase().endsWith('.sqlite3')) {
      setDbError('Por favor selecione um ficheiro de base de dados SQLite (.db ou .sqlite)');
      return;
    }

    setDbFile(file);
    setDbError('');
    setDbSuccessMessage('');
  };

  const handleRestoreDb = async () => {
    if (!dbFile) {
      setDbError('Selecione primeiro o ficheiro de base de dados (.db) a importar.');
      return;
    }

    setIsProcessingDb(true);
    setDbError('');
    try {
      const res = await StorageService.restoreDatabaseFromBlob(dbFile);
      if (!res.success) {
        setDbError(res.error || 'Erro ao restaurar base de dados.');
        return;
      }

      setDbSuccessMessage(
        `Base de dados importada com sucesso! ${res.totalDiscos ?? 0} discos e ${res.totalUsuarios ?? 0} utilizadores carregados.`
      );
      if (onDatabaseRestored) {
        onDatabaseRestored(res.totalDiscos ?? 0, res.totalUsuarios ?? 0);
      }
    } catch (err: any) {
      setDbError(`Falha na importação: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setIsProcessingDb(false);
    }
  };

  // --- Handlers: Snap2HTML Reports ---
  const handleReportsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const htmlFiles = files.filter(f => f.name.toLowerCase().endsWith('.html') || f.name.toLowerCase().endsWith('.htm'));
    if (htmlFiles.length === 0) {
      setReportsError('Nenhum ficheiro .html válido foi selecionado.');
      return;
    }

    setReportFiles(htmlFiles);
    setReportsError('');
    setReportsResult(null);

    // Compute initial auto-assignments for each file
    const initialAssignments: Record<string, number> = {};
    for (const f of htmlFiles) {
      const matchId = detectMatchingDiskId(f.name);
      if (matchId !== null) {
        initialAssignments[f.name] = matchId;
      }
    }
    setAssignments(initialAssignments);
  };

  const handleAssignmentChange = (fileName: string, diskIdStr: string) => {
    const diskId = diskIdStr ? Number(diskIdStr) : null;
    setAssignments(prev => {
      const next = { ...prev };
      if (diskId) {
        next[fileName] = diskId;
      } else {
        delete next[fileName];
      }
      return next;
    });
  };

  const handleImportReports = async () => {
    if (reportFiles.length === 0) {
      setReportsError('Selecione pelo menos um ficheiro de relatório Snap2HTML (.html).');
      return;
    }

    setIsProcessingReports(true);
    setReportsError('');
    try {
      const res = await StorageService.uploadBatchReports(reportFiles, assignments);
      if (!res.success) {
        setReportsError(res.error || 'Erro ao importar relatórios Snap2HTML.');
        return;
      }

      setReportsResult({
        matchedCount: res.matchedCount ?? 0,
        savedCount: res.savedCount ?? 0,
        details: res.details ?? []
      });

      if (onReportsImported) {
        onReportsImported(res.matchedCount ?? 0, res.savedCount ?? 0);
      }
    } catch (err: any) {
      setReportsError(`Erro ao carregar relatórios: ${err?.message || 'Erro de rede'}`);
    } finally {
      setIsProcessingReports(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-3xl rounded-2xl border bg-white dark:bg-[#1a1e29] border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151821]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Centro de Importação e Migração
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Importe dados da base antiga SQLite 3, ficheiros CSV ou relatórios Snap2HTML
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'csv'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ficheiro CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('sqlite')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'sqlite'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Base Antiga SQLite 3 (.db)</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'reports'
                ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400 dark:border-cyan-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Relatórios Snap2HTML (.html)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          
          {/* TAB 1: CSV */}
          {activeTab === 'csv' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Importe uma lista de discos a partir de ficheiro CSV gerado pelo Excel ou exportação anterior. É suportado o delimitador ponto e vírgula (<code>;</code>) ou vírgula (<code>,</code>).
              </p>

              {csvError && (
                <div className="p-3 rounded-lg border bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{csvError}</span>
                </div>
              )}

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 text-center bg-slate-50/50 dark:bg-[#141722]/50 hover:bg-slate-50 dark:hover:bg-[#141722] transition-colors">
                <input
                  type="file"
                  id="csv-file-input"
                  accept=".csv,text/csv"
                  onChange={handleCsvFileChange}
                  className="hidden"
                />
                <label htmlFor="csv-file-input" className="cursor-pointer flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                      Clique para selecionar o ficheiro CSV
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                      {csvFileName ? `Ficheiro selecionado: ${csvFileName}` : 'Formato padrão RIDIS UTF-8'}
                    </span>
                  </div>
                </label>
              </div>

              {/* Preview */}
              {previewLines.length > 0 && (
                <div className="mt-3">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Pré-visualização das Primeiras Linhas:
                  </span>
                  <div className="p-3 rounded-lg bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-32 border border-slate-800">
                    {previewLines.map((line, idx) => (
                      <div key={idx} className="whitespace-nowrap py-0.5">
                        <span className="text-slate-500 mr-2">{idx + 1}:</span>
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleImportCsv}
                  disabled={!csvContent || isProcessingCsv}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                >
                  {isProcessingCsv ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>{isProcessingCsv ? 'A processar...' : 'Importar Registos CSV'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SQLite 3 Database */}
          {activeTab === 'sqlite' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Importação direta da base de dados existente</span>
                </div>
                <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  Pode carregar o ficheiro original <code>gestao_discos.db</code> (usado em <code>/opt/app_nr/gestao_discos.db</code>) ou qualquer cópia de segurança SQLite 3. A aplicação valida a estrutura, preserva uma cópia automática de segurança e carrega todos os registos.
                </p>
              </div>

              {dbError && (
                <div className="p-3 rounded-lg border bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{dbError}</span>
                </div>
              )}

              {dbSuccessMessage && (
                <div className="p-3 rounded-lg border bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{dbSuccessMessage}</span>
                </div>
              )}

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 text-center bg-slate-50/50 dark:bg-[#141722]/50 hover:bg-slate-50 dark:hover:bg-[#141722] transition-colors">
                <input
                  type="file"
                  id="sqlite-file-input"
                  accept=".db,.sqlite,.sqlite3"
                  onChange={handleDbFileChange}
                  className="hidden"
                />
                <label htmlFor="sqlite-file-input" className="cursor-pointer flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                      Clique para selecionar o ficheiro gestao_discos.db
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                      {dbFile ? `${dbFile.name} (${Math.round(dbFile.size / 1024)} KB)` : 'Ficheiro binário SQLite 3 (.db)'}
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleRestoreDb}
                  disabled={!dbFile || isProcessingDb}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                >
                  {isProcessingDb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HardDrive className="w-3.5 h-3.5" />}
                  <span>{isProcessingDb ? 'A restaurar base de dados...' : 'Restaurar Base de Dados SQLite 3'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Snap2HTML Reports */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              
              {/* How it works info box */}
              <div className="p-3.5 rounded-xl border bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-900/60 text-xs text-cyan-900 dark:text-cyan-200">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-bold">
                    <Link className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Como é feita a ligação do relatório ao registo do disco?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMatchHelp(!showMatchHelp)}
                    className="text-[11px] text-cyan-700 dark:text-cyan-300 underline hover:text-cyan-900"
                  >
                    {showMatchHelp ? 'Ocultar regras' : 'Ver regras de ligação'}
                  </button>
                </div>
                
                <p className="text-cyan-800 dark:text-cyan-300 leading-relaxed">
                  O sistema analisa cada ficheiro <code>.html</code> e sugere automaticamente o disco correspondente. <strong>Pode rever ou alterar a qualquer momento o disco de destino antes de gravar.</strong>
                </p>

                {showMatchHelp && (
                  <div className="mt-3 pt-2.5 border-t border-cyan-200/80 dark:border-cyan-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                    <div className="bg-white/60 dark:bg-black/30 p-2 rounded-lg">
                      <span className="font-bold block text-cyan-950 dark:text-cyan-100 mb-0.5">1. Por Ticket nº</span>
                      <span>Se o nome do ficheiro ou título contiver o ticket (ex: <code>GLPI-2025-001_snapshot.html</code>).</span>
                    </div>
                    <div className="bg-white/60 dark:bg-black/30 p-2 rounded-lg">
                      <span className="font-bold block text-cyan-950 dark:text-cyan-100 mb-0.5">2. Por ID / Arquivo</span>
                      <span>Se o nome contiver o ID do disco ou arquivo (ex: <code>ADVIS_01.html</code> ou <code>PRR-D01.html</code>).</span>
                    </div>
                    <div className="bg-white/60 dark:bg-black/30 p-2 rounded-lg">
                      <span className="font-bold block text-cyan-950 dark:text-cyan-100 mb-0.5">3. Por Nº de Série</span>
                      <span>Se o nome contiver o número de série físico do disco (ex: <code>WD-WX123456.html</code>).</span>
                    </div>
                  </div>
                )}
              </div>

              {reportsError && (
                <div className="p-3 rounded-lg border bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{reportsError}</span>
                </div>
              )}

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center bg-slate-50/50 dark:bg-[#141722]/50 hover:bg-slate-50 dark:hover:bg-[#141722] transition-colors">
                <input
                  type="file"
                  id="reports-file-input"
                  accept=".html,.htm"
                  multiple
                  onChange={handleReportsChange}
                  className="hidden"
                />
                <label htmlFor="reports-file-input" className="cursor-pointer flex flex-col items-center gap-1.5">
                  <div className="p-2.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">
                      Clique para selecionar 1 ou vários relatórios Snap2HTML (.html)
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                      {reportFiles.length > 0
                        ? `${reportFiles.length} ficheiro(s) carregado(s) para revisão`
                        : 'Arraste ou selecione os ficheiros HTML exportados pelo Snap2HTML'}
                    </span>
                  </div>
                </label>
              </div>

              {/* Interactive Match Table */}
              {reportFiles.length > 0 && !reportsResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Ficheiros Carregados e Ligação a Registos:
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {Object.keys(assignments).length} de {reportFiles.length} associados
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#151821]">
                    {reportFiles.map((file, i) => {
                      const assignedId = assignments[file.name] || '';
                      const isAutoMatched = Boolean(assignedId);

                      return (
                        <div key={i} className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate">
                              <FileText className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                              <span className="truncate font-semibold">{file.name}</span>
                              <span className="text-slate-400 text-[10px] shrink-0">({Math.round(file.size / 1024)} KB)</span>
                            </div>

                            <div className="mt-1 flex items-center gap-1.5">
                              {assignedId ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Ligação Identificada</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  <span>Selecione o disco manual</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Target Disk Selector */}
                          <div className="sm:w-64 shrink-0">
                            <select
                              value={assignedId}
                              onChange={(e) => handleAssignmentChange(file.name, e.target.value)}
                              className="w-full text-xs py-1.5 px-2 rounded-lg border bg-slate-50 dark:bg-[#11141c] border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-cyan-500 font-sans"
                            >
                              <option value="">-- Escolher disco de destino --</option>
                              {discos.map(d => (
                                <option key={d.id} value={d.id}>
                                  {d.id_disco || d.ticket_num} · {d.arquivo} ({d.tamanho_disco})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Results summary after import */}
              {reportsResult && (
                <div className="p-3.5 rounded-xl border bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-900/60 text-xs">
                  <div className="flex items-center gap-2 font-bold text-cyan-900 dark:text-cyan-200 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                    <span>Importação Concluída com Sucesso: {reportsResult.matchedCount} relatórios associados</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1 font-mono text-[11px]">
                    {reportsResult.details.map((d, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 px-2 bg-white/70 dark:bg-black/40 rounded border border-slate-200/50 dark:border-slate-800/50">
                        <span className="truncate">{d.filename}</span>
                        {d.matchedDisk ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-sans font-semibold shrink-0">
                            → {d.matchedDisk} ({d.totalFiles} imagens indexadas)
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-sans shrink-0">
                            Gravado na biblioteca do servidor
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleImportReports}
                  disabled={reportFiles.length === 0 || isProcessingReports}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                >
                  {isProcessingReports ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>{isProcessingReports ? 'A associar e gravar relatórios...' : 'Gravar e Associar Relatórios'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
