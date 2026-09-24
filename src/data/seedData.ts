import { DiscoUSB, Usuario } from '../types';

export const INITIAL_USERS: Usuario[] = [
  {
    id: 1,
    username: 'jmagalhaes',
    is_admin: true,
    created_at: '2025-01-15 09:30:00'
  },
  {
    id: 2,
    username: 'operador.dglab',
    is_admin: false,
    created_at: '2025-02-01 11:20:00'
  },
  {
    id: 3,
    username: 'admin',
    is_admin: true,
    created_at: '2025-01-10 08:00:00'
  }
];

export const INITIAL_DISCOS: DiscoUSB[] = [
  {
    id: 1,
    arquivo: 'ADPRT',
    remetente: 'José Magalhães',
    data_entrada: '2026-03-12',
    ticket_num: 'GLPI-2026-0842',
    id_disco: 'PRR-ADPRT-2025_001-A',
    projeto: 'PRR',
    localizacao: 'Armário A - Prateleira 2',
    tamanho_disco: '4 TB',
    marca: 'Seagate Expansion',
    numero_serie: 'NA89XZ14',
    verificado: true,
    ticket_integracao: 'INT-DGLAB-3041',
    integrado: true,
    armazenado_servidor: true,
    total_imagens: 42150,
    observacoes: 'Matriz de digitalização de Paróquias do Porto (séc. XIX). Checksum MD5 verificado.',
    relatorio_path: 'PRR-ADPRT-2025_001-A_1788867403.html',
    relatorio_files: [
      'PT-ADPRT-PRQ-PPRT01-001-0001.tif',
      'PT-ADPRT-PRQ-PPRT01-001-0002.tif',
      'PT-ADPRT-PRQ-PPRT01-002-0001.tif',
      'PT-ADPRT-NOT-CNP03-014-0022.tif',
      'PT-ADPRT-NOT-CNP03-014-0023.tif'
    ]
  },
  {
    id: 2,
    arquivo: 'ANTT',
    remetente: 'Ana Ribeiro',
    data_entrada: '2026-03-10',
    ticket_num: 'GLPI-2026-0810',
    id_disco: 'PRR-ANTT-2026_001-A',
    projeto: 'PRR',
    localizacao: 'Cofre Matrizes - Piso -1',
    tamanho_disco: '5 TB',
    marca: 'Western Digital My Passport',
    numero_serie: 'WXE1A83KD291',
    verificado: true,
    ticket_integracao: 'INT-DGLAB-3038',
    integrado: true,
    armazenado_servidor: true,
    total_imagens: 58200,
    observacoes: 'Inquirições Régias D. Afonso III. Ficheiros TIFF 400dpi sem compressão.',
    relatorio_path: 'PRR-ANTT-2026_001-A_1789638859.html',
    relatorio_files: [
      'PT-ANTT-INQ-001-CX01-0001.tif',
      'PT-ANTT-INQ-001-CX01-0002.tif',
      'PT-ANTT-INQ-001-CX01-0003.tif',
      'PT-ANTT-CR-DCR04-0012.tif'
    ]
  },
  {
    id: 3,
    arquivo: 'ADAVR',
    remetente: 'Carlos Mendes',
    data_entrada: '2026-03-05',
    ticket_num: 'GLPI-2026-0792',
    id_disco: 'PRR-ADAVR-2025_001-A',
    projeto: 'PRR',
    localizacao: 'Armário B - Gaveta 1',
    tamanho_disco: '2 TB',
    marca: 'Toshiba Canvio',
    numero_serie: '22M9C9SSTDA1',
    verificado: true,
    ticket_integracao: 'INT-DGLAB-2995',
    integrado: true,
    armazenado_servidor: false,
    total_imagens: 28410,
    observacoes: 'Fundo Notarial de Aveiro. Pronto para migração para o storage principal.',
    relatorio_path: 'PRR-ADAVR-2025_001-A_1788854365.html',
    relatorio_files: [
      'PT-ADAVR-NOT-AVR01-0001.tif',
      'PT-ADAVR-NOT-AVR01-0002.tif',
      'PT-ADAVR-PRQ-AGD01-0012.tif'
    ]
  },
  {
    id: 4,
    arquivo: 'AHU',
    remetente: 'Sofia Carvalhal',
    data_entrada: '2026-02-28',
    ticket_num: 'GLPI-2026-0750',
    id_disco: 'PRR-AHU-2024_028-B',
    projeto: 'PRR',
    localizacao: 'Armário C - Prateleira 1',
    tamanho_disco: '4 TB',
    marca: 'LaCie Rugged USB-C',
    numero_serie: 'NL4829104A',
    verificado: true,
    ticket_integracao: 'INT-DGLAB-2970',
    integrado: false,
    armazenado_servidor: true,
    total_imagens: 31200,
    observacoes: 'Conselho Ultramarino - Série Moçambique e Índia. Aguarda validação do arquivo.',
    relatorio_path: 'PRR-AHU-2024_028-B_1788945504.html',
    relatorio_files: [
      'PT-AHU-CU-015-CX002-0001.tif',
      'PT-AHU-CU-015-CX002-0002.tif',
      'PT-AHU-CU-IND-001-0044.tif'
    ]
  },
  {
    id: 5,
    arquivo: 'ADSTB',
    remetente: 'Manuel Fernandes',
    data_entrada: '2026-02-20',
    ticket_num: 'GLPI-2026-0715',
    id_disco: 'PRR-ADSTB-2025_024-A',
    projeto: 'PRR',
    localizacao: 'Armário B - Prateleira 4',
    tamanho_disco: '4 TB',
    marca: 'Seagate Backup Plus',
    numero_serie: '2HGE4980',
    verificado: true,
    ticket_integracao: 'INT-DGLAB-2940',
    integrado: true,
    armazenado_servidor: true,
    total_imagens: 38940,
    observacoes: 'Registos paroquiais de Setúbal e Alcácer do Sal.',
    relatorio_path: 'PRR-ADSTB-2025_024-A_1788941735.html',
    relatorio_files: [
      'PT-ADSTB-PRQ-STB02-0001.tif',
      'PT-ADSTB-PRQ-STB02-0002.tif'
    ]
  },
  {
    id: 6,
    arquivo: 'ADBJA',
    remetente: 'Rita Alentejano',
    data_entrada: '2026-02-15',
    ticket_num: 'GLPI-2026-0688',
    id_disco: 'PRR-ADBJA-2025_001-A',
    projeto: 'PRR',
    localizacao: 'Armário A - Gaveta 3',
    tamanho_disco: '2 TB',
    marca: 'Western Digital Elements',
    numero_serie: 'WDBU6Y0020BBK-01',
    verificado: true,
    ticket_integracao: 'INT-DGLAB-2911',
    integrado: true,
    armazenado_servidor: true,
    total_imagens: 19850,
    observacoes: 'Tribunal Judicial de Beja - Processos Cíveis antigos.',
    relatorio_path: 'PRR-ADBJA-2025_001-A_1788854819.html',
    relatorio_files: [
      'PT-ADBJA-TRIB-BJA01-0001.tif',
      'PT-ADBJA-TRIB-BJA01-0002.tif'
    ]
  },
  {
    id: 7,
    arquivo: 'ADVRL',
    remetente: 'Gonçalo Pires',
    data_entrada: '2026-02-02',
    ticket_num: 'GLPI-2026-0640',
    id_disco: 'PRR-ADVRL-2025_013-A',
    projeto: 'PRR',
    localizacao: 'Armário D - Prateleira 2',
    tamanho_disco: '2 TB',
    marca: 'SanDisk Extreme SSD',
    numero_serie: 'SDSSDE61-2T00',
    verificado: true,
    ticket_integracao: 'INT-DGLAB-2880',
    integrado: false,
    armazenado_servidor: false,
    total_imagens: 14200,
    observacoes: 'Governadoria Civil de Vila Real. Em processamento de integridade.',
    relatorio_path: 'PRR-ADVRL-2025_013-A_1788949623.html',
    relatorio_files: [
      'PT-ADVRL-GCVRL-001-001.tif',
      'PT-ADVRL-GCVRL-001-002.tif'
    ]
  },
  {
    id: 8,
    arquivo: 'ADFAR',
    remetente: 'Pedro Silveira',
    data_entrada: '2026-01-28',
    ticket_num: 'GLPI-2026-0612',
    id_disco: 'PRR-ADFAR-2026_002-A',
    projeto: 'PRR',
    localizacao: 'Armário A - Prateleira 1',
    tamanho_disco: '4 TB',
    marca: 'Seagate Expansion',
    numero_serie: 'NA778841',
    verificado: true,
    ticket_integracao: 'INT-DGLAB-2850',
    integrado: true,
    armazenado_servidor: true,
    total_imagens: 33700,
    observacoes: 'Capitania do Porto de Faro e Alfândega.',
    relatorio_path: 'PRR-ADFAR-2026_002-A_1788951249.html',
    relatorio_files: [
      'PT-ADFAR-ALF-FAR01-0001.tif',
      'PT-ADFAR-ALF-FAR01-0002.tif'
    ]
  },
  {
    id: 9,
    arquivo: 'CPF',
    remetente: 'Marta Vasconcelos',
    data_entrada: '2026-01-18',
    ticket_num: 'GLPI-2026-0570',
    id_disco: 'MDO-00032155',
    projeto: 'MDO',
    localizacao: 'Cofre Matrizes - Gaveta 2',
    tamanho_disco: '1 TB',
    marca: 'Samsung T7 Shield',
    numero_serie: 'S6XNNS0T401928',
    verificado: false,
    ticket_integracao: '',
    integrado: false,
    armazenado_servidor: false,
    total_imagens: 8400,
    observacoes: 'Espólio Fotográfico Aurélio Paz dos Reis. Aguarda verificação física de leitura.',
    relatorio_path: 'MDO-00032155_1789641136.html',
    relatorio_files: [
      'PT-CPF-APR-001-0001.tif',
      'PT-CPF-APR-001-0002.tif'
    ]
  },
  {
    id: 10,
    arquivo: 'ADVIS',
    remetente: 'António Lopes',
    data_entrada: '2026-01-10',
    ticket_num: 'GLPI-2026-0530',
    id_disco: 'PRR-ADVIS-2025_016-A',
    projeto: 'PRR',
    localizacao: 'Armário B - Prateleira 3',
    tamanho_disco: '2 TB',
    marca: 'Western Digital My Passport',
    numero_serie: 'WXE1E9482710',
    verificado: true,
    ticket_integracao: 'INT-DGLAB-2802',
    integrado: true,
    armazenado_servidor: true,
    total_imagens: 22600,
    observacoes: 'Registos Notariais de Lamego e Mangualde.',
    relatorio_path: 'PRR-ADVIS-2025_016-A_1788958478.html',
    relatorio_files: [
      'PT-ADVIS-NOT-LMG01-0001.tif',
      'PT-ADVIS-NOT-LMG01-0002.tif'
    ]
  }
];
