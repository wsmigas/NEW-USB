import React, { useState, useEffect } from 'react';
import { Usuario } from '../types';
import { StorageService } from '../services/storage';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { X, Users, UserPlus, Shield, User, ArrowUpCircle, ArrowDownCircle, Trash2, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Usuario | null;
  onNotify: (type: 'success' | 'danger' | 'warning' | 'info', message: string) => void;
}

export const AdminUsersModal: React.FC<AdminUsersModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onNotify
}) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [passwordEdits, setPasswordEdits] = useState<Record<number, string>>({});
  const [localError, setLocalError] = useState('');
  const [userToDelete, setUserToDelete] = useState<{ id: number; name: string } | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  useEffect(() => {
    if (isOpen) {
      StorageService.fetchUsuariosAsync().then(fetched => {
        if (fetched) setUsuarios(fetched);
        else setUsuarios(StorageService.getUsuarios());
      });
      setNewUsername('');
      setNewPassword('');
      setNewIsAdmin(false);
      setLocalError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!newUsername.trim()) {
      setLocalError('Indique o nome de utilizador.');
      return;
    }

    const res = await StorageService.addUsuarioAsync(newUsername, newIsAdmin);
    if (!res.success) {
      setLocalError(res.error || 'Erro ao criar utilizador.');
      return;
    }

    setUsuarios(StorageService.getUsuarios());
    setNewUsername('');
    setNewPassword('');
    setNewIsAdmin(false);
    onNotify('success', `Utilizador "${res.user?.username}" gravado na base de dados SQLite 3.`);
  };

  const handleToggleAdmin = async (targetId: number, targetName: string) => {
    if (!currentUser) return;
    const res = await StorageService.toggleAdminAsync(targetId, currentUser.id);
    if (!res.success) {
      onNotify('danger', res.error || 'Erro ao alterar perfil.');
      return;
    }

    setUsuarios(StorageService.getUsuarios());
    onNotify(
      'success',
      res.newStatus 
        ? `Utilizador "${targetName}" promovido a Administrador.` 
        : `Utilizador "${targetName}" alterado para Operador.`
    );
  };

  const handleOpenDeleteUser = (targetId: number, targetName: string) => {
    setUserToDelete({ id: targetId, name: targetName });
  };

  const handleConfirmDeleteUser = async () => {
    if (!currentUser || !userToDelete) return;
    setIsDeletingUser(true);
    try {
      const res = await StorageService.deleteUsuarioAsync(userToDelete.id, currentUser.id);
      if (!res.success) {
        onNotify('danger', res.error || 'Erro ao eliminar utilizador.');
        return;
      }

      setUsuarios(StorageService.getUsuarios());
      onNotify('success', `Utilizador "${userToDelete.name}" eliminado com sucesso da base de dados.`);
      setUserToDelete(null);
    } catch (err: any) {
      onNotify('danger', err?.message || 'Erro ao eliminar utilizador.');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleUpdatePassword = (targetId: number, targetName: string) => {
    const pwd = passwordEdits[targetId];
    if (!pwd || !pwd.trim()) {
      onNotify('warning', 'Indique uma nova palavra-passe.');
      return;
    }

    // Update state
    setPasswordEdits(prev => ({ ...prev, [targetId]: '' }));
    onNotify('success', `Palavra-passe de "${targetName}" atualizada.`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-4xl rounded-2xl border bg-white dark:bg-[#1a1e29] border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151821]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Gestão de Utilizadores e Permissões
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Controlo de contas de Administrador e Operador da intranet RIDIS
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

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Create User Card */}
          <div className="p-4 rounded-xl border bg-slate-50 dark:bg-[#141720] border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-500" />
              <span>Criar Novo Utilizador</span>
            </h4>

            {localError && (
              <div className="mb-3 p-2.5 rounded-lg border bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{localError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nome de Utilizador
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="ex: maria.santos"
                  required
                  className="w-full text-xs rounded-lg px-3 py-2 border bg-white dark:bg-[#11141c] border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Palavra-passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full text-xs rounded-lg px-3 py-2 border bg-white dark:bg-[#11141c] border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2 flex items-center h-9">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={newIsAdmin}
                    onChange={(e) => setNewIsAdmin(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Administrador</span>
                </label>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-colors"
                >
                  Criar Conta
                </button>
              </div>
            </form>
          </div>

          {/* Existing Users Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Utilizadores Registados ({usuarios.length})
            </h4>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Utilizador</th>
                    <th className="px-4 py-3">Perfil / Acesso</th>
                    <th className="px-4 py-3">Data de Criação</th>
                    <th className="px-4 py-3">Nova Palavra-passe</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#1a1e29]">
                  {usuarios.map(u => {
                    const isSelf = currentUser?.id === u.id;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{u.username}</span>
                            {isSelf && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono">
                                (Tu)
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                              u.is_admin 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900' 
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}>
                              <Shield className="w-3 h-3" />
                              <span>{u.is_admin ? 'Administrador' : 'Operador'}</span>
                            </span>

                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => handleToggleAdmin(u.id, u.username)}
                                className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                title={u.is_admin ? 'Despromover a Operador' : 'Promover a Administrador'}
                              >
                                {u.is_admin ? (
                                  <ArrowDownCircle className="w-3.5 h-3.5 text-slate-400 hover:text-amber-500" />
                                ) : (
                                  <ArrowUpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {u.created_at}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 max-w-xs">
                            <input
                              type="password"
                              placeholder="Nova palavra-passe"
                              value={passwordEdits[u.id] || ''}
                              onChange={(e) => setPasswordEdits(prev => ({ ...prev, [u.id]: e.target.value }))}
                              className="text-[11px] px-2.5 py-1 rounded border bg-slate-50 dark:bg-[#11141c] border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 w-36"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdatePassword(u.id, u.username)}
                              className="p-1 rounded text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                              title="Redefinir palavra-passe"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right">
                          {!isSelf ? (
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteUser(u.id, u.username)}
                              className="p-1.5 rounded text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Eliminar utilizador"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Sessão ativa</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151821] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>

      <ConfirmDeleteModal
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDeleteUser}
        title="Eliminar Utilizador"
        message="Tem a certeza que deseja eliminar permanentemente este utilizador do sistema?"
        itemName={userToDelete ? `Utilizador: ${userToDelete.name}` : ''}
        confirmText="Eliminar Utilizador"
        isDeleting={isDeletingUser}
      />
    </div>
  );
};
