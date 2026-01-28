import React from 'react';

interface CategoryBarProps {
    label: string;
    percent: number;
    color: string;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({ label, percent, color }) => (
    <div>
        <div className="flex justify-between mb-2">
            <span className="text-sm font-medium dark:text-slate-300">{label}</span>
            <span className="text-sm font-bold dark:text-slate-200">{percent}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div className={`${color} h-full`} style={{ width: `${percent}%` }}></div>
        </div>
    </div>
);
