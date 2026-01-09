import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types/authTypes';

type TabType = 'users' | 'profiles';

export default function UserManagementPage() {
    const [activeTab, setActiveTab] = useState<TabType>('users');
    const { users, profiles, updateUserProfile } = useAuth();

    const getStatusColor = (status: string) => {
        return status === 'Ativo'
            ? 'text-emerald-500'
            : 'text-amber-500';
    };

    const getProfileBadgeColor = (profile: string) => {
        switch (profile) {
            case 'admin':
                return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
            case 'tecnico':
                return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400';
            case 'gerente':
                return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
            default:
                return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Gestão de Usuários
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Gerencie usuários, perfis e permissões de acesso
                </p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-4 mb-6 border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-4 py-3 font-medium transition-all border-b-2 -mb-px ${activeTab === 'users'
                            ? 'text-primary border-primary'
                            : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    <span className="material-icons-round text-xl">people</span>
                    Usuários
                </button>
                <button
                    onClick={() => setActiveTab('profiles')}
                    className={`flex items-center gap-2 px-4 py-3 font-medium transition-all border-b-2 -mb-px ${activeTab === 'profiles'
                            ? 'text-primary border-primary'
                            : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    <span className="material-icons-round text-xl">shield</span>
                    Perfis de Acesso
                </button>
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Usuários Cadastrados ({users.length})
                        </h2>
                        <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                            <span className="material-icons-round text-lg">delete_outline</span>
                            Ver Excluídos
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Usuário
                                    </th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Perfil
                                    </th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Data Cadastro
                                    </th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">
                                                    {user.name}
                                                </p>
                                                <p className="text-sm text-primary">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={user.profile}
                                                onChange={(e) => updateUserProfile(user.id, e.target.value as UserProfile)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 cursor-pointer focus:ring-2 focus:ring-primary ${getProfileBadgeColor(user.profile)}`}
                                            >
                                                <option value="admin">admin</option>
                                                <option value="tecnico">tecnico</option>
                                                <option value="gerente">gerente</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-medium ${getStatusColor(user.status)}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                            {user.createdAt}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                                <span className="material-icons-round">more_horiz</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Profiles Tab */}
            {activeTab === 'profiles' && (
                <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-icons-round text-primary">shield</span>
                                Perfis de Acesso
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Gerencie perfis e suas permissões de acesso
                            </p>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors">
                            <span className="material-icons-round text-lg">add</span>
                            Novo Perfil
                        </button>
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {profiles.map((profile) => (
                            <div key={profile.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                        <span className="material-icons-round text-primary">shield</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                                {profile.name}
                                            </h3>
                                            {profile.isSystem && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs rounded-full">
                                                    <span className="material-icons-round text-xs">lock</span>
                                                    Sistema
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                            {profile.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        {profile.permissionsCount} permissões
                                    </span>
                                    <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                                        <span className="material-icons-round">edit</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
