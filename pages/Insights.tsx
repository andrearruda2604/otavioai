import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface MetricItem {
    id: string;
    label: string;
    value: number | string;
    trend?: string;
    isUp?: boolean;
}

const MetricCard: React.FC<{ title: string; items: MetricItem[]; color: string; icon: string }> = ({ title, items, color, icon }) => (
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
    const [activeTab, setActiveTab] = useState<'missed' | 'success'>('success');
    const [loading, setLoading] = useState(true);

    // Metrics State
    const [topProducts, setTopProducts] = useState<MetricItem[]>([]);
    const [topVehicles, setTopVehicles] = useState<MetricItem[]>([]);
    const [topBrands, setTopBrands] = useState<MetricItem[]>([]);
    const [missedSales, setMissedSales] = useState<any[]>([]);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);

            // 1. Fetch Request Products for "Top" metrics
            const { data: productsData, error: prodError } = await supabase
                .from('requests_products')
                .select('prod_title, car_model, car_brand')
                .limit(1000); // Analyze sample of last 1000 items

            if (prodError) throw prodError;

            if (productsData) {
                // Aggregation Helpers
                const aggregate = (key: keyof typeof productsData[0]) => {
                    const counts: Record<string, number> = {};
                    productsData.forEach(p => {
                        const val = p[key];
                        if (val) counts[String(val)] = (counts[String(val)] || 0) + 1;
                    });
                    return Object.entries(counts)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 4)
                        .map(([label, count], i) => ({
                            id: i.toString(),
                            label,
                            value: `${count} und`
                        }));
                };

                setTopProducts(aggregate('prod_title'));
                setTopVehicles(aggregate('car_model'));
                setTopBrands(aggregate('car_brand'));
            }

            // 2. Fetch Missed Sales (Status != Deal) using requests_products
            // This table has the direct 'prod_title' and item-level status
            const { data: productsDataMissed, error: reqError } = await supabase
                .from('requests_products')
                .select('prod_title, created_at, status')
                .or('status.ilike.%cancel%,status.ilike.%not found%,status.ilike.%lost%')
                .order('created_at', { ascending: false })
                .limit(20);

            if (reqError) throw reqError;

            if (productsDataMissed) {
                const mappedMissed = productsDataMissed.map((p: any, i: number) => ({
                    id: i.toString(),
                    product_name: p.prod_title || "Peça não identificada",
                    frequency: 1,
                    related_vehicle: 'N/A',
                    last_requested: new Date(p.created_at).toLocaleDateString()
                }));
                setMissedSales(mappedMissed);
            }

        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="p-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold dark:text-white">Insights & Analytics</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Inteligência de mercado baseada nas interações reais</p>
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

            {loading ? (
                <div className="flex items-center justify-center h-64 text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></div>
                    Carregando Dados...
                </div>
            ) : (
                <>
                    {activeTab === 'missed' ? (
                        <div className="animate-fade-in space-y-6">
                            <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                                    <h3 className="font-semibold text-lg dark:text-white">Oportunidades Perdidas (Status: Cancelado/Não Encontrado)</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Peça</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Data</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                            {missedSales.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-4 text-center text-slate-500">Nenhum dado encontrado</td>
                                                </tr>
                                            ) : (
                                                missedSales.map((sale) => (
                                                    <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{sale.product_name}</td>
                                                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{sale.last_requested}</td>
                                                        <td className="px-6 py-4 text-sm text-right">
                                                            <button className="text-blue-600 dark:text-blue-400 font-medium text-sm hover:underline">Ver no Kanban</button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <MetricCard
                                title="Produtos Mais Solicitados"
                                items={topProducts.length ? topProducts : [{ id: '0', label: 'Sem dados', value: '0' }]}
                                color="emerald"
                                icon="shopping_bag"
                            />
                            <MetricCard
                                title="Veículos Populares"
                                items={topVehicles.length ? topVehicles : [{ id: '0', label: 'Sem dados', value: '0' }]}
                                color="indigo"
                                icon="directions_car"
                            />
                            <MetricCard
                                title="Top Marcas"
                                items={topBrands.length ? topBrands : [{ id: '0', label: 'Sem dados', value: '0' }]}
                                color="amber"
                                icon="verified"
                            />
                        </div>
                    )}
                </>
            )}
        </main>
    );
}