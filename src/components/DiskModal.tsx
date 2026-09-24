import React, { useState, useEffect } from 'react';
import { DiscoUSB, ARQUIVOS_MAP } from '../types';
import { StorageService } from '../services/storage';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

interface DiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  discoToEdit: DiscoUSB | null;
  onSave: (data: Omit<DiscoUSB, 'id'>, id?: number) => void;
  onDelete?: (id: number) => void;
  isAdmin?: boolean;
}

export const DiskModal: React.FC<DiskModalProps> = ({
  isOpen,
  onClose,
  discoToEdit,
  onSave,
  onDelete,
  isAdmin = false
}) => {
  const isEditing = Boolean(discoToEdit);

  const [formData, setFormData] = useState({
    arquivo: '',
    remetente: '',
    data_entrada: new Date().toISOString().split('T')[0],
    ticket_num: '',
    id_disco: '',
    projeto: 'PRR',
    localizacao: '',
    tamanho_disco: '4 TB',
    marca: '',
    numero_serie: '',
    verificado: false,
    ticket_integracao: '',
    integrado: false,
    armazenado_servidor: false,
    total_imagens: 0,
    observacoes: '',
    relatorio_path: '',
    relatorio_files: [] as string[]
  });

  const [uploadedReportName, setUploadedReportName] = useState<string>('');
  const [reportIndexedCount, setReportIndexedCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (discoToEdit) {
      setFormData({
        arquivo: discoToEdit.arquivo || '',
        remetente: discoToEdit.remetente || '',
        data_entrada: discoToEdit.data_entrada || '',
        ticket_num: discoToEdit.ticket_num || '',
        id_disco: discoToEdit.id_disco || '',
        projeto: discoToEdit.projeto || '',
        localizacao: discoToEdit.localizacao || '',
        tamanho_disco: discoToEdit.tamanho_disco || '',
        marca: discoToEdit.marca || '',
        numero_serie: discoToEdit.numero_serie || '',
        verificado: discoToEdit.verificado || false,
        ticket_integracao: discoToEdit.ticket_integracao || '',
        integrado: discoToEdit.integrado || false,
        armazenado_servidor: discoToEdit.armazenado_servidor || false,
        total_imagens: discoToEdit.total_imagens || 0,
        observacoes: discoToEdit.observacoes || '',
        relatorio_path: discoToEdit.relatorio_path || '',
        relatorio_files: discoToEdit.relatorio_files || []
      });
      setUploadedReportName(discoToEdit.relatorio_path || '');
      setReportIndexedCount(discoToEdit.relatorio_files?.length || 0);
    } else {
      setFormData({
        arquivo: '',
        remetente: '',
        data_entrada: new Date().toISOString().split('T')[0],
        ticket_num: '',
        id_disco: '',
        projeto: 'PRR',
        localizacao: '',
        tamanho_disco: '4 TB',
        marca: 'Seagate',
        numero_serie: '',
        verificado: false,
        ticket_integracao: '',
        integrado: false,
        armazenado_servidor: false,
        total_imagens: 0,
        observacoes: '',
        relatorio_path: '',
        relatorio_files: []
      });
      setUploadedReportName('');
      setReportIndexedCount(0);
    }
    setErrorMessage('');
  }, [discoToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
      setErrorMessage('O relatório tem de ser um ficheiro .html ou .htm (Snap2HTML).');
      return;
    }

    try {
      const text = await file.text();
      const indexed = StorageService.indexSnap2HTMLContent(text);
      const cleanName = file.name.replace(/[^a-zA-Z0-9_\-\.]/g, '_');

      setUploadedReportName(cleanName);
      setReportIndexedCount(indexed.length);
      setFormData(prev => ({
        ...prev,
        relatorio_path: cleanName,
        relatorio_files: indexed,
        total_imagens: prev.total_imagens === 0 && indexed.length > 0 ? indexed.length : prev.total_imagens
      }));

      // Upload to server reports directory
      StorageService.uploadReportFile(file, discoToEdit?.id).catch(err => {
        console.warn('Falha no upload do relatório para o servidor:', err);
      });
    } catch {
      setErrorMessage('Erro ao ler ficheiro Snap2HTML.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ticket_num.trim()) {
      setErrorMessage('Erro: O campo "Ticket nº" é de preenchimento obrigatório.');
      return;
    }

    if (!formData.numero_serie.trim()) {
      setErrorMessage('Erro: O campo "n/s:" (Número de Série) é de preenchimento obrigatório.');
      return;
    }

    onSave(formData, discoToEdit?.id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-3xl rounded-2xl border bg-white dark:bg-[#1a1e29] border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151821]">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {isEditing ? (
                <>Editar Disco: <span className="text-blue-600 dark:text-blue-400 font-mono">{formData.id_disco || formData.ticket_num}</span></>
              ) : (
                'Registar Novo Disco USB / Matriz'
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Preencha os campos de identificação física, proveniência e integridade arquivística
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-lg border bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Arquivo Picklist */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Arquivo
              </label>
              <select
                value={formData.arquivo}
                onChange={(e) => setFormData(prev => ({ ...prev, arquivo: e.target.value }))}
                className="w-full text-xs rounded-lg px-3 py-2 border bg-slate-50 dark:bg-[#11141c] border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Selecione o Arquivo --</option>
                {Object.keys(ARQUIVOS_MAP).map(sigla => (
                  <option key={sigla} value={sigla}>
                    {sigla} - {ARQUIVOS_MAP[sigla]}
                  </option>
                ))}
              </select>
            </div>

            {/* Remetente */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Remetente
              </label>
              <input
                type="text"
                value={formData.remetente}
                onChange={(e) => setFormData(prev => ({ ...prev, remetente: e.target.value }))}
                placeholder="Ex: José Magalhães / Arquivo Distrital"
                className="w-full text-xs rounded-lg px-3 py-2 border bg-slate-50 dark:bg-[#11141c] border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Data de Entrada */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data
              </label>
              <input
                type="date"
                value={formData.data_entrada}
                onChange={(e) => setFormData(prev => ({ ...prev, data_entrada: e.target.value }))}
                className="w-full text-xs rounded-lg px-3 py-2 border bg-slate-50 dark:bg-[#11141c] border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* Ticket de Envio * */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ticket nº <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.ticket_num}
                onChange={(e) => setFormData(prev => ({ ...prev, ticket_num: e.target.value }))}
                placeholder="Ex: GLPI-2026-104"
                required
                className="w-full text-xs rounded-lg px-3 py-2 border bg-slate-50 dark:bg-[#11141c] border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* ID do Disco */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ID do disco
              </label>
              <input
                type="text"
                value={formData.id_disco}
                onChange={(e) => setFormData(prev => ({ ...prev, id_disco: e.target.value }))}
                placeholder="Ex: PRR-ADPRT-2026_038-A"
                className="w-full text-xs rounded-lg px-3 py-2 border bg-slate-50 dark:bg-[#11141c] border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* Projeto */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Projeto
              </label>
              <input
                type="text"
                value={formData.projeto}
                onChange={(e) => setFormData(prev => ({ ...prev, projeto: e.target.value }))}
                placeholder="Ex: PRR, MDO"
                className="w-full text-xs rounded-lg px-3 py-2 border bg-slate-50 dark:bg-[#11141c] border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Localização */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Localização
              </label>
              <input
                type="text"
                value={formData.localizacao}
                onChange={(e) => setFormData(prev => ({ ...prev, localizacao: e.target.value }))}
                placeholder="Ex: Armário A - Prat. 2"
                className="w-full text-xs rounded-lg px-3 py-2 border bg-slate-50 dark:bg-[#11141c] border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Tamanho do disco */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tamanho do disco
              </label>
              <input
                type="text"
                value={formData.tamanho_disco}
                onChange={(e) => setFormData(prev => ({ ...prev, tamanho_disco: e.target.value }))}
                placeholder="Ex: 4 TB, 2 TB"
                className="w-full text-xs rounded-lg px-3 py-2 border bg-slate-50 dark:bg-[#11141c] border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* Marca */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Marca
              </label>
              <input
                type="text"
                value={formData.marca}
                onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value }))}
                placeholder="Ex: Seagate, WD"
                className="w-full text-xs rounded-lg px-3 py-2 border bg-slate-50 dark:bg-[#11141c] border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Número de Série * */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                n/s: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.numero_serie}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_serie: e.target.value }))}
                placeholder="Ex: SN19284752"
                required
                className="w-full text-xs rounded-lg px-3 py-2 border bg-slate-50 dark:bg-[#11141c] border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Status Switches & Ticket de Integração */}
          <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-[#141720] border-slate-200 dark:border-slate-800/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              {/* Verificado switch */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.verificado}
                  onChange={(e) => setFormData(prev => ({ ...prev, verificado: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Verificado (V)
                </span>
              </label>

              {/* Integrado switch */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.integrado}
                  onChange={(e) => setFormData(prev => ({ ...prev, integrado: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Integrado (I)
                </span>
              </label>

              {/* Armazenado switch */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.armazenado_servidor}
                  onChange={(e) => setFormData(prev => ({ ...prev, armazenado_servidor: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Armazenado em servidor (A)
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              {/* Ticket de Integração */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ticket de integração
                </label>
                <input
                  type="text"
                  value={formData.ticket_integracao}
                  onChange={(e) => setFormData(prev => ({ ...prev, ticket_integracao: e.target.value }))}
                  placeholder="Ex: INT-DGLAB-3042"
                  className="w-full text-xs rounded-lg px-3 py-2 border bg-white dark:bg-[#11141c] border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Total de Imagens */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Total de imagens
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.total_imagens}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_imagens: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full text-xs rounded-lg px-3 py-2 border bg-white dark:bg-[#11141c] border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Relatório Snap2HTML File Attachment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Relatório do disco (Snap2HTML, .html)
            </label>
            
            {uploadedReportName && (
              <div className="mb-2 p-2.5 rounded-lg border bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="font-mono truncate">{uploadedReportName}</span>
                  {reportIndexedCount > 0 && (
                    <span className="shrink-0 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-[10px] font-semibold">
                      {reportIndexedCount} ficheiros indexados
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedReportName('');
                    setReportIndexedCount(0);
                    setFormData(prev => ({ ...prev, relatorio_path: '', relatorio_files: [] }));
                  }}
                  className="text-slate-400 hover:text-rose-500 text-xs font-medium ml-2 shrink-0"
                >
                  Remover
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium bg-slate-50 dark:bg-[#11141c] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">
                <Upload className="w-3.5 h-3.5 text-blue-500" />
                <span>{uploadedReportName ? 'Substituir Relatório Snap2HTML' : 'Carregar Relatório Snap2HTML (.html)'}</span>
                <input
                  type="file"
                  accept=".html,.htm"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Extrai automaticamente os nomes de ficheiros para pesquisa profunda (ex: <code>PT-ADPRT-...</code>)
              </span>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações (Obs.)
            </label>
            <textarea
              rows={3}
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Indique notas de checksum, estado dos dados ou instruções..."
              className="w-full text-xs rounded-lg px-3 py-2 border bg-slate-50 dark:bg-[#11141c] border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5">
            <div>
              {isEditing && discoToEdit && onDelete && isAdmin && (
                <button
                  type="button"
                  onClick={() => onDelete(discoToEdit.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-300 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Registo</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition-colors"
              >
                Guardar Registo
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
