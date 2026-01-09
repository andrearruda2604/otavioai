import React, { useState, useEffect } from 'react';
import { MenuPermissions, menuItems, defaultPermissions } from '../types/authTypes';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, description: string, permissions: MenuPermissions) => Promise<boolean>;
    editData?: {
        id: string;
        name: string;
        description: string;
        permissions: MenuPermissions;
    } | null;
}

export default function ProfileModal({ isOpen, onClose, onSave, editData }: ProfileModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [permissions, setPermissions] = useState<MenuPermissions>(defaultPermissions);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (editData) {
            setName(editData.name);
            setDescription(editData.description);
            setPermissions(editData.permissions);
        } else {
            setName('');
            setDescription('');
            setPermissions(defaultPermissions);
        }
    }, [editData, isOpen]);

    const handlePermissionChange = (key: keyof MenuPermissions) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const success = await onSave(name, description, permissions);
            if (success) {
                onClose();
            } else {
                setError('Erro ao salvar perfil.');
            }
        } catch (err) {
            setError('Erro ao salvar perfil.');
        } finally {
            setLoading(false);
        }
    };

    const getPermissionCount = () => Object.values(permissions).filter(Boolean).length;

    // Agrupar itens por categoria
    const categories = menuItems.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, typeof menuItems[number][]>);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-card-dark rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {editData ? `Editar Perfil: ${editData.name}` : 'Novo Perfil'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Nome do Perfil
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-white"
                                placeholder="Ex: supervisor"
                                required
                                disabled={editData?.name === 'admin' || editData?.name === 'tecnico' || editData?.name === 'gerente'}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Descrição
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 dark:text-white"
                                placeholder="Descrição do perfil"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                Permissões de Acesso ({getPermissionCount()} selecionadas)
                            </label>

                            {Object.entries(categories).map(([category, items]) => (
                                <div key={category} className="mb-4">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">
                                        {category}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {items.map((item) => (
                                            <label
                                                key={item.key}
                                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={permissions[item.key as keyof MenuPermissions]}
                                                    onChange={() => handlePermissionChange(item.key as keyof MenuPermissions)}
                                                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary"
                                                />
                                                <span className="material-icons-round text-sm text-slate-500">{item.icon}</span>
                                                <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
