import express from 'express';
import { createServer as createViteServer } from 'vite';
import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DB_FILE = path.resolve(__dirname, 'gestao_discos.db');
const REPORTS_DIR = path.resolve(__dirname, 'reports');
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Snap2HTML parser helper
function parseSnap2Html(htmlText: string): string[] {
  const files: string[] = [];
  // Snap2HTML format pattern: "filename.ext*size*date"
  const regex1 = /"([^"*]+\.[A-Za-z0-9]{2,5})\*\d+\*\d+"/g;
  let match;
  while ((match = regex1.exec(htmlText)) !== null) {
    if (match[1]) files.push(match[1]);
  }

  // Snap2HTML table rows or arrays
  if (files.length === 0) {
    const regexArr = /\[\s*\d+\s*,\s*"([^"]+\.[A-Za-z0-9]{2,5})"/g;
    while ((match = regexArr.exec(htmlText)) !== null) {
      if (match[1]) files.push(match[1]);
    }
  }

  // Fallback: look for archival or image filenames
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
}

// Helper to query all records as objects
function queryAll(db: Database, sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// Helper to query one record
function queryOne(db: Database, sql: string, params: any[] = []): any | null {
  const rows = queryAll(db, sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Save SQLite database to disk
function saveDatabase(db: Database) {
  try {
    const data = db.export();
    fs.writeFileSync(DB_FILE, Buffer.from(data));
  } catch (err) {
    console.error('Erro ao gravar gestao_discos.db em disco:', err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize SQLite 3 via sql.js
  const SQL = await initSqlJs();
  let db: Database;

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
      console.log(`[RIDIS] Base de dados SQLite 3 carregada com sucesso a partir de ${DB_FILE}`);
    } catch (err) {
      console.warn('[RIDIS] Ficheiro existente inválido, criando nova base de dados SQLite 3...');
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
    console.log('[RIDIS] Nova base de dados SQLite 3 inicializada.');
  }

  // Create tables if not exist
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      password TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS discos_usb (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_num TEXT NOT NULL,
      ticket_integracao TEXT,
      arquivo TEXT NOT NULL,
      remetente TEXT,
      projeto TEXT,
      id_disco TEXT,
      numero_serie TEXT NOT NULL,
      marca TEXT,
      tamanho_disco TEXT,
      localizacao TEXT,
      verificado INTEGER DEFAULT 0,
      integrado INTEGER DEFAULT 0,
      armazenado_servidor INTEGER DEFAULT 0,
      data_criacao TEXT,
      observacoes TEXT,
      total_imagens INTEGER DEFAULT 0,
      total_pastas INTEGER DEFAULT 0,
      relatorio_path TEXT,
      relatorio_files TEXT,
      pasta_matriz TEXT,
      pasta_derivadas TEXT,
      UNIQUE(ticket_num, numero_serie)
    );
  `);

  // Ensure columns exist on legacy tables
  try {
    db.run('ALTER TABLE discos_usb ADD COLUMN ticket_integracao TEXT DEFAULT "";');
  } catch (_) {}
  try {
    db.run('ALTER TABLE discos_usb ADD COLUMN remetente TEXT DEFAULT "";');
  } catch (_) {}

  // Seed default users if empty
  const userCountRes = queryOne(db, 'SELECT COUNT(*) as count FROM usuarios');
  if (!userCountRes || userCountRes.count === 0) {
    db.run(
      'INSERT INTO usuarios (username, is_admin, created_at, password) VALUES (?, ?, ?, ?)',
      ['jmagalhaes', 1, '2025-01-10 09:30:00', 'admin123']
    );
    db.run(
      'INSERT INTO usuarios (username, is_admin, created_at, password) VALUES (?, ?, ?, ?)',
      ['operador', 0, '2025-01-15 14:00:00', 'operador123']
    );
    console.log('[RIDIS] Utilizadores padrão inseridos na tabela SQLite "usuarios".');
  }

  // Seed initial records if empty
  const discoCountRes = queryOne(db, 'SELECT COUNT(*) as count FROM discos_usb');
  if (!discoCountRes || discoCountRes.count === 0) {
    const seedDiscos = [
      {
        ticket_num: 'GLPI-2025-001',
        arquivo: 'ADPRT',
        projeto: 'Digitalização Notários Sec. XIX',
        id_disco: 'DISCO-PRT-01',
        numero_serie: 'WD-WCC4M7EK6810',
        marca: 'Western Digital Elements',
        tamanho_disco: '4 TB',
        localizacao: 'Armário A - Prateleira 2',
        verificado: 1,
        integrado: 1,
        armazenado_servidor: 1,
        data_criacao: '2025-01-15 10:20:00',
        observacoes: 'Matrizes TIFF não comprimidas em 300 DPI.',
        total_imagens: 45280,
        total_pastas: 34,
        relatorio_path: 'snap2html/ADPRT_01_snapshot.html',
        relatorio_files: JSON.stringify([
          'PT-ADPRT-NOT-CNPRT1-001-0001.tif',
          'PT-ADPRT-NOT-CNPRT1-001-0002.tif',
          'PT-ADPRT-NOT-CNPRT1-001-0003.tif',
          'PT-ADPRT-NOT-CNPRT1-002-0001.tif',
          'PT-ADPRT-NOT-CNPRT1-002-0002.tif'
        ]),
        pasta_matriz: '/mnt/matrizes/ADPRT/NOT_01',
        pasta_derivadas: '/mnt/derivadas/ADPRT/NOT_01'
      },
      {
        ticket_num: 'GLPI-2025-004',
        arquivo: 'ANTT',
        projeto: 'Inquirições Afonsinas & Chancelarias',
        id_disco: 'DISCO-ANTT-04',
        numero_serie: 'ST4000DM004-9831',
        marca: 'Seagate Expansion',
        tamanho_disco: '4 TB',
        localizacao: 'Cofre Forte - Gaveta 3',
        verificado: 1,
        integrado: 0,
        armazenado_servidor: 0,
        data_criacao: '2025-02-01 11:45:00',
        observacoes: 'A aguardar validação pelo técnico responsável.',
        total_imagens: 12450,
        total_pastas: 18,
        relatorio_path: 'snap2html/ANTT_INQ_snapshot.html',
        relatorio_files: JSON.stringify([
          'PT-TT-CC-1-1-0001.tif',
          'PT-TT-CC-1-1-0002.tif',
          'PT-TT-CC-1-1-0003.tif'
        ]),
        pasta_matriz: '/mnt/matrizes/ANTT/CHAN_01',
        pasta_derivadas: ''
      },
      {
        ticket_num: 'GLPI-2025-007',
        arquivo: 'ADAVR',
        projeto: 'Registos Paroquiais de Aveiro',
        id_disco: 'DISCO-AVR-02',
        numero_serie: 'TOSHIBA-CANVIO-7712',
        marca: 'Toshiba Canvio Basics',
        tamanho_disco: '2 TB',
        localizacao: 'Armário B - Prateleira 1',
        verificado: 1,
        integrado: 1,
        armazenado_servidor: 0,
        data_criacao: '2025-02-12 16:10:00',
        observacoes: 'Livros de batismo e casamentos Século XVIII.',
        total_imagens: 28930,
        total_pastas: 22,
        relatorio_path: 'snap2html/ADAVR_PAROQ_snapshot.html',
        relatorio_files: JSON.stringify([
          'PT-ADAVR-PRQ-PAG01-0001.tif',
          'PT-ADAVR-PRQ-PAG01-0002.tif',
          'PT-ADAVR-PRQ-PAG02-0001.tif'
        ]),
        pasta_matriz: '/mnt/matrizes/ADAVR/PAROQ_01',
        pasta_derivadas: '/mnt/derivadas/ADAVR/PAROQ_01'
      }
    ];

    for (const d of seedDiscos) {
      db.run(`
        INSERT INTO discos_usb (
          ticket_num, arquivo, projeto, id_disco, numero_serie, marca,
          tamanho_disco, localizacao, verificado, integrado, armazenado_servidor,
          data_criacao, observacoes, total_imagens, total_pastas,
          relatorio_path, relatorio_files, pasta_matriz, pasta_derivadas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        d.ticket_num, d.arquivo, d.projeto, d.id_disco, d.numero_serie, d.marca,
        d.tamanho_disco, d.localizacao, d.verificado, d.integrado, d.armazenado_servidor,
        d.data_criacao, d.observacoes, d.total_imagens, d.total_pastas,
        d.relatorio_path, d.relatorio_files, d.pasta_matriz, d.pasta_derivadas
      ]);
    }

    saveDatabase(db);
    console.log('[RIDIS] Discos de exemplo persistidos na base de dados SQLite 3.');
  }

  // ==========================================
  // API ROUTES
  // ==========================================

  // Database status endpoint
  app.get('/api/status', (req, res) => {
    try {
      const stats = fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE) : null;
      const discoCount = queryOne(db, 'SELECT COUNT(*) as count FROM discos_usb')?.count || 0;
      const userCount = queryOne(db, 'SELECT COUNT(*) as count FROM usuarios')?.count || 0;

      res.json({
        dbType: 'SQLite 3',
        filename: 'gestao_discos.db',
        dbPath: DB_FILE,
        sizeBytes: stats ? stats.size : 0,
        totalDiscos: discoCount,
        totalUsuarios: userCount,
        isPersistent: true
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao obter estado da base de dados' });
    }
  });

  // Download raw SQLite 3 binary file (.db)
  app.get('/api/download-db', (req, res) => {
    try {
      saveDatabase(db);
      if (!fs.existsSync(DB_FILE)) {
        return res.status(404).send('Ficheiro de base de dados SQLite não encontrado.');
      }
      res.download(DB_FILE, 'gestao_discos.db');
    } catch (err: any) {
      res.status(500).send(`Erro ao descarregar ficheiro .db: ${err?.message}`);
    }
  });

  // Helper to format disk record for client consumption (lightweight, without multi-megabyte file lists)
  function formatDisco(r: any, includeFiles: boolean = false): any {
    let filesCount = 0;
    let parsedFiles: string[] = [];
    if (r.relatorio_files && r.relatorio_files !== '[]') {
      try {
        parsedFiles = JSON.parse(r.relatorio_files);
        filesCount = Array.isArray(parsedFiles) ? parsedFiles.length : 0;
      } catch {
        filesCount = 0;
      }
    }

    return {
      id: Number(r.id),
      ticket_num: r.ticket_num || '',
      ticket_integracao: r.ticket_integracao || '',
      arquivo: r.arquivo || '',
      remetente: r.remetente || r.arquivo || '',
      projeto: r.projeto || '',
      id_disco: r.id_disco || '',
      numero_serie: r.numero_serie || '',
      marca: r.marca || '',
      tamanho_disco: r.tamanho_disco || '',
      localizacao: r.localizacao || '',
      verificado: Number(r.verificado) || 0,
      integrado: Number(r.integrado) || 0,
      armazenado_servidor: Number(r.armazenado_servidor) || 0,
      data_criacao: r.data_criacao || '',
      data_entrada: r.data_criacao ? r.data_criacao.slice(0, 10) : '',
      observacoes: r.observacoes || '',
      total_imagens: Number(r.total_imagens) || filesCount || 0,
      total_pastas: Number(r.total_pastas) || 0,
      relatorio_path: r.relatorio_path || '',
      has_relatorio: Boolean(r.relatorio_path || filesCount > 0),
      relatorio_files_count: filesCount,
      relatorio_files: includeFiles ? parsedFiles : (filesCount <= 20 ? parsedFiles : []),
      pasta_matriz: r.pasta_matriz || '',
      pasta_derivadas: r.pasta_derivadas || ''
    };
  }

  // List all disks (optimized payload: ~290 KB instead of 6.2 MB)
  app.get('/api/discos', (req, res) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      let sql = 'SELECT * FROM discos_usb ORDER BY data_criacao DESC, id DESC';
      let params: any[] = [];

      if (q) {
        sql = `SELECT * FROM discos_usb WHERE 
          LOWER(ticket_num) LIKE LOWER(?) OR 
          LOWER(ticket_integracao) LIKE LOWER(?) OR 
          LOWER(numero_serie) LIKE LOWER(?) OR 
          LOWER(id_disco) LIKE LOWER(?) OR 
          LOWER(arquivo) LIKE LOWER(?) OR 
          LOWER(remetente) LIKE LOWER(?) OR 
          LOWER(projeto) LIKE LOWER(?) OR 
          LOWER(localizacao) LIKE LOWER(?) OR 
          LOWER(observacoes) LIKE LOWER(?) OR 
          relatorio_files LIKE ?
          ORDER BY data_criacao DESC, id DESC`;
        const wildcard = `%${q}%`;
        params = [wildcard, wildcard, wildcard, wildcard, wildcard, wildcard, wildcard, wildcard, wildcard, wildcard];
      }

      const rows = queryAll(db, sql, params);
      const formatted = rows.map(r => formatDisco(r, false));
      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao listar discos' });
    }
  });

  // Get full report files list for a single disk on demand
  app.get('/api/discos/:id/report-files', (req, res) => {
    try {
      const id = Number(req.params.id);
      const row = queryOne(db, 'SELECT id, relatorio_path, relatorio_files, total_imagens FROM discos_usb WHERE id = ?', [id]);
      if (!row) {
        return res.status(404).json({ error: 'Disco não encontrado' });
      }
      let files: string[] = [];
      if (row.relatorio_files) {
        try {
          files = JSON.parse(row.relatorio_files);
        } catch {
          files = [];
        }
      }
      res.json({
        id: row.id,
        relatorio_path: row.relatorio_path || '',
        totalFiles: files.length,
        files
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao obter ficheiros do relatório' });
    }
  });

  // Create new disk
  app.post('/api/discos', (req, res) => {
    try {
      const d = req.body;
      if (!d.ticket_num?.trim() || !d.numero_serie?.trim() || !d.arquivo?.trim()) {
        return res.status(400).json({ error: 'Campos Ticket nº, Arquivo e Nº de Série são obrigatórios.' });
      }

      // Check unique constraint
      const existing = queryOne(
        db,
        'SELECT id FROM discos_usb WHERE LOWER(ticket_num) = LOWER(?) AND LOWER(numero_serie) = LOWER(?)',
        [d.ticket_num.trim(), d.numero_serie.trim()]
      );

      if (existing) {
        return res.status(409).json({ error: 'Já existe um registo com este Ticket nº e Número de Série.' });
      }

      const filesJson = Array.isArray(d.relatorio_files) ? JSON.stringify(d.relatorio_files) : '[]';
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

      let recordDate = d.data_entrada || d.data_criacao || '';
      if (!recordDate && d.ticket_num) {
        const m = d.ticket_num.match(/^(20[12]\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])/);
        if (m) recordDate = `${m[1]}-${m[2]}-${m[3]}`;
      }
      if (!recordDate) recordDate = now;
      else if (recordDate.length === 10) recordDate = `${recordDate} 10:00:00`;

      db.run(`
        INSERT INTO discos_usb (
          ticket_num, ticket_integracao, arquivo, remetente, projeto, id_disco, numero_serie, marca,
          tamanho_disco, localizacao, verificado, integrado, armazenado_servidor,
          data_criacao, observacoes, total_imagens, total_pastas,
          relatorio_path, relatorio_files, pasta_matriz, pasta_derivadas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        d.ticket_num.trim(),
        d.ticket_integracao?.trim() || '',
        d.arquivo.trim(),
        d.remetente?.trim() || d.arquivo.trim(),
        d.projeto?.trim() || '',
        d.id_disco?.trim() || '',
        d.numero_serie.trim(),
        d.marca?.trim() || '',
        d.tamanho_disco?.trim() || '',
        d.localizacao?.trim() || '',
        d.verificado ? 1 : 0,
        d.integrado ? 1 : 0,
        d.armazenado_servidor ? 1 : 0,
        recordDate,
        d.observacoes || '',
        Number(d.total_imagens) || 0,
        Number(d.total_pastas) || 0,
        d.relatorio_path || '',
        filesJson,
        d.pasta_matriz || '',
        d.pasta_derivadas || ''
      ]);

      const inserted = queryOne(db, 'SELECT * FROM discos_usb WHERE ticket_num = ? AND numero_serie = ? ORDER BY id DESC LIMIT 1', [d.ticket_num.trim(), d.numero_serie.trim()]);
      saveDatabase(db);

      res.status(201).json(inserted ? formatDisco(inserted, true) : { id: 0 });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao criar registo' });
    }
  });

  // Update disk
  app.put('/api/discos/:id', (req, res) => {
    try {
      const id = Number(req.params.id);
      const d = req.body;

      const current = queryOne(db, 'SELECT * FROM discos_usb WHERE id = ?', [id]);
      if (!current) {
        return res.status(404).json({ error: 'Registo não encontrado.' });
      }

      // Check unique constraint if ticket_num or numero_serie changed
      if (d.ticket_num && d.numero_serie) {
        const dup = queryOne(
          db,
          'SELECT id FROM discos_usb WHERE id != ? AND LOWER(ticket_num) = LOWER(?) AND LOWER(numero_serie) = LOWER(?)',
          [id, d.ticket_num.trim(), d.numero_serie.trim()]
        );
        if (dup) {
          return res.status(409).json({ error: 'Já existe outro registo com este Ticket nº e Número de Série.' });
        }
      }

      const filesJson = Array.isArray(d.relatorio_files)
        ? JSON.stringify(d.relatorio_files)
        : current.relatorio_files;

      let updatedDate = current.data_criacao;
      if (d.data_entrada) {
        updatedDate = d.data_entrada.length === 10 ? `${d.data_entrada} 10:00:00` : d.data_entrada;
      } else if (d.data_criacao) {
        updatedDate = d.data_criacao;
      }

      db.run(`
        UPDATE discos_usb SET
          ticket_num = ?,
          ticket_integracao = ?,
          arquivo = ?,
          remetente = ?,
          projeto = ?,
          id_disco = ?,
          numero_serie = ?,
          marca = ?,
          tamanho_disco = ?,
          localizacao = ?,
          verificado = ?,
          integrado = ?,
          armazenado_servidor = ?,
          data_criacao = ?,
          observacoes = ?,
          total_imagens = ?,
          total_pastas = ?,
          relatorio_path = ?,
          relatorio_files = ?,
          pasta_matriz = ?,
          pasta_derivadas = ?
        WHERE id = ?
      `, [
        d.ticket_num?.trim() ?? current.ticket_num,
        d.ticket_integracao !== undefined ? d.ticket_integracao.trim() : (current.ticket_integracao || ''),
        d.arquivo?.trim() ?? current.arquivo,
        d.remetente?.trim() ?? current.remetente ?? current.arquivo,
        d.projeto?.trim() ?? current.projeto,
        d.id_disco?.trim() ?? current.id_disco,
        d.numero_serie?.trim() ?? current.numero_serie,
        d.marca?.trim() ?? current.marca,
        d.tamanho_disco?.trim() ?? current.tamanho_disco,
        d.localizacao?.trim() ?? current.localizacao,
        d.verificado !== undefined ? (d.verificado ? 1 : 0) : current.verificado,
        d.integrado !== undefined ? (d.integrado ? 1 : 0) : current.integrado,
        d.armazenado_servidor !== undefined ? (d.armazenado_servidor ? 1 : 0) : current.armazenado_servidor,
        updatedDate,
        d.observacoes ?? current.observacoes,
        d.total_imagens !== undefined ? Number(d.total_imagens) : current.total_imagens,
        d.total_pastas !== undefined ? Number(d.total_pastas) : current.total_pastas,
        d.relatorio_path ?? current.relatorio_path,
        filesJson,
        d.pasta_matriz ?? current.pasta_matriz,
        d.pasta_derivadas ?? current.pasta_derivadas,
        id
      ]);

      saveDatabase(db);

      const updated = queryOne(db, 'SELECT * FROM discos_usb WHERE id = ?', [id]);
      res.json(updated ? formatDisco(updated, true) : { id });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao atualizar registo' });
    }
  });

  // Delete disk
  app.delete('/api/discos/:id', (req, res) => {
    try {
      const id = Number(req.params.id);
      db.run('DELETE FROM discos_usb WHERE id = ?', [id]);
      saveDatabase(db);
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao eliminar registo' });
    }
  });

  // List users
  app.get('/api/usuarios', (req, res) => {
    try {
      const rows = queryAll(db, 'SELECT id, username, is_admin, created_at FROM usuarios ORDER BY id ASC');
      res.json(rows.map(u => ({ ...u, is_admin: Boolean(u.is_admin) })));
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao listar utilizadores' });
    }
  });

  // Create user
  app.post('/api/usuarios', (req, res) => {
    try {
      const { username, is_admin, password } = req.body;
      const cleanUser = username?.trim().toLowerCase();
      if (!cleanUser) {
        return res.status(400).json({ error: 'Nome de utilizador é obrigatório.' });
      }

      const existing = queryOne(db, 'SELECT id FROM usuarios WHERE LOWER(username) = LOWER(?)', [cleanUser]);
      if (existing) {
        return res.status(409).json({ error: 'Já existe um utilizador com este nome.' });
      }

      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      db.run(
        'INSERT INTO usuarios (username, is_admin, created_at, password) VALUES (?, ?, ?, ?)',
        [cleanUser, is_admin ? 1 : 0, now, password || '']
      );

      saveDatabase(db);

      const created = queryOne(db, 'SELECT id, username, is_admin, created_at FROM usuarios WHERE id = (SELECT MAX(id) FROM usuarios)');
      res.status(201).json({ ...created, is_admin: Boolean(created.is_admin) });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao criar utilizador' });
    }
  });

  // Toggle admin or change password
  app.put('/api/usuarios/:id', (req, res) => {
    try {
      const id = Number(req.params.id);
      const { is_admin, password } = req.body;

      const user = queryOne(db, 'SELECT * FROM usuarios WHERE id = ?', [id]);
      if (!user) {
        return res.status(404).json({ error: 'Utilizador não encontrado.' });
      }

      if (is_admin !== undefined) {
        db.run('UPDATE usuarios SET is_admin = ? WHERE id = ?', [is_admin ? 1 : 0, id]);
      }
      if (password) {
        db.run('UPDATE usuarios SET password = ? WHERE id = ?', [password, id]);
      }

      saveDatabase(db);

      const updated = queryOne(db, 'SELECT id, username, is_admin, created_at FROM usuarios WHERE id = ?', [id]);
      res.json({ ...updated, is_admin: Boolean(updated.is_admin) });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao atualizar utilizador' });
    }
  });

  // Delete user
  app.delete('/api/usuarios/:id', (req, res) => {
    try {
      const id = Number(req.params.id);
      db.run('DELETE FROM usuarios WHERE id = ?', [id]);
      saveDatabase(db);
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao eliminar utilizador' });
    }
  });

  // Bulk import CSV directly into SQLite
  app.post('/api/import-csv', (req, res) => {
    try {
      const { records } = req.body;
      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ error: 'Nenhum registo fornecido para importação.' });
      }

      let imported = 0;
      let skipped = 0;
      const messages: string[] = [];

      for (const d of records) {
        if (!d.ticket_num?.trim() || !d.numero_serie?.trim() || !d.arquivo?.trim()) {
          skipped++;
          messages.push(`Linha ignorada: Ticket, Série ou Arquivo em falta.`);
          continue;
        }

        const existing = queryOne(
          db,
          'SELECT id FROM discos_usb WHERE LOWER(ticket_num) = LOWER(?) AND LOWER(numero_serie) = LOWER(?)',
          [d.ticket_num.trim(), d.numero_serie.trim()]
        );

        if (existing) {
          skipped++;
          messages.push(`Ignorado duplicado: Ticket "${d.ticket_num}" / Série "${d.numero_serie}".`);
          continue;
        }

        const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
        const filesJson = Array.isArray(d.relatorio_files) ? JSON.stringify(d.relatorio_files) : '[]';

        let rowDate = d.data_entrada || d.data || d.data_criacao || '';
        if (!rowDate && d.ticket_num) {
          const m = d.ticket_num.match(/^(20[12]\d)(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])/);
          if (m) rowDate = `${m[1]}-${m[2]}-${m[3]}`;
        }
        if (!rowDate) rowDate = now;
        else if (rowDate.length === 10) rowDate = `${rowDate} 10:00:00`;

        db.run(`
          INSERT INTO discos_usb (
            ticket_num, ticket_integracao, arquivo, remetente, projeto, id_disco, numero_serie, marca,
            tamanho_disco, localizacao, verificado, integrado, armazenado_servidor,
            data_criacao, observacoes, total_imagens, total_pastas,
            relatorio_path, relatorio_files, pasta_matriz, pasta_derivadas
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          d.ticket_num.trim(),
          d.ticket_integracao?.trim() || '',
          d.arquivo.trim(),
          d.remetente?.trim() || d.arquivo.trim(),
          d.projeto?.trim() || '',
          d.id_disco?.trim() || '',
          d.numero_serie.trim(),
          d.marca?.trim() || '',
          d.tamanho_disco?.trim() || '',
          d.localizacao?.trim() || '',
          d.verificado ? 1 : 0,
          d.integrado ? 1 : 0,
          d.armazenado_servidor ? 1 : 0,
          rowDate,
          d.observacoes || '',
          Number(d.total_imagens) || 0,
          Number(d.total_pastas) || 0,
          d.relatorio_path || '',
          filesJson,
          d.pasta_matriz || '',
          d.pasta_derivadas || ''
        ]);
        imported++;
      }

      saveDatabase(db);
      res.json({ importedCount: imported, errorsCount: skipped, messages });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao processar importação' });
    }
  });

  // Upload and restore full SQLite 3 database file (.db)
  app.post('/api/upload-database', (req, res) => {
    try {
      const { dbBase64 } = req.body;
      if (!dbBase64) {
        return res.status(400).json({ error: 'Conteúdo binário do ficheiro .db não fornecido.' });
      }

      const buffer = Buffer.from(dbBase64, 'base64');
      
      // Verify SQLite header magic: "SQLite format 3\0"
      const magic = buffer.slice(0, 16).toString('utf-8');
      if (!magic.startsWith('SQLite format 3')) {
        return res.status(400).json({ error: 'O ficheiro enviado não é uma base de dados SQLite 3 válida.' });
      }

      // Test load in sql.js
      const testDb = new SQL.Database(buffer);
      const tables = queryAll(testDb, "SELECT name FROM sqlite_master WHERE type='table'");
      const tableNames = tables.map(t => t.name.toLowerCase());

      if (!tableNames.includes('discos_usb')) {
        return res.status(400).json({
          error: 'A base de dados enviada não contém a tabela "discos_usb". Verifique se selecionou o ficheiro "gestao_discos.db" correto.'
        });
      }

      // Check and add missing columns if needed
      const cols = queryAll(testDb, "PRAGMA table_info(discos_usb)").map(c => c.name.toLowerCase());
      if (!cols.includes('relatorio_files')) {
        try { testDb.run('ALTER TABLE discos_usb ADD COLUMN relatorio_files TEXT DEFAULT "[]"'); } catch (_) {}
      }
      if (!cols.includes('total_imagens')) {
        try { testDb.run('ALTER TABLE discos_usb ADD COLUMN total_imagens INTEGER DEFAULT 0'); } catch (_) {}
      }
      if (!cols.includes('total_pastas')) {
        try { testDb.run('ALTER TABLE discos_usb ADD COLUMN total_pastas INTEGER DEFAULT 0'); } catch (_) {}
      }

      // Create usuarios table if it doesn't exist in old DB
      if (!tableNames.includes('usuarios')) {
        testDb.run(`
          CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            is_admin INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            password TEXT
          );
        `);
        testDb.run(
          'INSERT INTO usuarios (username, is_admin, created_at, password) VALUES (?, ?, ?, ?)',
          ['jmagalhaes', 1, new Date().toISOString().replace('T', ' ').slice(0, 19), '']
        );
      }

      // Backup old file if exists
      if (fs.existsSync(DB_FILE)) {
        try { fs.copyFileSync(DB_FILE, `${DB_FILE}.bak`); } catch (_) {}
      }

      // Write new database file
      fs.writeFileSync(DB_FILE, Buffer.from(testDb.export()));
      db = testDb;

      const totalDiscosRow = queryOne(db, 'SELECT COUNT(*) as count FROM discos_usb');
      const totalUsuariosRow = queryOne(db, 'SELECT COUNT(*) as count FROM usuarios');

      console.log(`[RIDIS] Base de dados SQLite 3 restaurada com sucesso! ${totalDiscosRow?.count || 0} discos, ${totalUsuariosRow?.count || 0} utilizadores.`);

      res.json({
        success: true,
        message: 'Base de dados SQLite 3 restaurada com sucesso!',
        totalDiscos: totalDiscosRow?.count || 0,
        totalUsuarios: totalUsuariosRow?.count || 0,
        filename: path.basename(DB_FILE)
      });
    } catch (err: any) {
      console.error('[RIDIS] Erro ao restaurar base de dados:', err);
      res.status(500).json({ error: `Falha ao processar ficheiro SQLite 3: ${err?.message || 'Ficheiro corrompido'}` });
    }
  });

  // Upload and parse Snap2HTML report (.html)
  app.post('/api/upload-report', (req, res) => {
    try {
      const { filename, content, diskId } = req.body;
      if (!filename || !content) {
        return res.status(400).json({ error: 'Nome do ficheiro e conteúdo HTML são obrigatórios.' });
      }

      const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9_\-\.]/g, '_');
      const filePath = path.join(REPORTS_DIR, safeFilename);
      fs.writeFileSync(filePath, content, 'utf-8');

      // Parse Snap2HTML content
      const files = parseSnap2Html(content);

      if (diskId) {
        const id = Number(diskId);
        const current = queryOne(db, 'SELECT * FROM discos_usb WHERE id = ?', [id]);
        if (current) {
          const filesJson = JSON.stringify(files);
          db.run(`
            UPDATE discos_usb
            SET relatorio_path = ?,
                relatorio_files = ?,
                total_imagens = CASE WHEN total_imagens = 0 OR total_imagens IS NULL THEN ? ELSE total_imagens END
            WHERE id = ?
          `, [safeFilename, filesJson, files.length, id]);
          saveDatabase(db);
        }
      }

      res.json({
        success: true,
        filename: safeFilename,
        totalFiles: files.length,
        files: files.slice(0, 1000),
        reportUrl: `/api/reports/${encodeURIComponent(safeFilename)}`
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro ao processar relatório Snap2HTML' });
    }
  });

  // Serve raw Snap2HTML report for interactive viewing
  app.get('/api/reports/:filename', (req, res) => {
    try {
      const filename = path.basename(req.params.filename);
      const filePath = path.join(REPORTS_DIR, filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).send('Relatório Snap2HTML não encontrado no servidor.');
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.sendFile(filePath);
    } catch (err: any) {
      res.status(500).send('Erro ao abrir relatório.');
    }
  });

  // Batch upload and link Snap2HTML reports
  app.post('/api/batch-reports', (req, res) => {
    try {
      const { reports } = req.body;
      if (!Array.isArray(reports) || reports.length === 0) {
        return res.status(400).json({ error: 'Nenhum relatório fornecido.' });
      }

      const allDiscos = queryAll(db, 'SELECT id, ticket_num, id_disco, numero_serie, arquivo, relatorio_path FROM discos_usb');
      let matchedCount = 0;
      let savedCount = 0;
      const details: any[] = [];

      for (const item of reports) {
        if (!item.filename || !item.content) continue;
        const safeFilename = path.basename(item.filename).replace(/[^a-zA-Z0-9_\-\.]/g, '_');
        const filePath = path.join(REPORTS_DIR, safeFilename);
        fs.writeFileSync(filePath, item.content, 'utf-8');
        savedCount++;

        const files = parseSnap2Html(item.content);
        const lowerName = safeFilename.toLowerCase();

        // Extract title or root path from HTML content for smarter matching
        const titleMatch = /<title>(.*?)<\/title>/i.exec(item.content);
        const reportTitle = (titleMatch ? titleMatch[1] : '').toLowerCase();
        const rootMatch = /(?:var\s+root\s*=\s*["']([^"']+)["']|root\s*:\s*["']([^"']+)["'])/i.exec(item.content);
        const rootPath = (rootMatch ? rootMatch[1] || rootMatch[2] : '').toLowerCase();

        // 1. If explicit targetDiskId provided by user in UI
        let matched = item.targetDiskId
          ? allDiscos.find(d => d.id === Number(item.targetDiskId))
          : null;

        // 2. Automatic matching criteria if not manually assigned
        if (!matched) {
          matched = allDiscos.find(d => {
            const t = (d.ticket_num || '').toLowerCase();
            const id = (d.id_disco || '').toLowerCase();
            const sn = (d.numero_serie || '').toLowerCase();
            const arq = (d.arquivo || '').toLowerCase();

            // Match by Ticket Number (e.g. GLPI-2025-001 or 2025-001)
            const matchTicket = t && (lowerName.includes(t) || reportTitle.includes(t) || rootPath.includes(t));
            // Match by ID Disco (e.g. ADVIS_01, PRR-D01)
            const matchId = id && (lowerName.includes(id) || reportTitle.includes(id) || rootPath.includes(id));
            // Match by Serial Number
            const matchSn = sn && (lowerName.includes(sn) || reportTitle.includes(sn) || rootPath.includes(sn));
            // Match by exact relatorio_path
            const matchRel = d.relatorio_path && d.relatorio_path.toLowerCase() === lowerName;

            return matchRel || matchTicket || matchId || matchSn;
          });
        }

        if (matched) {
          matchedCount++;
          const filesJson = JSON.stringify(files);
          db.run(`
            UPDATE discos_usb
            SET relatorio_path = ?,
                relatorio_files = ?,
                total_imagens = CASE WHEN total_imagens = 0 OR total_imagens IS NULL THEN ? ELSE total_imagens END
            WHERE id = ?
          `, [safeFilename, filesJson, files.length, matched.id]);

          details.push({
            filename: safeFilename,
            matchedDisk: matched.id_disco || matched.ticket_num,
            diskId: matched.id,
            totalFiles: files.length,
            status: 'associado'
          });
        } else {
          details.push({
            filename: safeFilename,
            totalFiles: files.length,
            status: 'gravado_sem_associacao_automatica'
          });
        }
      }

      saveDatabase(db);

      res.json({
        success: true,
        savedCount,
        matchedCount,
        unmatchedCount: savedCount - matchedCount,
        details
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Erro no processamento em lote' });
    }
  });

  // ==========================================
  // VITE DEV SERVER / STATIC MIDDLEWARE
  // ==========================================
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[RIDIS] Servidor RIDIS Express em execução na porta ${PORT} com base de dados SQLite 3 (${DB_FILE})`);
  });
}

startServer().catch(err => {
  console.error('[RIDIS] Falha ao iniciar servidor:', err);
  process.exit(1);
});
