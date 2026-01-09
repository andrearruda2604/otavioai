import React from 'react';
import { StatItem } from '../types';

const ChartCard: React.FC<{ title: string; items: StatItem[]; thin?: boolean }> = ({ title, items, thin }) => (
    <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="font-semibold text-lg mb-8 dark:text-white">{title}</h3>
        <div className="space-y-4">
            {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                    <span className="w-32 text-xs text-slate-500 dark:text-slate-400 text-right shrink-0">{item.label}</span>
                    <div className={`flex-1 ${thin ? 'h-6' : 'h-8'} bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden`}>
                        <div className={`h-full ${item.color} rounded-lg chart-bar`} style={{ width: item.width }}></div>
                    </div>
                    {!thin && <span className="w-8 text-xs font-semibold dark:text-slate-200">{item.value}</span>}
                </div>
            ))}
        </div>
    </div>
);

const YearChart = () => (
    <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
        <h3 className="font-semibold text-lg mb-8 dark:text-white">Por Ano</h3>
        <div className="flex-1 flex items-end justify-between gap-4 h-56 pt-6">
            {[2018, 2019, 2020, 2021, 2022, 2023, 2024].map((year, i) => {
                const heights = [70, 25, 35, 90, 65, 30, 55];
                return (
                    <div key={year} className="flex-1 flex flex-col items-center gap-3">
                        <div className="w-full bg-amber-500 rounded-t-lg transition-all duration-700" style={{ height: `${heights[i]}%` }}></div>
                        <span className={`text-xs text-slate-500 dark:text-slate-400 ${year === 2021 ? 'font-bold dark:text-slate-200' : ''}`}>{year}</span>
                    </div>
                );
            })}
        </div>
    </div>
);

const SmallStatCard: React.FC<{ label: string; value: string; trend: string; up?: boolean }> = ({ label, value, trend, up }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <p className="text-sm text-slate-500 mb-1">{label}</p>
        <p className="text-3xl font-bold dark:text-white">{value}</p>
        <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${up ? 'text-emerald-500' : 'text-rose-500'}`}>
            <span className="material-icons-round text-sm">{up ? 'trending_up' : 'trending_down'}</span>
            {trend} vs mês ant.
        </div>
    </div>
);

export default function InsightsPage() {
    return (
        <main className="p-8">
            <header className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold dark:text-white">Insights</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Análise detalhada por marca, modelo e ano</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl shadow-inner">
                        <button className="px-4 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">7 dias</button>
                        <button className="px-4 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white">Mês atual</button>
                        <button className="px-4 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Total</button>
                    </div>
                </div>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Principais Produtos" items={[
                    { label: "Lanterna Traseira", value: 12, width: "85%", color: "bg-slate-800 dark:bg-slate-400" },
                    { label: "Farol Direito", value: 10, width: "70%", color: "bg-slate-800 dark:bg-slate-400" },
                    { label: "Motor de Arranque", value: 9, width: "65%", color: "bg-slate-800 dark:bg-slate-400" },
                    { label: "Bomba de Combustível", value: 8, width: "60%", color: "bg-slate-800 dark:bg-slate-400" }
                ]} />
                <ChartCard title="Por Marca" items={[
                    { label: "Fiat", value: 42, width: "92%", color: "bg-primary" },
                    { label: "Toyota", value: 36, width: "80%", color: "bg-primary" },
                    { label: "Chevrolet", value: 33, width: "75%", color: "bg-primary" },
                    { label: "Honda", value: 28, width: "60%", color: "bg-primary" }
                ]} />
                <ChartCard title="Por Modelo" thin items={[
                    { label: "Corolla", value: 95, width: "95%", color: "bg-sky-500" },
                    { label: "Strada", value: 92, width: "92%", color: "bg-sky-500" },
                    { label: "Spin", value: 88, width: "88%", color: "bg-sky-500" },
                    { label: "CR-V", value: 75, width: "75%", color: "bg-sky-500" }
                ]} />
                <YearChart />
            </div>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
                <SmallStatCard label="Total Solicitado" value="1.284" trend="12%" up />
                <SmallStatCard label="Média p/ Dia" value="42.8" trend="5%" up />
                <SmallStatCard label="Conversão Leads" value="18.4%" trend="2%" />
                <SmallStatCard label="Ticket Médio" value="R$ 842" trend="8%" up />
            </div>
        </main>
    );
}