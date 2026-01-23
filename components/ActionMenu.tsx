import React, { useState, useRef, useEffect } from 'react';

interface ActionMenuProps {
    onResetPassword?: () => void;
    onDeactivate?: () => void;
    onActivate?: () => void;
    onDelete?: () => void;
    onRestore?: () => void;
    onApprove?: () => void;
    isDeleted?: boolean;
    isPending?: boolean;
    isActive?: boolean;
    onEdit?: () => void;
    editLabel?: string;
    deleteLabel?: string;
    approveLabel?: string;
    restoreLabel?: string;
    deactivateLabel?: string;
    activateLabel?: string;
    resetPasswordLabel?: string;
}

export default function ActionMenu({
    onResetPassword,
    onDeactivate,
    onActivate,
    onDelete,
    onRestore,
    onApprove,
    isDeleted,
    isPending,

    isActive,
    onEdit,
    editLabel = 'Editar',
    deleteLabel = 'Excluir Usuário',
    approveLabel = 'Aprovar Acesso',
    restoreLabel = 'Restaurar Usuário',
    deactivateLabel = 'Desativar Acesso',
    activateLabel = 'Ativar Acesso',
    resetPasswordLabel = 'Redefinir Senha'
}: ActionMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
                <span className="material-icons-round">more_horiz</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50">
                    {isDeleted ? (
                        <button
                            onClick={() => { onRestore?.(); setIsOpen(false); }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            <span className="material-icons-round text-lg">restore</span>
                            {restoreLabel}
                        </button>
                    ) : (
                        <>
                            {onEdit && (
                                <button
                                    onClick={() => { onEdit(); setIsOpen(false); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                    <span className="material-icons-round text-lg">edit</span>
                                    {editLabel}
                                </button>
                            )}

                            {isPending && onApprove && (
                                <button
                                    onClick={() => { onApprove(); setIsOpen(false); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                    <span className="material-icons-round text-lg">check_circle</span>
                                    {approveLabel}
                                </button>
                            )}

                            {onResetPassword && (
                                <button
                                    onClick={() => { onResetPassword(); setIsOpen(false); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                    <span className="material-icons-round text-lg">key</span>
                                    {resetPasswordLabel}
                                </button>
                            )}

                            {isActive && onDeactivate && (
                                <button
                                    onClick={() => { onDeactivate(); setIsOpen(false); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                    <span className="material-icons-round text-lg">block</span>
                                    {deactivateLabel}
                                </button>
                            )}

                            {!isActive && !isPending && onActivate && (
                                <button
                                    onClick={() => { onActivate(); setIsOpen(false); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                    <span className="material-icons-round text-lg">check_circle</span>
                                    {activateLabel}
                                </button>
                            )}

                            {onDelete && (
                                <button
                                    onClick={() => { onDelete(); setIsOpen(false); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                    <span className="material-icons-round text-lg">delete</span>
                                    {deleteLabel}
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
