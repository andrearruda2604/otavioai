import React from 'react';

interface StatusBadgeProps {
    status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const s = (status || '').toLowerCase();
    let color = 'slate';
    let label = 'Desconhecido';

    if (s.includes('deal') || s.includes('won') || s.includes('closed')) {
        color = 'emerald';
        label = 'Deal';
    } else if (s.includes('cancel') || s.includes('lost')) {
        color = 'rose';
        label = 'Cancelado';
    } else if (s.includes('not found') || s.includes('não encontrado')) {
        color = 'amber';
        label = 'Não Encontrado';
    } else if (s.includes('feedback') || s.includes('quota') || s.includes('wait')) {
        color = 'sky';
        label = 'Aguardando';
    }

    return (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded bg-${color}-100 text-${color}-600 dark:bg-${color}-900/30 dark:text-${color}-400`}>
            {label}
        </span>
    );
};
