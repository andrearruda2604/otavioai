import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { InteractionItem } from '../components/InteractionItem';
import { ChartData } from '../types';

const data: ChartData[] = [
    { name: '01/01', solicitacoes: 1, produtos: 4 },
    { name: '02/01', solicitacoes: 0.5, produtos: 0.5 },
    { name: '03/01', solicitacoes: 2, produtos: 7 },
    { name: '04/01', solicitacoes: 2, produtos: 4 },
    { name: '05/01', solicitacoes: 3, produtos: 6 },
    { name: '06/01', solicitacoes: 2, produtos: 4 },
    { name: '07/01', solicitacoes: 3, produtos: 5 },
    { name: '08/01', solicitacoes: 1, produtos: 3 },
    { name: '09/01', solicitacoes: 1, produtos: 4 },
];

const CategoryBar: React.FC<{ label: string; percent: number; color: string }> = ({ label, percent, color }) => (
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

export default function DashboardPage() {
    return (
        <div className="p-6 lg:p-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-1 dark:text-white">Dashboard</h2>
                    <p className="text-slate-500 dark:text-slate-400">Acompanhe o desempenho do agente vendedor em tempo real.</p>
                </div>
                <div className="flex items-center bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <button className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">Hoje</button>
                    <button className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">7 dias</button>
                    <button className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg shadow-md shadow-primary/20">Mês atual</button>
                    <button className="px-4 py-2 text-sm border-l border-slate-100 dark:border-slate-700 ml-1 text-slate-500 dark:text-slate-400">
                        <span className="material-icons-round text-base align-middle">calendar_today</span>
                    </button>
                </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Solicitações" value="15" trend="+12%" icon="description" color="blue" />
                <StatCard title="Produtos" value="37" trend="+8%" icon="settings_suggest" color="purple" />
                <StatCard title="Encontrados" value="22" detail="59% do total" icon="check_circle" color="emerald" progress={59} />
                <StatCard title="Deals" value="13" detail="87% conversão" icon="trending_up" color="orange" progress={87} />
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-8">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h3 className="text-xl font-bold dark:text-white">Solicitações e Produtos por Dia</h3>
                        <p className="text-sm text-slate-500">Distribuição temporal de interações e peças identificadas.</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-slate-800 dark:bg-slate-400"></span>
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Solicitações</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-primary"></span>
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Produtos</span>
                        </div>
                    </div>
                </div>
                <div className="h-[400px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#1e293b', 
                                    border: 'none', 
                                    borderRadius: '8px', 
                                    color: '#fff',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="solicitacoes" 
                                stroke="#1e293b" 
                                strokeWidth={3} 
                                dot={{ fill: '#1e293b', stroke: '#fff', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6 }}
                                className="dark:stroke-slate-400 dark:fill-slate-400"
                            />
                            <Line 
                                type="monotone" 
                                dataKey="produtos" 
                                stroke="#135bec" 
                                strokeWidth={3} 
                                dot={{ fill: '#135bec', stroke: '#fff', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 dark:text-white">Últimas Interações</h3>
                    <div className="space-y-4">
                        <InteractionItem initials="AS" name="Ana Souza" action="solicitou" item="Lanterna Traseira" time="Hoje às 06:55" company="Auto Peças Central" status="Ativo" />
                        <InteractionItem initials="HS" name="Henrique Silva" action="perguntou sobre" item="Pedido #1014" time="Ontem às 21:55" company="Marinho & Filhos" status="Pendente" statusColor="orange" />
                        <InteractionItem initials="IC" name="Isabela Costa" action="confirmou" item="Radiador Honda" time="Ontem às 17:55" company="Nevada Eco Peças" status="Ativo" />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold mb-6 dark:text-white">Desempenho por Categoria</h3>
                    <div className="space-y-6">
                        <CategoryBar label="Lataria & Acabamento" percent={85} color="bg-primary" />
                        <CategoryBar label="Motor & Câmbio" percent={62} color="bg-blue-500" />
                        <CategoryBar label="Suspensão & Freios" percent={44} color="bg-orange-500" />
                    </div>
                    <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl flex items-center gap-4">
                        <span className="material-icons-round text-primary text-2xl">lightbulb</span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-bold text-slate-700 dark:text-slate-200">Dica:</span> Focar em peças de lataria neste mês aumentou a conversão em <span className="font-bold text-emerald-500">14%</span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}