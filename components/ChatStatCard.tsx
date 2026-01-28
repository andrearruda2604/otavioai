import React from 'react';

interface ChatStatCardProps {
    title: string;
    value: string;
    icon: string;
    color: string;
}

export const ChatStatCard: React.FC<ChatStatCardProps> = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-card-dark p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 min-w-[200px]">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{value}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 text-${color}-500 flex items-center justify-center`}>
                <span className="material-icons-round">{icon}</span>
            </div>
        </div>
    </div>
);
