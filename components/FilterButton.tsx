import React from 'react';

interface FilterButtonProps {
    active: boolean;
    onClick: () => void;
    label: string;
}

export const FilterButton: React.FC<FilterButtonProps> = ({ active, onClick, label }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${active
            ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
    >
        {label}
    </button>
);
