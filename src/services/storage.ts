import { DiscoUSB, Usuario, FilterState, DatabaseStatus } from '../types';
import { INITIAL_DISCOS, INITIAL_USERS } from '../data/seedData';

const STORAGE_KEYS = {
  DISCOS: 'ridis_discos_v2',
  USUARIOS: 'ridis_usuarios_v2',
  CURRENT_USER: 'ridis_current_user_v2',
  THEME: 'ridis_theme'
};

// Clean up any oversized legacy localStorage entry that triggers QuotaExceededError
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const rawDiscos = localStorage.getItem(STORAGE_KEYS.DISCOS);
    if (rawDiscos && rawDiscos.length > 2000000) {
      localStorage.removeItem(STORAGE_KEYS.DISCOS);
    }
  }
} catch (_) {}

// Native IndexedDB Helper (no external dependencies, handles large datasets without 5MB quota errors)
const IDB_NAME = 'ridis_offline_db';
const IDB_VERSION = 1;
const IDB_STORE = 'discos';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveDiscosToIDB(discos: DiscoUSB[]): Promise<void> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.clear();
    for (const d of discos) {
      store.put(d);
    }
  } catch (_) {}
}

async function getDiscosFromIDB(): Promise<DiscoUSB[] | null> {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const res = req.result;
        resolve(Array.isArray(res) && res.length > 0 ? res : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export const StorageService = {
  // In-memory cache for fast, seamless UI interactions without localStorage quota issues
  _inMemoryDiscos: [] as DiscoUSB[],
  _inMemoryUsuarios: [] as Usuario[],

  // --- Database Status & Download ---
  async getDatabaseStatus(): Promise<DatabaseStatus | null> {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  downloadSqliteDb(): void {
    const link = document.createElement('a');
    link.href = '/api/download-db';
    link.setAttribute('download', 'gestao_discos.db');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  async restoreDatabaseFromBlob(file: File): Promise<{ success: boolean; message?: string; error?: string; totalDiscos?: number; totalUsuarios?: number }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, Array.from(uint8Array.subarray(i, i + chunkSize)));
      }
      const base64 = btoa(binary);

      const res = await fetch('/api/upload-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbBase64: base64 })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Erro ao restaurar base de dados' };
      }
      // Re-fetch discos and users
      await this.fetchDiscosAsync();
      await this.fetchUsuariosAsync();
      return { success: true, message: data.message, totalDiscos: data.totalDiscos, totalUsuarios: data.totalUsuarios };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Falha ao processar ficheiro' };
    }
  },

  async uploadReportFile(file: File, diskId?: number): Promise<{ success: boolean; filename?: string; totalFiles?: number; files?: string[]; error?: string }> {
    try {
      const content = await file.text();
      const res = await fetch('/api/upload-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, content, diskId })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Erro ao carregar relatório' };
      }
      // Update in-memory if diskId is provided
      if (diskId) {
        const disk = this._inMemoryDiscos.find(d => d.id === diskId);
        if (disk) {
          disk.relatorio_path = data.filename;
          disk.has_relatorio = true;
          disk.relatorio_files_count = data.totalFiles || 0;
          disk.relatorio_files = data.files || [];
        }
      }
      return { success: true, filename: data.filename, totalFiles: data.totalFiles, files: data.files };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao ler ficheiro' };
    }
  },

  async uploadBatchReports(files: File[], assignments?: Record<string, number>): Promise<{ success: boolean; savedCount?: number; matchedCount?: number; details?: any[]; error?: string }> {
    try {
      const reports = await Promise.all(files.map(async f => ({
        filename: f.name,
        content: await f.text(),
        targetDiskId: assignments?.[f.name]
      })));

      const res = await fetch('/api/batch-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Erro no envio em lote' };
      }
      // Re-sync disks
      await this.fetchDiscosAsync();
      return { success: true, savedCount: data.savedCount, matchedCount: data.matchedCount, details: data.details };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao processar ficheiros' };
    }
  },

  // --- Discos ---
  async fetchDiscosAsync(searchTerm?: string): Promise<DiscoUSB[] | null> {
    try {
      const url = searchTerm ? `/api/discos?q=${encodeURIComponent(searchTerm)}` : '/api/discos';
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      const formatted: DiscoUSB[] = data.map((d: any) => ({
        id: Number(d.id),
        ticket_num: d.ticket_num || '',
        arquivo: d.arquivo || '',
        remetente: d.remetente || d.arquivo || '',
        data_entrada: d.data_criacao ? d.data_criacao.slice(0, 10) : '',
        id_disco: d.id_disco || '',
        projeto: d.projeto || '',
        localizacao: d.localizacao || '',
        tamanho_disco: d.tamanho_disco || '',
        marca: d.marca || '',
        numero_serie: d.numero_serie || '',
        verificado: Boolean(d.verificado),
        ticket_integracao: d.ticket_integracao || '',
        integrado: Boolean(d.integrado),
        armazenado_servidor: Boolean(d.armazenado_servidor),
        total_imagens: Number(d.total_imagens) || 0,
        observacoes: d.observacoes || '',
        relatorio_path: d.relatorio_path || '',
        has_relatorio: Boolean(d.has_relatorio || d.relatorio_path),
        relatorio_files_count: Number(d.relatorio_files_count) || (Array.isArray(d.relatorio_files) ? d.relatorio_files.length : 0),
        relatorio_files: Array.isArray(d.relatorio_files) ? d.relatorio_files : [],
        created_at: d.data_criacao || ''
      }));
      this.saveDiscos(formatted);
      return formatted;
    } catch {
      return null;
    }
  },

  // Fetch full report file index for a single disk on demand
  async fetchReportFilesAsync(diskId: number): Promise<string[]> {
    try {
      const res = await fetch(`/api/discos/${diskId}/report-files`);
      if (!res.ok) return [];
      const data = await res.json();
      const files: string[] = Array.isArray(data.files) ? data.files : [];
      // Cache in memory for this disk
      const target = this._inMemoryDiscos.find(d => d.id === diskId);
      if (target) {
        target.relatorio_files = files;
        target.relatorio_files_count = files.length;
        target.has_relatorio = true;
      }
      return files;
    } catch {
      return [];
    }
  },

  async addDiscoAsync(discoData: Omit<DiscoUSB, 'id'>): Promise<{ success: boolean; error?: string; disco?: DiscoUSB }> {
    try {
      const res = await fetch('/api/discos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discoData)
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || 'Erro ao comunicar com SQLite' };
      }
      const created: DiscoUSB = {
        ...discoData,
        id: Number(json.id),
        data_entrada: json.data_criacao ? json.data_criacao.slice(0, 10) : (discoData.data_entrada || ''),
        created_at: json.data_criacao || new Date().toISOString(),
        has_relatorio: Boolean(json.has_relatorio || discoData.relatorio_path),
        relatorio_files_count: Number(json.relatorio_files_count) || (discoData.relatorio_files?.length || 0)
      };
      const current = this.getDiscos().filter(d => d.id !== created.id);
      this.saveDiscos([created, ...current]);
      return { success: true, disco: created };
    } catch {
      return this.addDisco(discoData);
    }
  },

  async updateDiscoAsync(id: number, discoData: Partial<DiscoUSB>): Promise<{ success: boolean; error?: string; disco?: DiscoUSB }> {
    try {
      const res = await fetch(`/api/discos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discoData)
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || 'Erro ao comunicar com SQLite' };
      }
      const updated: DiscoUSB = {
        ...(this._inMemoryDiscos.find(d => d.id === id) || ({} as DiscoUSB)),
        ...discoData,
        id,
        data_entrada: json.data_criacao ? json.data_criacao.slice(0, 10) : (discoData.data_entrada || ''),
        has_relatorio: Boolean(json.has_relatorio || discoData.relatorio_path),
        relatorio_files_count: Number(json.relatorio_files_count) || (discoData.relatorio_files?.length || 0)
      };
      return this.updateDisco(id, updated);
    } catch {
      return this.updateDisco(id, discoData);
    }
  },

  async deleteDiscoAsync(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/discos/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        return { success: false, error: json.error || 'Erro ao eliminar no SQLite' };
      }
      return this.deleteDisco(id);
    } catch {
      return this.deleteDisco(id);
    }
  },

  getDiscos(): DiscoUSB[] {
    if (this._inMemoryDiscos.length > 0) {
      return this._inMemoryDiscos;
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DISCOS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this._inMemoryDiscos = parsed;
          return parsed;
        }
      }
    } catch (_) {}

    this._inMemoryDiscos = INITIAL_DISCOS;
    return INITIAL_DISCOS;
  },

  saveDiscos(discos: DiscoUSB[]): void {
    this._inMemoryDiscos = discos;
    // Persist asynchronously to IndexedDB (virtually unlimited quota)
    saveDiscosToIDB(discos);

    // Safely update localStorage without exceeding quota
    try {
      // Store lightweight slice to prevent QuotaExceededError
      const light = discos.slice(0, 300).map(d => ({
        ...d,
        relatorio_files: [] // strip multi-megabyte file strings
      }));
      localStorage.setItem(STORAGE_KEYS.DISCOS, JSON.stringify(light));
    } catch (_) {
      // If quota exceeded, cleanly clear to avoid breaking localStorage
      try {
        localStorage.removeItem(STORAGE_KEYS.DISCOS);
      } catch (_) {}
    }
  },

  addDisco(discoData: Omit<DiscoUSB, 'id'>): { success: boolean; error?: string; disco?: DiscoUSB } {
    const discos = this.getDiscos();
    
    // Check uniqueness of ticket_num + numero_serie
    const duplicate = discos.find(
      d => d.ticket_num.trim().toLowerCase() === discoData.ticket_num.trim().toLowerCase() &&
           d.numero_serie.trim().toLowerCase() === discoData.numero_serie.trim().toLowerCase()
    );

    if (duplicate) {
      return { success: false, error: 'Já existe um registo com este Ticket nº e Número de Série.' };
    }

    const nextId = discos.length > 0 ? Math.max(...discos.map(d => d.id)) + 1 : 1;
    const newDisco: DiscoUSB = {
      ...discoData,
      id: nextId,
      created_at: new Date().toISOString()
    };

    const updated = [newDisco, ...discos];
    this.saveDiscos(updated);
    return { success: true, disco: newDisco };
  },

  updateDisco(id: number, discoData: Partial<DiscoUSB>): { success: boolean; error?: string; disco?: DiscoUSB } {
    const discos = this.getDiscos();
    const index = discos.findIndex(d => d.id === id);
    if (index === -1) {
      return { success: false, error: 'Registo não encontrado.' };
    }

    // Check duplicate if ticket_num or numero_serie changed
    const targetTicket = discoData.ticket_num;
    const targetSerie = discoData.numero_serie;
    if (targetTicket && targetSerie) {
      const duplicate = discos.find(
        d => d.id !== id &&
             d.ticket_num.trim().toLowerCase() === targetTicket.trim().toLowerCase() &&
             d.numero_serie.trim().toLowerCase() === targetSerie.trim().toLowerCase()
      );
      if (duplicate) {
        return { success: false, error: 'Já existe outro registo com este Ticket nº e Número de Série.' };
      }
    }

    const updatedDisco: DiscoUSB = {
      ...discos[index],
      ...discoData
    };

    discos[index] = updatedDisco;
    this.saveDiscos(discos);
    return { success: true, disco: updatedDisco };
  },

  deleteDisco(id: number): { success: boolean; error?: string } {
    const discos = this.getDiscos();
    const updated = discos.filter(d => d.id !== id);
    this.saveDiscos(updated);
    return { success: true };
  },

  // --- Search & Filters ---
  filterDiscos(discos: DiscoUSB[], filters: FilterState): DiscoUSB[] {
    const { q, f_arquivo, f_projeto, f_localizacao, f_verificado, f_integrado, f_armazenado } = filters;
    const searchTerm = q.trim();

    return discos.filter(d => {
      if (f_arquivo && d.arquivo !== f_arquivo) return false;
      if (f_projeto && d.projeto !== f_projeto) return false;
      if (f_localizacao && d.localizacao !== f_localizacao) return false;
      if (f_verificado !== '') {
        const isVer = f_verificado === '1';
        if (d.verificado !== isVer) return false;
      }
      if (f_integrado !== '') {
        const isInteg = f_integrado === '1';
        if (d.integrado !== isInteg) return false;
      }
      if (f_armazenado !== '') {
        const isArm = f_armazenado === '1';
        if (d.armazenado_servidor !== isArm) return false;
      }

      if (searchTerm) {
        // Deep search in indexed Snap2HTML files if search starts with PT- or PT/
        if (searchTerm.toUpperCase().startsWith('PT-') || searchTerm.toUpperCase().startsWith('PT/')) {
          const normTerm = searchTerm.replace('/', '-').toUpperCase().replace('*', '');
          const matchesIndexedFile = d.relatorio_files?.some(f => f.toUpperCase().includes(normTerm));
          if (matchesIndexedFile) return true;
        }

        // Support wildcard pattern or regular substring
        const isWildcard = searchTerm.includes('*') || searchTerm.includes('?');
        if (isWildcard) {
          const regexPattern = new RegExp('^' + searchTerm.replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i');
          const fields = [
            d.id_disco,
            d.projeto,
            d.arquivo,
            d.remetente,
            d.ticket_num,
            d.numero_serie,
            d.localizacao,
            d.ticket_integracao,
            d.observacoes
          ];
          return fields.some(val => val && regexPattern.test(val));
        } else {
          const s = searchTerm.toLowerCase();
          const matchesFields = (
            (d.id_disco && d.id_disco.toLowerCase().includes(s)) ||
            (d.projeto && d.projeto.toLowerCase().includes(s)) ||
            (d.arquivo && d.arquivo.toLowerCase().includes(s)) ||
            (d.remetente && d.remetente.toLowerCase().includes(s)) ||
            (d.ticket_num && d.ticket_num.toLowerCase().includes(s)) ||
            (d.numero_serie && d.numero_serie.toLowerCase().includes(s)) ||
            (d.localizacao && d.localizacao.toLowerCase().includes(s)) ||
            (d.ticket_integracao && d.ticket_integracao.toLowerCase().includes(s)) ||
            (d.observacoes && d.observacoes.toLowerCase().includes(s)) ||
            (d.tamanho_disco && d.tamanho_disco.toLowerCase().includes(s)) ||
            (d.marca && d.marca.toLowerCase().includes(s)) ||
            (d.relatorio_path && d.relatorio_path.toLowerCase().includes(s)) ||
            (d.relatorio_files && d.relatorio_files.some(f => f.toLowerCase().includes(s)))
          );
          return Boolean(matchesFields);
        }
      }

      return true;
    }).sort((a, b) => {
      // Sort by data_entrada DESC, id DESC
      const dateA = a.data_entrada || '';
      const dateB = b.data_entrada || '';
      if (dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }
      return b.id - a.id;
    });
  },

  // --- Users & Auth ---
  async fetchUsuariosAsync(): Promise<Usuario[] | null> {
    try {
      const res = await fetch('/api/usuarios');
      if (!res.ok) return null;
      const data = await res.json();
      this.saveUsuarios(data);
      return data;
    } catch {
      return null;
    }
  },

  async addUsuarioAsync(username: string, isAdmin: boolean): Promise<{ success: boolean; error?: string; user?: Usuario }> {
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, is_admin: isAdmin })
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.error || 'Erro ao criar utilizador no SQLite' };
      }
      const users = this.getUsuarios();
      this.saveUsuarios([...users, json]);
      return { success: true, user: json };
    } catch {
      return this.addUsuario(username, isAdmin);
    }
  },

  async toggleAdminAsync(id: number, currentUserId: number): Promise<{ success: boolean; error?: string; newStatus?: boolean }> {
    if (id === currentUserId) {
      return { success: false, error: 'Não podes alterar o teu próprio nível de acesso enquanto estás autenticado.' };
    }
    try {
      const users = this.getUsuarios();
      const user = users.find(u => u.id === id);
      const newAdmin = !user?.is_admin;
      await fetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_admin: newAdmin })
      });
      return this.toggleAdmin(id, currentUserId);
    } catch {
      return this.toggleAdmin(id, currentUserId);
    }
  },

  async deleteUsuarioAsync(id: number, currentUserId: number): Promise<{ success: boolean; error?: string }> {
    if (id === currentUserId) {
      return { success: false, error: 'Não podes eliminar o teu próprio utilizador enquanto estás autenticado com ele.' };
    }
    try {
      await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
      return this.deleteUsuario(id, currentUserId);
    } catch {
      return this.deleteUsuario(id, currentUserId);
    }
  },

  getUsuarios(): Usuario[] {
    if (this._inMemoryUsuarios.length > 0) {
      return this._inMemoryUsuarios;
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USUARIOS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this._inMemoryUsuarios = parsed;
          return parsed;
        }
      }
    } catch (_) {}

    this._inMemoryUsuarios = INITIAL_USERS;
    return INITIAL_USERS;
  },

  saveUsuarios(usuarios: Usuario[]): void {
    this._inMemoryUsuarios = usuarios;
    try {
      localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(usuarios));
    } catch (_) {}
  },

  addUsuario(username: string, isAdmin: boolean): { success: boolean; error?: string; user?: Usuario } {
    const users = this.getUsuarios();
    const cleanName = username.trim();
    if (!cleanName) return { success: false, error: 'O nome de utilizador é obrigatório.' };

    if (users.some(u => u.username.toLowerCase() === cleanName.toLowerCase())) {
      return { success: false, error: `Já existe um utilizador com o nome "${cleanName}".` };
    }

    const nextId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newUser: Usuario = {
      id: nextId,
      username: cleanName,
      is_admin: isAdmin,
      created_at: formattedDate
    };

    const updated = [...users, newUser];
    this.saveUsuarios(updated);
    return { success: true, user: newUser };
  },

  toggleAdmin(id: number, currentUserId: number): { success: boolean; error?: string; newStatus?: boolean } {
    if (id === currentUserId) {
      return { success: false, error: 'Não podes alterar o teu próprio nível de acesso enquanto estás autenticado.' };
    }

    const users = this.getUsuarios();
    const user = users.find(u => u.id === id);
    if (!user) return { success: false, error: 'Utilizador não encontrado.' };

    user.is_admin = !user.is_admin;
    this.saveUsuarios(users);
    return { success: true, newStatus: user.is_admin };
  },

  deleteUsuario(id: number, currentUserId: number): { success: boolean; error?: string } {
    if (id === currentUserId) {
      return { success: false, error: 'Não podes eliminar o teu próprio utilizador enquanto estás autenticado com ele.' };
    }

    const users = this.getUsuarios();
    const updated = users.filter(u => u.id !== id);
    this.saveUsuarios(updated);
    return { success: true };
  },

  getCurrentUser(): Usuario | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!data) {
        const defaultUser = this.getUsuarios()[0] || INITIAL_USERS[0];
        this.setCurrentUser(defaultUser);
        return defaultUser;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_USERS[0];
    }
  },

  setCurrentUser(user: Usuario | null): void {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (_) {}
  },

  // --- Snap2HTML Indexing ---
  indexSnap2HTMLContent(htmlText: string): string[] {
    const files: string[] = [];
    const regex1 = /"([^"*]+\.[A-Za-z0-9]{2,5})\*\d+\*\d+"/g;
    let match;
    while ((match = regex1.exec(htmlText)) !== null) {
      if (match[1]) {
        files.push(match[1]);
      }
    }

    if (files.length === 0) {
      const regexArr = /\[\s*\d+\s*,\s*"([^"]+\.[A-Za-z0-9]{2,5})"/g;
      while ((match = regexArr.exec(htmlText)) !== null) {
        if (match[1]) files.push(match[1]);
      }
    }

    if (files.length === 0) {
      const regex2 = /(PT-[A-Za-z0-9\-_./\\]+\.(?:tif|tiff|jpg|jpeg|pdf|png|xml|cr2|nef|dng))/gi;
      let match2;
      while ((match2 = regex2.exec(htmlText)) !== null) {
        if (match2[1] && !files.includes(match2[1])) {
          const cleanFile = match2[1].split(/[\/\\]/).pop() || match2[1];
          files.push(cleanFile);
        }
      }
    }

    return Array.from(new Set(files));
  },

  // --- CSV Export & Import ---
  exportCSV(discos: DiscoUSB[]): string {
    const headers = [
      'arquivo', 'remetente', 'data_entrada', 'ticket_num', 'id_disco', 'projeto',
      'localizacao', 'tamanho_disco', 'marca', 'numero_serie', 'verificado',
      'ticket_integracao', 'integrado', 'armazenado_servidor', 'total_imagens', 'observacoes'
    ];

    const rows = discos.map(d => [
      d.arquivo || '',
      `"${(d.remetente || '').replace(/"/g, '""')}"`,
      d.data_entrada || '',
      `"${(d.ticket_num || '').replace(/"/g, '""')}"`,
      `"${(d.id_disco || '').replace(/"/g, '""')}"`,
      `"${(d.projeto || '').replace(/"/g, '""')}"`,
      `"${(d.localizacao || '').replace(/"/g, '""')}"`,
      `"${(d.tamanho_disco || '').replace(/"/g, '""')}"`,
      `"${(d.marca || '').replace(/"/g, '""')}"`,
      `"${(d.numero_serie || '').replace(/"/g, '""')}"`,
      d.verificado ? 'Sim' : 'Não',
      `"${(d.ticket_integracao || '').replace(/"/g, '""')}"`,
      d.integrado ? 'Sim' : 'Não',
      d.armazenado_servidor ? 'Sim' : 'Não',
      d.total_imagens || 0,
      `"${(d.observacoes || '').replace(/"/g, '""')}"`
    ]);

    // Use semicolon delimiter with UTF-8 BOM for Portuguese Excel compatibility
    return '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  },

  exportTemplateCSV(): string {
    const headers = [
      'arquivo', 'remetente', 'data_entrada', 'ticket_num', 'id_disco', 'projeto',
      'localizacao', 'tamanho_disco', 'marca', 'numero_serie', 'verificado',
      'ticket_integracao', 'integrado', 'armazenado_servidor', 'total_imagens', 'observacoes'
    ];
    const example = [
      'ADPRT', 'João Silva', '2026-03-01', 'GLPI-2026-1002', 'PRR-ADPRT-2026_099-A', 'PRR',
      'Armário A - Prateleira 1', '4 TB', 'Seagate', 'SN12345678', '1',
      'INT-DGLAB-3100', '0', '1', '15000', 'Digitalização em curso'
    ];
    return '\uFEFF' + [headers.join(';'), example.join(';')].join('\r\n');
  },

  async importCSVAsync(content: string): Promise<{ importedCount: number; errorsCount: number; messages: string[] }> {
    const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return { importedCount: 0, errorsCount: 0, messages: ['Ficheiro CSV vazio ou sem registos.'] };
    }

    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';
    const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

    const parseBool = (val: string | undefined): boolean => {
      if (!val) return false;
      const s = val.trim().toLowerCase();
      return ['1', 'sim', 'true', 's', 'yes'].includes(s);
    };

    const recordsToSend: any[] = [];
    let localErrors = 0;
    const messages: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const row: string[] = [];
      let inQuotes = false;
      let token = '';

      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          row.push(token.trim().replace(/^["']|["']$/g, ''));
          token = '';
        } else {
          token += char;
        }
      }
      row.push(token.trim().replace(/^["']|["']$/g, ''));

      const record: Record<string, string> = {};
      headers.forEach((h, idx) => {
        record[h] = row[idx] || '';
      });

      const ticket_num = record['ticket_num'] || record['ticket'] || '';
      const numero_serie = record['numero_serie'] || record['n/s'] || record['sn'] || '';
      const arquivo = (record['arquivo'] || '').toUpperCase();

      if (!ticket_num || !numero_serie || !arquivo) {
        localErrors++;
        messages.push(`Linha ${i + 1}: Ignorada por falta de Ticket, Nº de Série ou Arquivo.`);
        continue;
      }

      const rawTotal = (record['total_imagens'] || record['total'] || '0').replace(/[,.]/g, '');
      const total_imagens = parseInt(rawTotal, 10) || 0;

      recordsToSend.push({
        arquivo,
        remetente: record['remetente'] || arquivo,
        data_entrada: record['data_entrada'] || record['data'] || '',
        ticket_num,
        id_disco: record['id_disco'] || record['id'] || '',
        projeto: record['projeto'] || '',
        localizacao: record['localizacao'] || '',
        tamanho_disco: record['tamanho_disco'] || record['tamanho'] || '',
        marca: record['marca'] || '',
        numero_serie,
        verificado: parseBool(record['verificado']),
        ticket_integracao: record['ticket_integracao'] || '',
        integrado: parseBool(record['integrado']),
        armazenado_servidor: parseBool(record['armazenado_servidor']),
        total_imagens,
        observacoes: record['observacoes'] || record['obs'] || ''
      });
    }

    if (recordsToSend.length === 0) {
      return { importedCount: 0, errorsCount: localErrors, messages };
    }

    try {
      const res = await fetch('/api/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: recordsToSend })
      });
      const data = await res.json();
      if (!res.ok) {
        return { importedCount: 0, errorsCount: localErrors + recordsToSend.length, messages: [data.error || 'Erro na importação'] };
      }

      // Re-fetch clean disks list directly from SQLite
      await this.fetchDiscosAsync();

      return {
        importedCount: data.importedCount || 0,
        errorsCount: (data.errorsCount || 0) + localErrors,
        messages: [...messages, ...(data.messages || [])]
      };
    } catch (err: any) {
      return { importedCount: 0, errorsCount: localErrors + recordsToSend.length, messages: [err?.message || 'Falha de rede ao importar'] };
    }
  },

  async syncServerReportsAsync(): Promise<{
    success: boolean;
    totalFilesFound: number;
    matchedCount: number;
    unmatchedCount: number;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/sync-reports', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, totalFilesFound: 0, matchedCount: 0, unmatchedCount: 0, error: data.error };
      }
      await this.fetchDiscosAsync();
      return data;
    } catch (err: any) {
      return { success: false, totalFilesFound: 0, matchedCount: 0, unmatchedCount: 0, error: err?.message };
    }
  },

  // Backwards compatible synchronous helper
  parseCSV(content: string): { importedCount: number; errorsCount: number; messages: string[] } {
    this.importCSVAsync(content);
    return { importedCount: 0, errorsCount: 0, messages: ['Processamento de importação iniciado...'] };
  }
};
