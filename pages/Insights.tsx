import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface LostSale {
    id: string;
    product_name: string;
    frequency: number;
    related_vehicle: string;
    last_requested: string;
}

interface TopMetric {
    id: string;
    label: string;
    value: number | string;
    trend?: string;
    isUp?: boolean;
}

const MetricCard: React.FC<{ title: string; items: TopMetric[]; color: string; icon: string }> = ({ title, items, color, icon }) => (
    <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-600 dark:text-${color}-400`}>
                <span className="material-icons-round">{icon}</span>
            </div>
            <h3 className="font-semibold text-lg dark:text-white">{title}</h3>
        </div>
        <div className="space-y-4">
            {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 group">
                    <span className="font-bold text-slate-400 w-4">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1">
                            <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{item.label}</span>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.value}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                            <div
                                className={`bg-${color}-500 rounded-full h-1.5 transition-all duration-500`}
                                style={{ width: `${Math.max(10, 100 - (idx * 20))}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default function InsightsPage() {
    const [activeTab, setActiveTab] = useState<'missed' | 'success'>('missed');
    const [lostSales, setLostSales] = useState<LostSale[]>([]);
    // Mock data for success metrics
    const [topProducts] = useState<TopMetric[]>([
        { id: '1', label: 'Óleo 5W30 Sintético', value: '428 und' },
        { id: '2', label: 'Filtro de Óleo WOE-710', value: '315 und' },
        { id: '3', label: 'Pastilha de Freio Gol G5', value: '210 kits' },
        { id: '4', label: 'Lâmpada H7 Super Branca', value: '185 und' },
    ]);
    const [topVehicles] = useState<TopMetric[]>([
        { id: '1', label: 'Fiat Strada', value: '1,240 buscas' },
        { id: '2', label: 'VW Gol', value: '985 buscas' },
        { id: '3', label: 'Toyota Corolla', value: '850 buscas' },
        { id: '4', label: 'Chevrolet Onix', value: '720 buscas' },
    ]);
    const [topBrands] = useState<TopMetric[]>([
        { id: '1', label: 'Fiat', value: '28%' },
        { id: '2', label: 'Volkswagen', value: '22%' },
        { id: '3', label: 'Chevrolet', value: '18%' },
        { id: '4', label: 'Toyota', value: '15%' },
    ]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        // Fetch Lost Sales logic (Mocked + Real query hint)
        try {
            const { data: messages } = await supabase
                .from('messages')
                .select('*')
                .eq('role', 'assistant')
                .or('content.ilike.%não encontrei%,content.ilike.%não temos%')
                .order('created_at', { ascending: false })
                .limit(50);

            // Mocking the result of parsing these messages
            const mockLost: LostSale[] = [
                { id: '1', product_name: 'Parachoque HB20 2023', frequency: 15, related_vehicle: 'Hyundai HB20', last_requested: 'Hoje' },
                { id: '2', product_name: 'Retrovisor Onix Lado Direito', frequency: 12, related_vehicle: 'Chevrolet Onix', last_requested: 'Ontem' },
                { id: '3', product_name: 'Farol Milha Renegade', frequency: 8, related_vehicle: 'Jeep Renegade', last_requested: '3 dias atrás' },
                { id: '4', product_name: 'Lanterna Traseira Polo', frequency: 6, related_vehicle: 'VW Polo', last_requested: '5 dias atrás' },
                { id: '5', product_name: 'Jogo Tapete Corolla', frequency: 4, related_vehicle: 'Toyota Corolla', last_requested: '1 semana atrás' },
            ];
            setLostSales(mockLost);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <main className="p-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold dark:text-white">Insights & Analytics</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Inteligência de mercado baseada nas interações da IA</p>
                </div>

                <div className="flex bg-white dark:bg-card-dark p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setActiveTab('success')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'success'
                            ? 'bg-emerald-500 text-white shadow-md'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                    >
                        Performance e Sucesso
                    </button>
                    <button
                        onClick={() => setActiveTab('missed')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'missed'
                            ? 'bg-primary text-white shadow-md'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                    >
                        Demanda Não Atendida
                    </button>
                </div>
            </header>

            {activeTab === 'missed' ? (
                <div className="animate-fade-in space-y-6">
                    {/* LOST SALES SECTION (Existing) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-2">
                            <h3 className="font-semibold text-lg mb-6 dark:text-white">Top Oportunidades Perdidas</h3>
                            <div className="space-y-4">
                                {lostSales.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 group">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-medium text-slate-700 dark:text-slate-200">{item.product_name}</span>
                                                <span className="text-sm text-slate-500">{item.frequency} buscas</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                                <div
                                                    className="bg-blue-500 rounded-full h-2 transition-all duration-500 group-hover:bg-blue-400"
                                                    style={{ width: `${(item.frequency / 20) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
                            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                            <h3 className="text-xl font-bold mb-2">Potencial de Receita</h3>
                            <p className="text-blue-100 text-sm mb-6">Estimativa mensal baseada em vendas perdidas</p>
                            <div className="text-4xl font-bold mb-4">R$ 4.250,00</div>
                            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                                <p className="text-xs text-blue-50 leading-relaxed">
                                    Adicionar <strong>Parachoque HB20</strong> ao estoque pode aumentar seu faturamento em até 15%.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="font-semibold text-lg dark:text-white">Detalhamento das Buscas Sem Estoque</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Peça</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Veículo</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Frequência</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Última Busca</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {lostSales.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{sale.product_name}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{sale.related_vehicle}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs">
                                                    {sale.frequency}x
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{sale.last_requested}</td>
                                            <td className="px-6 py-4 text-sm text-right">
                                                <button className="text-blue-600 dark:text-blue-400 font-medium text-sm hover:underline">Buscar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* SUCCESS METRICS SECTION */}
                    <MetricCard
                        title="Produtos Mais Vendidos"
                        items={topProducts}
                        color="emerald"
                        icon="shopping_bag"
                    />
                    <MetricCard
                        title="Veículos Mais Pesquisados"
                        items={topVehicles}
                        color="indigo"
                        icon="directions_car"
                    />
                    <MetricCard
                        title="Top Marcas"
                        items={topBrands}
                        color="amber"
                        icon="verified"
                    />

                    <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm md:col-span-2 lg:col-span-3">
                        <h3 className="font-semibold text-lg mb-6 dark:text-white">Anos Mais Procurados (Heatmap)</h3>
                        <div className="flex items-end justify-between gap-2 h-48">
                            {[2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024].map((year, i) => {
                                const heights = [30, 45, 55, 70, 85, 60, 90, 75, 50, 40];
                                return (
                                    <div key={year} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                                        <div className="w-full relative h-full flex items-end">
                                            <div
                                                className="w-full bg-indigo-50 dark:bg-indigo-900/20 rounded-t-lg transition-all duration-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40"
                                                style={{ height: '100%' }}
                                            >
                                                <div
                                                    className="absolute bottom-0 w-full bg-indigo-500 rounded-t-lg transition-all duration-700"
                                                    style={{ height: `${heights[i]}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <span className={`text-xs text-slate-500 dark:text-slate-400 ${year >= 2020 ? 'font-bold text-indigo-600 dark:text-indigo-400' : ''}`}>
                                            {year}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}