import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserModal from '../components/UserModal';
import ActionMenu from '../components/ActionMenu';

export default function UserManagementPage() {
    const [userModalOpen, setUserModalOpen] = useState(false);

    const {
        users,
        roles,
        showDeleted,
        setShowDeleted,
        createUser,
        updateUserRole,
        updateUserStatus,
        deleteUser,
        restoreUser,
        approveUser,
        isManager
    } = useAuth();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Ativo': return 'text-emerald-500';
            case 'Inativo': return 'text-amber-500';
            case 'Pendente': return 'text-blue-500';
            default: return 'text-slate-500';
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'Ativo': return 'bg-emerald-100 dark:bg-emerald-900/30';
            case 'Inativo': return 'bg-amber-100 dark:bg-amber-900/30';
            case 'Pendente': return 'bg-blue-100 dark:bg-blue-900/30';
            default: return 'bg-slate-100 dark:bg-slate-700';
        }
    };

    const getRoleBadgeColor = (roleName: string) => {
        switch (roleName) {
            case 'admin': return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
            case 'tecnico': return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400';
            case 'gerente': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
            default: return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
        }
    };

    const handleCreateUser = async (email: string, password: string, name: string, roleId: string) => {
        return await createUser(email, password, name, roleId);
    };

    const handleRoleChange = async (userId: string, newRoleId: string) => {
        return await updateUserRole(userId, newRoleId);
    };

    const filteredUsers = showDeleted
        ? users.filter(u => u.deletedAt)
        : users.filter(u => !u.deletedAt);

    const pendingCount = users.filter(u => u.status === 'Pendente' && !u.deletedAt).length;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Gestão de Usuários
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Gerencie usuários e seus perfis de acesso
                </p>
            </div>

            {/* Pending Approval Alert */}
            {pendingCount > 0 && !showDeleted && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-3">
                    <span className="material-icons-round text-blue-500">hourglass_empty</span>
                    <p className="text-blue-700 dark:text-blue-300">
                        <strong>{pendingCount}</strong> usuário(s) aguardando aprovação
                    </p>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {showDeleted ? 'Usuários Excluídos' : `Usuários Cadastrados (${filteredUsers.length})`}
                    </h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowDeleted(!showDeleted)}
                            className={`flex items-center gap-2 text-sm transition-colors px-3 py-1.5 rounded-lg ${showDeleted
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <span className="material-icons-round text-lg">
                                {showDeleted ? 'visibility_off' : 'delete_outline'}
                            </span>
                            {showDeleted ? 'Ver Ativos' : 'Ver Excluídos'}
                        </button>
                        {!showDeleted && (
                            <button
                                onClick={() => setUserModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors"
                            >
                                <span className="material-icons-round text-lg">add</span>
                                Adicionar Usuário
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50">
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Usuário</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Perfil</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data Cadastro</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        {showDeleted ? 'Nenhum usuário excluído.' : 'Nenhum usuário cadastrado.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((userItem) => (
                                    <tr key={userItem.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${userItem.deletedAt ? 'opacity-60' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {userItem.status === 'Pendente' && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                                )}
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{userItem.name}</p>
                                                    <p className="text-sm text-primary">{userItem.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {userItem.deletedAt ? (
                                                <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getRoleBadgeColor(userItem.roleName)}`}>
                                                    {userItem.roleName}
                                                </span>
                                            ) : (
                                                <select
                                                    value={userItem.role_id || ''}
                                                    onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 cursor-pointer focus:ring-2 focus:ring-primary ${getRoleBadgeColor(userItem.roleName)}`}
                                                >
                                                    {roles.map((r) => (
                                                        <option key={r.id} value={r.id}>{r.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBg(userItem.status)} ${getStatusColor(userItem.status)}`}>
                                                {userItem.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                            {userItem.createdAt}
                                        </td>
                                        <td className="px-6 py-4">
                                            <ActionMenu
                                                isDeleted={!!userItem.deletedAt}
                                                isPending={userItem.status === 'Pendente'}
                                                isActive={userItem.status === 'Ativo'}
                                                onApprove={isManager && userItem.status === 'Pendente' ? () => approveUser(userItem.id) : undefined}
                                                onDeactivate={() => updateUserStatus(userItem.id, 'Inativo')}
                                                onActivate={() => updateUserStatus(userItem.id, 'Ativo')}
                                                onDelete={() => deleteUser(userItem.id)}
                                                onRestore={() => restoreUser(userItem.id)}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Modal */}
            <UserModal
                isOpen={userModalOpen}
                onClose={() => setUserModalOpen(false)}
                onSave={handleCreateUser}
                roles={roles}
            />
        </div>
    );
}
