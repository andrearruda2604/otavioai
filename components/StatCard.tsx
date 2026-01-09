import React from 'react';

interface StatCardProps {
    title: string;
    value: string;
    trend?: string;
    detail?: string;
    icon: string;
    color: string;
    progress?: number;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, trend, detail, icon, color, progress }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</span>
                <div className={`w-10 h-10 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 text-${color}-500 flex items-center justify-center`}>
                    <span className="material-icons-round">{icon}</span>
                </div>
            </div>
            <div className="flex items-end gap-3">
                <span className="text-4xl font-bold dark:text-white">{value}</span>
                {trend && <span className="text-xs font-medium text-emerald-500 mb-1 flex items-center"><span className="material-icons-round text-sm">arrow_upward</span> {trend}</span>}
                {detail && <span className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">{detail}</span>}
            </div>
            {progress !== undefined && (
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2">
                    <div className={`bg-${color}-500 h-1.5 rounded-full`} style={{ width: `${progress}%` }}></div>
                </div>
            )}
        </div>
    );
};