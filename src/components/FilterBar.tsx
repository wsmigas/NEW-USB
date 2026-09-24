import React from 'react';
import { FilterState, ARQUIVOS_MAP } from '../types';
import { Search, X, RotateCcw } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onResetFilters: () => void;
  projetos: string[];
  localizacoes: string[];
  totalResults: number;
  displayedCount?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  projetos,
  localizacoes,
  totalResults,
  displayedCount
}) => {
  const hasActiveFilters = Boolean(
    filters.q ||
    filters.f_arquivo ||
    filters.f_projeto ||
    filters.f_localizacao ||
    filters.f_verificado !== '' ||
    filters.f_integrado !== '' ||
    filters.f_armazenado !== ''
  );

  return (
    <div className="mb-4">
      {/* Filters Card Container */}
      <div className="p-3 rounded-xl border bg-white dark:bg-[#181c26] border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
          
          {/* 1. Arquivo Picklist */}
          <div className="lg:col-span-2">
            <select
              value={filters.f_arquivo}
              onChange={(e) => onFilterChange('f_arquivo', e.target.value)}
              className="w-full text-xs rounded-lg px-2.5 py-2 border bg-slate-50 dark:bg-[#11141c] border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="">Todos Arquivos</option>
              {Object.keys(ARQUIVOS_MAP).map(sigla => (
                <option key={sigla} value={sigla}>
                  {sigla} - {ARQUIVOS_MAP[sigla]}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Projeto Picklist */}
          <div className="lg:col-span-2">
            <select
              value={filters.f_projeto}
              onChange={(e) => onFilterChange('f_projeto', e.target.value)}
              className={`w-full text-xs rounded-lg px-2.5 py-2 border bg-slate-50 dark:bg-[#11141c] text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium ${
                filters.f_projeto ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <option value="">Todos Projetos</option>
              {projetos.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* 3. Localização Picklist */}
          <div className="lg:col-span-2">
            <select
              value={filters.f_localizacao}
              onChange={(e) => onFilterChange('f_localizacao', e.target.value)}
              className={`w-full text-xs rounded-lg px-2.5 py-2 border bg-slate-50 dark:bg-[#11141c] text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium ${
                filters.f_localizacao ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <option value="">Todas Localizações</option>
              {localizacoes.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* 4. Status V (Verificado) */}
          <div className="col-span-1 lg:col-span-1">
            <select
              value={filters.f_verificado}
              onChange={(e) => onFilterChange('f_verificado', e.target.value)}
              className={`w-full text-xs rounded-lg px-2 py-2 border bg-slate-50 dark:bg-[#11141c] text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium ${
                filters.f_verificado !== '' ? 'border-amber-500 ring-1 ring-amber-500/30' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <option value="">V: Todos</option>
              <option value="1">V: SIM</option>
              <option value="0">V: NÃO</option>
            </select>
          </div>

          {/* 5. Status I (Integrado) */}
          <div className="col-span-1 lg:col-span-1">
            <select
              value={filters.f_integrado}
              onChange={(e) => onFilterChange('f_integrado', e.target.value)}
              className={`w-full text-xs rounded-lg px-2 py-2 border bg-slate-50 dark:bg-[#11141c] text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium ${
                filters.f_integrado !== '' ? 'border-amber-500 ring-1 ring-amber-500/30' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <option value="">I: Todos</option>
              <option value="1">I: SIM</option>
              <option value="0">I: NÃO</option>
            </select>
          </div>

          {/* 6. Status A (Armazenado) */}
          <div className="col-span-1 lg:col-span-1">
            <select
              value={filters.f_armazenado}
              onChange={(e) => onFilterChange('f_armazenado', e.target.value)}
              className={`w-full text-xs rounded-lg px-2 py-2 border bg-slate-50 dark:bg-[#11141c] text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium ${
                filters.f_armazenado !== '' ? 'border-amber-500 ring-1 ring-amber-500/30' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <option value="">A: Todos</option>
              <option value="1">A: SIM</option>
              <option value="0">A: NÃO</option>
            </select>
          </div>

          {/* 7. Search Input */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filters.q}
                onChange={(e) => onFilterChange('q', e.target.value)}
                placeholder="Pesquisar texto (* ou ?)..."
                className="w-full text-xs pl-8 pr-7 py-2 rounded-lg border bg-slate-50 dark:bg-[#11141c] border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
              {filters.q && (
                <button
                  onClick={() => onFilterChange('q', '')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                className="p-2 rounded-lg border border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                title="Limpar todos os filtros"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Helper Legend & Results status */}
      <div className="flex flex-wrap justify-between items-center px-1 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
        <div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">V</span> = Verificado &nbsp;·&nbsp; 
          <span className="font-semibold text-slate-700 dark:text-slate-300">I</span> = Integrado &nbsp;·&nbsp; 
          <span className="font-semibold text-slate-700 dark:text-slate-300">A</span> = Armazenado no Servidor
        </div>
        <div>
          {hasActiveFilters ? (
            <span>
              Filtros ativos: <strong className="font-mono text-blue-600 dark:text-blue-400">{displayedCount !== undefined ? Math.min(displayedCount, totalResults) : totalResults}</strong>
              {displayedCount !== undefined && displayedCount < totalResults ? ` de ${totalResults}` : ''} registos encontrados
            </span>
          ) : (
            <span>
              A mostrar os <strong className="font-mono text-blue-600 dark:text-blue-400">{displayedCount !== undefined ? Math.min(displayedCount, totalResults) : Math.min(25, totalResults)}</strong> registos mais recentes
              {totalResults > (displayedCount || 25) ? ` (de ${totalResults} no total)` : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
