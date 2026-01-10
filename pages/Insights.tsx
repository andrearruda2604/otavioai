import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { StatItem } from '../types';

interface LostSale {
    id: string;
    product_name: string;
    frequency: number;
    related_vehicle: string;
    last_requested: string;
}

export default function InsightsPage() {
    const [loading, setLoading] = useState(true);
    const [lostSales, setLostSales] = useState<LostSale[]>([]);

    useEffect(() => {
        fetchLostSales();
    }, []);

    const fetchLostSales = async () => {
        try {
            // Fetch messages that might indicate missed sales
            // In a real scenario, this would likely be a more complex query or edge function
            const { data: messages, error } = await supabase
                .from('messages')
                .select('*')
                .eq('role', 'assistant')
                .or('content.ilike.%não encontrei%,content.ilike.%não temos%,content.ilike.%indisponível%,content.ilike.%fora de estoque%')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;

            // Simple processing to aggregate "products"
            // This is a simulation. In production, we'd extract entities using NLP or store them separately.
            const aggregated: Record<string, { count: number, vehicle: string, date: string }> = {};

            // MOCK for demonstration since we might not have real data yet
            const mockData: LostSale[] = [
                { id: '1', product_name: 'Parachoque HB20 2023', frequency: 15, related_vehicle: 'Hyundai HB20', last_requested: 'Hoje' },
                { id: '2', product_name: 'Retrovisor Onix Lado Direito', frequency: 12, related_vehicle: 'Chevrolet Onix', last_requested: 'Ontem' },
                { id: '3', product_name: 'Farol Milha Renegade', frequency: 8, related_vehicle: 'Jeep Renegade', last_requested: '3 dias atrás' },
                { id: '4', product_name: 'Lanterna Traseira Polo', frequency: 6, related_vehicle: 'VW Polo', last_requested: '5 dias atrás' },
                { id: '5', product_name: 'Jogo Tapete Corolla', frequency: 4, related_vehicle: 'Toyota Corolla', last_requested: '1 semana atrás' },
            ];

            setLostSales(mockData);
        } catch (error) {
            console.error('Error fetching insights:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="p-8">
            <header className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold dark:text-white">Demanda Não Atendida</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Produtos mais procurados que não foram vendidos</p>
                </div>
                <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl shadow-inner">
                    <button className="px-4 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white">7 dias</button>
                    <button className="px-4 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Mês</button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-2">
                    <h3 className="font-semibold text-lg mb-6 dark:text-white">Top Produtos Perdidos</h3>
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
                    <h3 className="text-xl font-bold mb-2">Oportunidade de Receita</h3>
                    <p className="text-blue-100 text-sm mb-6">Estimativa baseada em vendas perdidas</p>

                    <div className="text-4xl font-bold mb-4">R$ 4.250,00</div>

                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-icons-round text-amber-300">lightbulb</span>
                            <span className="font-medium text-sm">Sugestão de Estoque</span>
                        </div>
                        <p className="text-xs text-blue-50 leading-relaxed">
                            Adicionar <strong>Parachoque HB20</strong> ao estoque pode aumentar seu faturamento em até 15% este mês.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-semibold text-lg dark:text-white">Detalhamento das Buscas</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Peça Procurada</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Veículo Relacionado</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Frequência</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Última Busca</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {lostSales.map((sale) => (
                                <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{sale.product_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <span className="material-icons-round text-slate-400 text-xs">directions_car</span>
                                            {sale.related_vehicle}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                            {sale.frequency} vezes
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{sale.last_requested}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 font-medium text-sm">
                                            Buscar Fornecedor
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}