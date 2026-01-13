import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

// --- Types ---

type DateRangeOption = 'today' | '7days' | '30days' | 'month' | 'total';
type StatusFilter = 'all' | 'found' | 'missed';

interface ChartData {
    name: string;
    value: number;
}

// --- Constants ---

const COLORS = {
    primary: '#10B981', // Emerald 500
    secondary: '#3B82F6', // Blue 500
    tertiary: '#F59E0B', // Amber 500
    dark: '#1E293B', // Slate 800
    purple: '#8B5CF6' // Violet 500
};

// --- Helper Components ---

const FilterButton = ({
    active,
    onClick,
    label
}: {
    active: boolean;
    onClick: () => void;
    label: string;
}) => (
    <button
        onClick={onClick}
        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${active
            ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
    >
        {label}
    </button>
);

const ChartCard = ({
    title,
    children,
    headerAction
}: {
    title: string;
    children: React.ReactNode;
    headerAction?: React.ReactNode;
}) => (
    <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[400px]">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{title}</h3>
            {headerAction}
        </div>
        <div className="flex-1 w-full min-h-0">
            {children}
        </div>
    </div>
);

// --- Main Component ---

export default function InsightsPage() {
    const [dateRange, setDateRange] = useState<DateRangeOption>('7days');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [loading, setLoading] = useState(true);
    const [rawData, setRawData] = useState<any[]>([]);

    // --- Data Fetching ---

    useEffect(() => {
        fetchData();
    }, [dateRange]); // Refetch when date range changes (optimization: could suggest fetching all and filtering client side if data is small, but server filter is safer for scaling)

    const fetchData = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('requests_products')
                .select(`
                    id,
                    created_at,
                    prod_title,
                    car_brand,
                    car_model,
                    car_year,
                    requests!inner (
                        status
                    )
                `);

            // Apply Date Filter
            const now = new Date();
            let startDate = new Date();

            switch (dateRange) {
                case 'today':
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case '7days':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case '30days':
                    startDate.setDate(now.getDate() - 30);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'total':
                    startDate = new Date(0); // Beginning of time
                    break;
            }

            if (dateRange !== 'total') {
                query = query.gte('created_at', startDate.toISOString());
            }

            const { data, error } = await query;

            if (error) throw error;
            setRawData(data || []);

        } catch (error) {
            console.error('Error fetching insights:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Data Processing ---

    const processedData = useMemo(() => {
        // 1. Apply Status Filter Client-Side (since we need joined data status)
        const filtered = rawData.filter(item => {
            const status = item.requests?.status?.toLowerCase() || '';
            const isMissed = status.includes('cancel') || status.includes('not found') || status.includes('não encontrado');
            const isFound = !isMissed;

            if (statusFilter === 'found') return isFound;
            if (statusFilter === 'missed') return isMissed;
            return true; // 'all'
        });

        // 2. Aggregate Data for Charts
        const aggregate = (key: string, limit = 5): ChartData[] => {
            const counts: Record<string, number> = {};
            filtered.forEach(item => {
                const val = item[key];
                if (val) {
                    // Normalize
                    const label = String(val).trim();
                    counts[label] = (counts[label] || 0) + 1;
                }
            });

            return Object.entries(counts)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, limit);
        };

        return {
            products: aggregate('prod_title'),
            brands: aggregate('car_brand'),
            models: aggregate('car_model'),
            years: aggregate('car_year').sort((a, b) => Number(a.name) - Number(b.name)) // Years usually sorted chronologically
        };
    }, [rawData, statusFilter]);

    // --- Render ---

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 text-white text-xs p-2 rounded shadow-lg">
                    <p className="font-semibold">{label}</p>
                    <p>{`Qtd: ${payload[0].value}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <main className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold dark:text-white">Insights</h1>
                    <p className="text-slate-500 dark:text-slate-400">Análise detalhada por marca, modelo e ano</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-card-dark p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="material-icons-round text-slate-400 ml-2 mr-2">calendar_today</span>
                    <FilterButton active={dateRange === 'today'} onClick={() => setDateRange('today')} label="Hoje" />
                    <FilterButton active={dateRange === '7days'} onClick={() => setDateRange('7days')} label="7 dias" />
                    <FilterButton active={dateRange === '30days'} onClick={() => setDateRange('30days')} label="30 dias" />
                    <FilterButton active={dateRange === 'month'} onClick={() => setDateRange('month')} label="Mês atual" />
                    <FilterButton active={dateRange === 'total'} onClick={() => setDateRange('total')} label="Total" />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* 1. Principais Produtos */}
                    <ChartCard
                        title="Principais Produtos"
                        headerAction={
                            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${statusFilter === 'all' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                                >Todos</button>
                                <button
                                    onClick={() => setStatusFilter('found')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${statusFilter === 'found' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                                >Encontrados</button>
                                <button
                                    onClick={() => setStatusFilter('missed')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${statusFilter === 'missed' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                                >Não encontrados</button>
                            </div>
                        }
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={processedData.products} margin={{ left: 40, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                    {processedData.products.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="#1e293b" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* 2. Por Marca */}
                    <ChartCard title="Por Marca">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={processedData.brands} margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={80}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* 3. Por Modelo */}
                    <ChartCard title="Por Modelo">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={processedData.models} margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={80}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" fill={COLORS.secondary} radius={[0, 4, 4, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* 4. Por Ano */}
                    <ChartCard title="Por Ano">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={processedData.years} margin={{ top: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                />
                                <YAxis hide />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" fill={COLORS.tertiary} radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                </div>
            )}
        </main>
    );
}