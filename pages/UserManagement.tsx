import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UserModal from '../components/UserModal';
import ProfileModal from '../components/ProfileModal';
import ActionMenu from '../components/ActionMenu';
import { MenuPermissions } from '../types/authTypes';

export default function UserManagementPage() {
    const [activeTab, setActiveTab] = useState<'users' | 'profiles'>('users');
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [profileToEdit, setProfileToEdit] = useState<{ id: string; name: string; description: string; permissions: MenuPermissions } | null>(null);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [createdUserName, setCreatedUserName] = useState('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteProfileModalOpen, setDeleteProfileModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
    const [roleToDelete, setRoleToDelete] = useState<{ id: string; name: string } | null>(null);
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [userToApprove, setUserToApprove] = useState<{ id: string; name: string; email: string } | null>(null);
    const [approving, setApproving] = useState(false);

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
        isManager,
        createRole,
        updateRole,
        deleteRole,
        getRolePermissions
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
            case 'usuario': return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400';
            default: return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
        }
    };

    const handleCreateUser = async (email: string, password: string, name: string, roleId: string) => {
        const success = await createUser(email, password, name, roleId);
        if (success) {
            setCreatedUserName(name);
            setSuccessModalOpen(true);
        }
        return success;
    };

    const handleRoleChange = async (userId: string, newRoleId: string) => {
        return await updateUserRole(userId, newRoleId);
    };

    const handleDeleteClick = (userId: string, userName: string) => {
        setUserToDelete({ id: userId, name: userName });
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (userToDelete) {
            await deleteUser(userToDelete.id);
            setDeleteModalOpen(false);
            setUserToDelete(null);
        }
    };

    const handleApproveClick = (userId: string, userName: string, userEmail: string) => {
        setUserToApprove({ id: userId, name: userName, email: userEmail });
        setApproveModalOpen(true);
    };

    const confirmApprove = async () => {
        if (userToApprove) {
            setApproving(true);
            try {
                const success = await approveUser(userToApprove.id);
                if (success) {
                    setApproveModalOpen(false);
                    setUserToApprove(null);
                } else {
                    alert('Erro ao aprovar usuário. Verifique as permissões.');
                }
            } catch {
                alert('Erro ao aprovar usuário.');
            } finally {
                setApproving(false);
            }
        }
    };

    const handleCreateProfile = async (name: string, description: string, permissions: MenuPermissions) => {
        if (profileToEdit) {
            const success = await updateRole(profileToEdit.id, name, description, permissions);
            if (success) {
                setProfileModalOpen(false);
                setProfileToEdit(null);
            }
            return success;
        } else {
            const success = await createRole(name, description, permissions);
            if (success) {
                setProfileModalOpen(false);
            }
            return success;
        }
    };

    const handleEditProfile = async (role: any) => {
        const permissions = await getRolePermissions(role.id);
        setProfileToEdit({
            id: role.id,
            name: role.name,
            description: role.description,
            permissions
        });
        setProfileModalOpen(true);
    };

    const handleDeleteProfileClick = (roleId: string, roleName: string) => {
        setRoleToDelete({ id: roleId, name: roleName });
        setDeleteProfileModalOpen(true);
    };

    const confirmDeleteProfile = async () => {
        if (roleToDelete) {
            await deleteRole(roleToDelete.id);
            setDeleteProfileModalOpen(false);
            setRoleToDelete(null);
        }
    };

    const filteredUsers = showDeleted
        ? users.filter(u => u.deletedAt)
        : users.filter(u => !u.deletedAt);

    const pendingCount = users.filter(u => u.status === 'Pendente' && !u.deletedAt).length;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Gestão de Usuários
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Gerencie usuários e perfis de acesso
                    </p>
                </div>

                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'users'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                            }`}
                    >
                        Usuários
                    </button>
                    <button
                        onClick={() => setActiveTab('profiles')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'profiles'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                            }`}
                    >
                        Perfis de Acesso
                    </button>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'users' && (
                <>
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
                                                            className={`pl-3 pr-8 py-1.5 rounded-lg text-sm font-medium border-0 cursor-pointer focus:ring-2 focus:ring-primary ${getRoleBadgeColor(userItem.roleName)}`}
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
                                                        onApprove={isManager && userItem.status === 'Pendente' ? () => handleApproveClick(userItem.id, userItem.name, userItem.email) : undefined}
                                                        onDeactivate={() => updateUserStatus(userItem.id, 'Inativo')}
                                                        onActivate={() => updateUserStatus(userItem.id, 'Ativo')}
                                                        onDelete={() => handleDeleteClick(userItem.id, userItem.name)}
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

                    {/* Success Modal */}
                    {successModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSuccessModalOpen(false)}></div>
                            <div className="relative bg-white dark:bg-card-dark rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="material-icons-round text-emerald-600 dark:text-emerald-400 text-4xl">check_circle</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                        Usuário criado com sucesso!
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                                        O usuário <strong>{createdUserName}</strong> foi adicionado ao sistema.
                                    </p>
                                    <button
                                        onClick={() => setSuccessModalOpen(false)}
                                        className="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors"
                                    >
                                        OK
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Delete Confirmation Modal */}
                    {deleteModalOpen && userToDelete && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteModalOpen(false)}></div>
                            <div className="relative bg-white dark:bg-card-dark rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="material-icons-round text-red-600 dark:text-red-400 text-4xl">warning</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                        Confirmar exclusão
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                                        Tem certeza que deseja excluir o usuário <strong>{userToDelete.name}</strong>?
                                        <br />
                                        <span className="text-sm">Esta ação pode ser revertida posteriormente.</span>
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setDeleteModalOpen(false)}
                                            className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={confirmDelete}
                                            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Approve Confirmation Modal */}
                    {approveModalOpen && userToApprove && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setApproveModalOpen(false)}></div>
                            <div className="relative bg-white dark:bg-card-dark rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="material-icons-round text-emerald-600 dark:text-emerald-400 text-4xl">verified_user</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                        Aprovar Acesso
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 mb-2">
                                        Tem certeza que deseja aprovar o acesso de:
                                    </p>
                                    <p className="text-slate-900 dark:text-white font-semibold mb-1">
                                        {userToApprove.name}
                                    </p>
                                    <p className="text-sm text-primary mb-6">
                                        {userToApprove.email}
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setApproveModalOpen(false)}
                                            disabled={approving}
                                            className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={confirmApprove}
                                            disabled={approving}
                                            className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {approving ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    Aprovando...
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-icons-round text-lg">check</span>
                                                    Aprovar
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'profiles' && (
                <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Perfis Cadastrados
                        </h2>
                        <button
                            onClick={() => {
                                setProfileToEdit(null);
                                setProfileModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors"
                        >
                            <span className="material-icons-round text-lg">add</span>
                            Novo Perfil
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nome</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Descrição</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {roles.map((role) => (
                                    <tr key={role.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-900 dark:text-white">{role.name}</p>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                            {role.description}
                                        </td>
                                        <td className="px-6 py-4">
                                            <ActionMenu
                                                onEdit={() => handleEditProfile(role)}
                                                editLabel="Editar Perfil"
                                                onDelete={() => handleDeleteProfileClick(role.id, role.name)}
                                                deleteLabel="Excluir Perfil"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <ProfileModal
                isOpen={profileModalOpen}
                onClose={() => setProfileModalOpen(false)}
                onSave={handleCreateProfile}
                editData={profileToEdit}
            />

            {deleteProfileModalOpen && roleToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteProfileModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-card-dark rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-icons-round text-red-600 dark:text-red-400 text-4xl">warning</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                Confirmar exclusão de perfil
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                Tem certeza que deseja excluir o perfil <strong>{roleToDelete.name}</strong>?
                                <br />
                                <span className="text-sm">Esta ação não pode ser desfeita.</span>
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteProfileModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDeleteProfile}
                                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
