import React from 'react';

interface InteractionItemProps {
    initials: string;
    name: string;
    action: string;
    item: string;
    time: string;
    company: string;
    status: string;
    statusColor?: string;
    onClick?: () => void;
}

export const InteractionItem: React.FC<InteractionItemProps> = ({
    initials, name, action, item, time, company, status, statusColor = 'emerald', onClick
}) => {
    return (
        <div
            onClick={onClick}
            className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-all cursor-pointer"
        >
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400">{initials}</div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold dark:text-slate-200 truncate">{name} <span className="text-slate-400 font-normal">{action}</span> {item}</p>
                <p className="text-xs text-slate-500">{time} • {company}</p>
            </div>
            <span className={`text-xs font-bold text-${statusColor}-500 bg-${statusColor}-50 dark:bg-${statusColor}-900/20 px-2 py-1 rounded shrink-0`}>{status}</span>
        </div>
    );
};