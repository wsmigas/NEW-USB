export interface DiscoUSB {
  id: number;
  arquivo: string; // e.g., 'ADPRT', 'ANTT'
  remetente: string;
  data_entrada: string; // YYYY-MM-DD
  ticket_num: string; // Ticket de envio (obrigatório)
  id_disco: string; // ID do disco (ex: PRR-ADPRT-2025_001-A)
  projeto: string; // ex: PRR, MDO, FS
  localizacao: string; // ex: Sala 4 - Armário B
  tamanho_disco: string; // ex: 2 TB, 4 TB
  marca: string; // ex: Seagate, WD
  numero_serie: string; // n/s: (obrigatório)
  verificado: boolean; // V
  ticket_integracao: string; // Ticket de integração
  integrado: boolean; // I
  armazenado_servidor: boolean; // A
  total_imagens: number;
  observacoes: string;
  relatorio_path?: string; // Snap2HTML filename
  relatorio_files?: string[]; // indexed filenames inside the report
  has_relatorio?: boolean;
  relatorio_files_count?: number;
  created_at?: string;
}

export interface Usuario {
  id: number;
  username: string;
  password_hash?: string;
  is_admin: boolean;
  created_at: string;
}

export interface FilterState {
  q: string;
  f_arquivo: string;
  f_projeto: string;
  f_localizacao: string;
  f_verificado: string; // '' | '1' | '0'
  f_integrado: string;  // '' | '1' | '0'
  f_armazenado: string; // '' | '1' | '0'
}

export interface DatabaseStatus {
  dbType: string;
  filename: string;
  dbPath: string;
  sizeBytes: number;
  totalDiscos: number;
  totalUsuarios: number;
  isPersistent: boolean;
}

export const ARQUIVOS_MAP: Record<string, string> = {
  "ANTT": "Arquivo Nacional da Torre do Tombo",
  "ADAVR": "Arquivo Distrital de Aveiro",
  "ADBJA": "Arquivo Distrital de Beja",
  "ADBGC": "Arquivo Distrital de Bragança",
  "ADCTB": "Arquivo Distrital de Castelo Branco",
  "ADEVR": "Arquivo Distrital de Évora",
  "ADFAR": "Arquivo Distrital de Faro",
  "ADGRD": "Arquivo Distrital da Guarda",
  "ADLRA": "Arquivo Distrital de Leiria",
  "ADPTG": "Arquivo Distrital de Portalegre",
  "ADPRT": "Arquivo Distrital do Porto",
  "ADSTR": "Arquivo Distrital de Santarém",
  "ADSTB": "Arquivo Distrital de Setúbal",
  "ADVCT": "Arquivo Distrital de Viana do Castelo",
  "ADVRL": "Arquivo Distrital de Vila Real",
  "ADVIS": "Arquivo Distrital de Viseu",
  "AHU": "Arquivo Histórico Ultramarino",
  "CPF": "Centro Português de Fotografia"
};
