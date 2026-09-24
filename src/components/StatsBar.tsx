import React from 'react';
import { DiscoUSB } from '../types';
import { Database, Image as ImageIcon, CheckCircle, Server, CheckCheck } from 'lucide-react';

interface StatsBarProps {
  discos: DiscoUSB[];
  filteredDiscos: DiscoUSB[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ discos, filteredDiscos }) => {
  const isFiltered = filteredDiscos.length !== discos.length;
  const targetList = isFiltered ? filteredDiscos : discos;

  const total = targetList.length;
  const totalAllDiscos = discos.length;

  const totalImages = targetList.reduce((acc, curr) => acc + (curr.total_imagens || 0), 0);
  const totalAllImages = discos.reduce((acc, curr) => acc + (curr.total_imagens || 0), 0);

  const totalVerificados = targetList.filter(d => d.verificado).length;
  const totalIntegrados = targetList.filter(d => d.integrado).length;
  const totalArmazenados = targetList.filter(d => d.armazenado_servidor).length;

  const pctVerificados = total > 0 ? Math.round((totalVerificados / total) * 100) : 0;
  const pctIntegrados = total > 0 ? Math.round((totalIntegrados / total) * 100) : 0;
  const pctArmazenados = total > 0 ? Math.round((totalArmazenados / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 mb-4">
      {/* Metric 1: Total Discos */}
      <div className="p-3 rounded-lg border bg-white dark:bg-[#1a1e29] border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
          <Database className="w-3.5 h-3.5 text-blue-500" />
          <span>{isFiltered ? 'Discos Filtrados' : 'Discos / Matrizes'}</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {total}
          </span>
          {isFiltered && (
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
              de {totalAllDiscos}
            </span>
          )}
        </div>
      </div>

      {/* Metric 2: Total Imagens (dynamically calculated according to active filters) */}
      <div className="p-3 rounded-lg border bg-white dark:bg-[#1a1e29] border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
          <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
          <span>{isFiltered ? 'Imagens Filtradas' : 'Total Imagens'}</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
            {totalImages.toLocaleString('pt-PT')}
          </span>
          {isFiltered && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              de {totalAllImages.toLocaleString('pt-PT')}
            </span>
          )}
        </div>
      </div>

      {/* Metric 3: Verificados (V) */}
      <div className="p-3 rounded-lg border bg-white dark:bg-[#1a1e29] border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          <span>Verificados (V)</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {totalVerificados}
          </span>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            {pctVerificados}%
          </span>
        </div>
      </div>

      {/* Metric 4: Integrados (I) */}
      <div className="p-3 rounded-lg border bg-white dark:bg-[#1a1e29] border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
          <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
          <span>Integrados (I)</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
            {totalIntegrados}
          </span>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            {pctIntegrados}%
          </span>
        </div>
      </div>

      {/* Metric 5: Servidor (A) */}
      <div className="col-span-2 sm:col-span-1 p-3 rounded-lg border bg-white dark:bg-[#1a1e29] border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
          <Server className="w-3.5 h-3.5 text-amber-500" />
          <span>No Servidor (A)</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {totalArmazenados}
          </span>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            {pctArmazenados}%
          </span>
        </div>
      </div>
    </div>
  );
};
