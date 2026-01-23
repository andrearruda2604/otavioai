import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { supabase } from '../lib/supabase';

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
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState({
        requests: 0,
        requestsGrowth: 0,
        products: 0,
        productsGrowth: 0,
        foundCount: 0,
        foundRate: 0,
        dealsCount: 0,
        conversionRate: 0
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [interactions, setInteractions] = useState<any[]>([]);
    const [brandStats, setBrandStats] = useState<any[]>([]);
    const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days' | 'currentMonth' | 'total'>('30days');

    useEffect(() => {
        fetchDashboardData();

        // Realtime updates
        const channel = supabase
            .channel('public:requests')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => {
                fetchDashboardData();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [timeRange]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Calculate date range based on timeRange
            const now = new Date();
            let startDate: Date | null = new Date();

            switch (timeRange) {
                case 'today':
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case '7days':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case '30days':
                    startDate.setDate(now.getDate() - 30);
                    break;
                case 'currentMonth':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'total':
                    startDate = null; // No filter for total
                    break;
            }

            // 1. Fetch Requests & Calc KPIs
            // Get data for chart and KPIs filtered by date range
            let query = supabase
                .from('requests')
                .select(`
                    created_at,
                    status,
                    total_price,
                    ordered_prods,
                    client_id,
                    clients (name_first, name_last, whatsapp, company_name)
                `);

            // Apply date filter only if startDate is not null (i.e., not 'total')
            if (startDate !== null) {
                query = query.gte('created_at', startDate.toISOString());
            }

            const { data: requests, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            if (requests) {
                const total = requests.length;
                const found = requests.filter(r => r.status && !r.status.toLowerCase().includes('not found') && !r.status.toLowerCase().includes('cancel')).length;
                const deals = requests.filter(r => r.status && (r.status.toLowerCase().includes('deal') || r.status.toLowerCase().includes('won'))).length;

                // Calculate Products (rough estimate from ordered_prods length if available, or just request count)
                // If ordered_prods is JSON array
                const totalProducts = requests.reduce((acc, r) => {
                    const prods = r.ordered_prods;
                    return acc + (Array.isArray(prods) ? prods.length : 1);
                }, 0);

                setKpis({
                    requests: total,
                    requestsGrowth: 0, // Need historic data for this
                    products: totalProducts,
                    productsGrowth: 0,
                    foundCount: found,
                    foundRate: total > 0 ? Math.round((found / total) * 100) : 0,
                    dealsCount: deals,
                    conversionRate: found > 0 ? Math.round((deals / found) * 100) : 0
                });

                // 2. Chart Data (Group by Day - Dynamic based on timeRange)
                const daysMap = new Map();
                const now = new Date();

                // Determine number of days to show based on timeRange
                let daysToShow = 14;
                if (timeRange === 'today') daysToShow = 1;
                else if (timeRange === '7days') daysToShow = 7;
                else if (timeRange === '30days') daysToShow = 30;
                else if (timeRange === 'currentMonth') daysToShow = now.getDate();
                else if (timeRange === 'total') daysToShow = 30; // Show last 30 days for total view

                // Initialize days with 0
                for (let i = daysToShow - 1; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(now.getDate() - i);
                    const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    daysMap.set(key, { name: key, solicitacoes: 0, deals: 0 });
                }

                requests.forEach(r => {
                    const d = new Date(r.created_at);
                    const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    // Only count if within last 14 days (map has these keys)
                    if (daysMap.has(key)) {
                        const entry = daysMap.get(key);
                        entry.solicitacoes += 1;
                        if (r.status?.toLowerCase().includes('deal')) entry.deals += 1;
                    }
                });

                setChartData(Array.from(daysMap.values()));

                // 3. Recent Interactions
                const recent = requests.slice(0, 5).map(r => ({
                    initials: r.clients?.name_first?.substring(0, 2).toUpperCase() || 'CL',
                    name: `${r.clients?.name_first || 'Cliente'} ${r.clients?.name_last || ''}`,
                    action: r.status?.toLowerCase().includes('deal') ? 'fechou pedido' : 'solicitou',
                    item: Array.isArray(r.ordered_prods) && r.ordered_prods[0]?.prod_title
                        ? r.ordered_prods[0].prod_title
                        : (Array.isArray(r.ordered_prods) ? `${r.ordered_prods.length} itens` : 'Cotação'),
                    time: new Date(r.created_at).toLocaleString('pt-BR', { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
                    company: r.clients?.company_name || 'Particular',
                    status: r.status || 'Pendente',
                    statusColor: r.status?.toLowerCase().includes('deal') ? 'green' : (r.status?.toLowerCase().includes('cancel') ? 'red' : 'orange'),
                    clientId: r.client_id
                }));
                setInteractions(recent);
            }

            // 4. Fetch Brand Performance (from requests_products)
            const { data: products } = await supabase
                .from('requests_products')
                .select('car_brand')
                .limit(500);

            if (products && products.length > 0) {
                const brandCounts: Record<string, number> = {};
                products.forEach(p => {
                    const brand = p.car_brand || 'Outros';
                    brandCounts[brand] = (brandCounts[brand] || 0) + 1;
                });

                const total = products.length;
                const topBrands = Object.entries(brandCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 4)
                    .map(([label, count]) => ({
                        label,
                        percent: Math.round((count / total) * 100),
                        color: ['bg-primary', 'bg-blue-500', 'bg-orange-500', 'bg-purple-500'][Math.floor(Math.random() * 4)]
                    }));

                setBrandStats(topBrands);
            } else {
                setBrandStats([]);
            }

        } catch (error) {
            console.error('Error fetching dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 lg:p-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-1 dark:text-white">Dashboard</h2>
                    <p className="text-slate-500 dark:text-slate-400">Visão geral em tempo real.</p>
                </div>
                <div className="flex flex-wrap items-center bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm gap-1">
                    <button
                        onClick={() => setTimeRange('today')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === 'today'
                            ? 'bg-primary text-white shadow-md'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                    >
                        Hoje
                    </button>
                    <button
                        onClick={() => setTimeRange('7days')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === '7days'
                            ? 'bg-primary text-white shadow-md'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                    >
                        7 dias
                    </button>
                    <button
                        onClick={() => setTimeRange('30days')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === '30days'
                            ? 'bg-primary text-white shadow-md'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                    >
                        30 dias
                    </button>
                    <button
                        onClick={() => setTimeRange('currentMonth')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === 'currentMonth'
                            ? 'bg-primary text-white shadow-md'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                    >
                        Mês atual
                    </button>
                    <button
                        onClick={() => setTimeRange('total')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === 'total'
                            ? 'bg-primary text-white shadow-md'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                    >
                        Total
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard title="Solicitações" value={kpis.requests.toString()} trend="Total" icon="description" color="blue" />
                        <StatCard title="Produtos" value={kpis.products.toString()} trend="Identificados" icon="settings_suggest" color="purple" />
                        <StatCard title="Encontrados" value={kpis.foundCount.toString()} detail={`${kpis.foundRate}% rate`} icon="check_circle" color="emerald" progress={kpis.foundRate} />
                        <StatCard title="Deals" value={kpis.dealsCount.toString()} detail={`${kpis.conversionRate}% conv.`} icon="trending_up" color="orange" progress={kpis.conversionRate} />
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-8">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-xl font-bold dark:text-white">Tendência de Solicitações</h3>
                                <p className="text-sm text-slate-500">Solicitações vs Fechamentos (Últimos 14 dias)</p>
                            </div>
                        </div>
                        <div className="h-[400px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                    <Line type="monotone" dataKey="solicitacoes" name="Solicitações" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b' }} />
                                    <Line type="monotone" dataKey="deals" name="Fechamentos" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h3 className="text-lg font-bold mb-6 dark:text-white">Últimas Interações</h3>
                            <div className="space-y-4">
                                {interactions.map((item, i) => (
                                    <InteractionItem
                                        key={i}
                                        {...item}
                                        onClick={() => navigate(`/chat?chatId=${item.clientId}`)}
                                    />
                                ))}
                                {interactions.length === 0 && <p className="text-slate-500">Nenhuma interação recente.</p>}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                            <h3 className="text-lg font-bold mb-6 dark:text-white">Top Marcas Solicitadas</h3>
                            <div className="space-y-6">
                                {brandStats.map((stat, i) => (
                                    <CategoryBar key={i} label={stat.label} percent={stat.percent} color={stat.color} />
                                ))}
                                {brandStats.length === 0 && <p className="text-slate-500">Sem dados de marcas ainda.</p>}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}