import React, { useState, useEffect, useMemo } from 'react';
import { DiscoUSB, Usuario, FilterState, DatabaseStatus } from './types';
import { StorageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { StatsBar } from './components/StatsBar';
import { DiskCard } from './components/DiskCard';
import { DiskModal } from './components/DiskModal';
import { Snap2HtmlViewerModal } from './components/Snap2HtmlViewerModal';
import { ImportCsvModal } from './components/ImportCsvModal';
import { AdminUsersModal } from './components/AdminUsersModal';
import { DatabaseStatusModal } from './components/DatabaseStatusModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { LoginView } from './components/LoginView';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ChevronUp, Plus, HardDrive, RefreshCw, Database } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('ridis_theme') as 'dark' | 'light') || 'dark';
  });

  const [currentUser, setCurrentUser] = useState<Usuario | null>(() => {
    return StorageService.getCurrentUser();
  });

  const [discos, setDiscos] = useState<DiscoUSB[]>(() => {
    return StorageService.getDiscos();
  });

  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    q: '',
    f_arquivo: '',
    f_projeto: '',
    f_localizacao: '',
    f_verificado: '',
    f_integrado: '',
    f_armazenado: ''
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals state
  const [isDiskModalOpen, setIsDiskModalOpen] = useState(false);
  const [diskToEdit, setDiskToEdit] = useState<DiscoUSB | null>(null);

  const [diskToDelete, setDiskToDelete] = useState<DiscoUSB | null>(null);
  const [isDeletingDisk, setIsDeletingDisk] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [diskForReport, setDiskForReport] = useState<DiscoUSB | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isDbStatusOpen, setIsDbStatusOpen] = useState(false);

  const [showScrollTop, setShowScrollTop] = useState(false);

  const refreshDbStatus = async () => {
    const status = await StorageService.getDatabaseStatus();
    if (status) setDbStatus(status);
  };

  const refreshDiscosFromBackend = async () => {
    const backendDiscos = await StorageService.fetchDiscosAsync();
    if (backendDiscos) {
      setDiscos(backendDiscos);
    }
  };

  // Initial backend SQLite 3 sync
  useEffect(() => {
    refreshDiscosFromBackend();
    refreshDbStatus();
  }, []);

  // Apply theme to document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-bs-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-bs-theme', 'light');
    }
    localStorage.setItem('ridis_theme', theme);
  }, [theme]);

  // Scroll listener for Top button
  useEffect(() => {
    const checkScroll = () => {
      if (window.scrollY > 220) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const addToast = (type: 'success' | 'danger' | 'warning' | 'info', message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Distinct values for select dropdowns
  const projetos = useMemo(() => {
    const set = new Set<string>();
    discos.forEach(d => {
      if (d.projeto && d.projeto.trim()) set.add(d.projeto.trim());
    });
    return Array.from(set).sort();
  }, [discos]);

  const localizacoes = useMemo(() => {
    const set = new Set<string>();
    discos.forEach(d => {
      if (d.localizacao && d.localizacao.trim()) set.add(d.localizacao.trim());
    });
    return Array.from(set).sort();
  }, [discos]);

  const [displayLimit, setDisplayLimit] = useState<number>(25);

  // Filtered list (sorted by newest/most recent date first)
  const filteredDiscos = useMemo(() => {
    const list = StorageService.filterDiscos(discos, filters);
    return [...list].sort((a, b) => {
      const dateA = a.data_entrada || (a.created_at ? a.created_at.slice(0, 10) : '') || '';
      const dateB = b.data_entrada || (b.created_at ? b.created_at.slice(0, 10) : '') || '';
      if (dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }
      return (b.id || 0) - (a.id || 0);
    });
  }, [discos, filters]);

  // Display limited to 25 most recent records by default
  const displayedDiscos = useMemo(() => {
    return filteredDiscos.slice(0, displayLimit);
  }, [filteredDiscos, displayLimit]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setDisplayLimit(25);
  };

  const handleResetFilters = () => {
    setFilters({
      q: '',
      f_arquivo: '',
      f_projeto: '',
      f_localizacao: '',
      f_verificado: '',
      f_integrado: '',
      f_armazenado: ''
    });
    setDisplayLimit(25);
    addToast('info', 'Filtros reinicializados.');
  };

  // CRUD Handlers connected to SQLite 3
  const handleOpenNovo = () => {
    setDiskToEdit(null);
    setIsDiskModalOpen(true);
  };

  const handleEditDisco = (disco: DiscoUSB) => {
    setDiskToEdit(disco);
    setIsDiskModalOpen(true);
  };

  const handleSaveDisco = async (discoData: Omit<DiscoUSB, 'id'>, id?: number) => {
    if (id) {
      const res = await StorageService.updateDiscoAsync(id, discoData);
      if (!res.success) {
        addToast('danger', res.error || 'Erro ao atualizar registo.');
        return;
      }
      setDiscos(StorageService.getDiscos());
      setIsDiskModalOpen(false);
      refreshDbStatus();
      addToast('success', `Registo "${res.disco?.id_disco || res.disco?.ticket_num}" gravado em SQLite 3!`);
    } else {
      const res = await StorageService.addDiscoAsync(discoData);
      if (!res.success) {
        addToast('danger', res.error || 'Erro ao adicionar registo.');
        return;
      }
      setDiscos(StorageService.getDiscos());
      setIsDiskModalOpen(false);
      refreshDbStatus();
      addToast('success', 'Novo disco gravado em SQLite 3 (gestao_discos.db)!');
    }
  };

  const handleDeleteDisco = (id: number) => {
    if (!currentUser?.is_admin) {
      addToast('danger', 'Apenas administradores podem eliminar registos.');
      return;
    }

    const target = discos.find(d => d.id === id);
    if (target) {
      setDiskToDelete(target);
    }
  };

  const handleConfirmDeleteDisk = async () => {
    if (!diskToDelete) return;
    setIsDeletingDisk(true);
    try {
      const res = await StorageService.deleteDiscoAsync(diskToDelete.id);
      if (!res.success) {
        addToast('danger', res.error || 'Erro ao eliminar registo.');
        return;
      }

      setDiscos(StorageService.getDiscos());
      refreshDbStatus();
      addToast('success', `Registo "${diskToDelete.id_disco || diskToDelete.ticket_num}" eliminado permanentemente da base de dados!`);
      
      // Close disk modal if open for this disk
      if (diskToEdit?.id === diskToDelete.id) {
        setIsDiskModalOpen(false);
        setDiskToEdit(null);
      }
      setDiskToDelete(null);
    } catch (err: any) {
      addToast('danger', err?.message || 'Erro inesperado ao eliminar.');
    } finally {
      setIsDeletingDisk(false);
    }
  };

  const handleViewReport = (disco: DiscoUSB) => {
    setDiskForReport(disco);
    setIsReportModalOpen(true);
  };

  // Export CSV
  const handleExportCsv = () => {
    const csvData = StorageService.exportCSV(filteredDiscos);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `discos_usb_exportado_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('success', `${filteredDiscos.length} registos exportados para CSV com sucesso.`);
  };

  // Download Template
  const handleDownloadTemplate = () => {
    const templateData = StorageService.exportTemplateCSV();
    const blob = new Blob([templateData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_discos_usb.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('info', 'Template descarregado.');
  };

  // Import completed
  const handleImportComplete = async (importedCount: number, errorsCount: number, messages: string[]) => {
    await refreshDiscosFromBackend();
    refreshDbStatus();
    if (importedCount > 0) {
      addToast('success', `Importação concluída: ${importedCount} registos gravados em SQLite 3!`);
    }
    if (errorsCount > 0) {
      addToast('warning', `${errorsCount} registos ignorados (duplicados ou campos obrigatórios em falta).`);
    }
  };

  // Auth
  const handleLogout = () => {
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
    addToast('info', 'Sessão terminada.');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If not logged in, show authentic Login view
  if (!currentUser) {
    return <LoginView onLoginSuccess={(u) => { setCurrentUser(u); addToast('success', `Bem-vindo, ${u.username}!`); }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#10131a] dark:text-[#e1e1e6] transition-colors font-sans selection:bg-blue-600 selection:text-white flex flex-col justify-between">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div>
        {/* Top Bar */}
        <Navbar
          currentUser={currentUser}
          theme={theme}
          onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          onOpenNovo={handleOpenNovo}
          onExportCsv={handleExportCsv}
          onDownloadTemplate={handleDownloadTemplate}
          onOpenImport={() => setIsImportModalOpen(true)}
          onOpenUsers={() => setIsUsersModalOpen(true)}
          onOpenDatabaseStatus={() => setIsDbStatusOpen(true)}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          
          {/* Quick Stats Overview */}
          <StatsBar discos={discos} filteredDiscos={filteredDiscos} />

          {/* Filters & Free Search */}
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            projetos={projetos}
            localizacoes={localizacoes}
            totalResults={filteredDiscos.length}
            displayedCount={displayedDiscos.length}
          />

          {/* Records List */}
          <div className="space-y-3 mt-4">
            {displayedDiscos.length > 0 ? (
              <>
                {displayedDiscos.map(disco => (
                  <DiskCard
                    key={disco.id}
                    disco={disco}
                    isAdmin={Boolean(currentUser?.is_admin)}
                    onEdit={handleEditDisco}
                    onDelete={handleDeleteDisco}
                    onViewReport={handleViewReport}
                  />
                ))}

                {filteredDiscos.length > displayedDiscos.length && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161a24] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      A exibir os <strong>{displayedDiscos.length}</strong> registos mais recentes de um total de <strong>{filteredDiscos.length}</strong> encontrados.
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDisplayLimit(prev => prev + 25)}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                      >
                        Carregar mais 25
                      </button>
                      <button
                        onClick={() => setDisplayLimit(filteredDiscos.length)}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xs transition-colors"
                      >
                        Mostrar todos ({filteredDiscos.length})
                      </button>
                    </div>
                  </div>
                )}

                {displayLimit > 25 && filteredDiscos.length > 25 && (
                  <div className="text-center pt-1">
                    <button
                      onClick={() => {
                        setDisplayLimit(25);
                        scrollToTop();
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      ← Voltar a limitar aos 25 registos mais recentes
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center rounded-2xl border bg-white dark:bg-[#161a24] border-slate-200 dark:border-slate-800 shadow-xs">
                <HardDrive className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Nenhum disco encontrado
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                  Não foram encontrados registos que correspondam aos filtros ou termo de pesquisa selecionados.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Limpar Filtros</span>
                  </button>
                  <button
                    onClick={handleOpenNovo}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo Registo</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </main>
      </div>

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-500 active:scale-95 transition-all"
          title="Voltar ao topo da página"
          aria-label="Voltar ao topo"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      {/* Footer */}
      <footer className="w-full border-t py-4 px-6 mt-8 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#11141c]/50 text-slate-500 text-[11px] text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <strong>RIDIS</strong> — Registo e Inventário de Discos USB e Matrizes de Digitalização
            <span className="hidden sm:inline">·</span>
            <button
              onClick={() => setIsDbStatusOpen(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] hover:underline"
            >
              <Database className="w-3 h-3 text-emerald-500" />
              <span>SQLite 3 (gestao_discos.db)</span>
            </button>
          </div>
          <div>
            DGLAB · Direção-Geral do Livro, dos Arquivos e das Bibliotecas
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DiskModal
        isOpen={isDiskModalOpen}
        onClose={() => setIsDiskModalOpen(false)}
        discoToEdit={diskToEdit}
        onSave={handleSaveDisco}
        onDelete={handleDeleteDisco}
        isAdmin={Boolean(currentUser?.is_admin)}
      />

      <Snap2HtmlViewerModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        disco={diskForReport}
      />

      <ImportCsvModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        discos={discos}
        onImportComplete={handleImportComplete}
        onDatabaseRestored={(totalDiscos) => {
          refreshDiscosFromBackend();
          refreshDbStatus();
          addToast('success', `Base de dados SQLite 3 restaurada com sucesso! ${totalDiscos} discos carregados.`);
        }}
        onReportsImported={(matchedCount, total) => {
          refreshDiscosFromBackend();
          refreshDbStatus();
          addToast('success', `${matchedCount} de ${total} relatórios Snap2HTML associados aos discos com sucesso.`);
        }}
      />

      <AdminUsersModal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
        currentUser={currentUser}
        onNotify={addToast}
      />

      <DatabaseStatusModal
        isOpen={isDbStatusOpen}
        onClose={() => setIsDbStatusOpen(false)}
        status={dbStatus}
        onOpenImport={() => setIsImportModalOpen(true)}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(diskToDelete)}
        onClose={() => setDiskToDelete(null)}
        onConfirm={handleConfirmDeleteDisk}
        title="Eliminar Disco USB"
        message="Tem a certeza que deseja eliminar permanentemente este registo de disco?"
        itemName={diskToDelete ? `${diskToDelete.id_disco || 'Disco'} (${diskToDelete.ticket_num})` : ''}
        itemDetails={diskToDelete ? [
          { label: 'Ticket de Entrada', value: diskToDelete.ticket_num },
          { label: 'Ticket de Integração', value: diskToDelete.ticket_integracao || '-' },
          { label: 'Arquivo', value: diskToDelete.arquivo },
          { label: 'Nº de Série', value: diskToDelete.numero_serie },
          { label: 'Localização', value: diskToDelete.localizacao || '-' }
        ] : []}
        confirmText="Eliminar Registo"
        isDeleting={isDeletingDisk}
      />

    </div>
  );
}

