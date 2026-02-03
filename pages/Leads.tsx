import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ClientSession } from '../types/chat';

type SortConfig = {
    key: string;
    direction: 'asc' | 'desc';
};

export default function LeadsPage() {
    const navigate = useNavigate();
    const [leads, setLeads] = useState<ClientSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    // Sorting
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name_first', direction: 'asc' });

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLeads();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter]);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('clients')
                .select(`
                    *,
                    requests (
                        status,
                        created_at
                    )
                `)
                .order('last_message', { ascending: false });

            // Search Filter
            if (searchTerm.trim()) {
                query = query.or(`name_first.ilike.%${searchTerm}%,name_last.ilike.%${searchTerm}%,whatsapp.ilike.%${searchTerm}%`);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data) {
                // Process status same as Chat.tsx
                const processedData = data.map((client: any) => {
                    const sortedRequests = (client.requests || []).sort((a: any, b: any) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    );
                    const latest = sortedRequests[0]?.status || 'Sem Status';
                    return { ...client, latestStatus: latest };
                });

                // Status Filter (Client-side)
                let filteredData = processedData;
                if (statusFilter !== 'all') {
                    filteredData = processedData.filter((c: any) =>
                        (c.latestStatus || '').toLowerCase() === statusFilter.toLowerCase()
                    );
                }

                setLeads(filteredData);
                setCurrentPage(1); // Reset to first page on new search
            }
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedLeads = () => {
        const sorted = [...leads].sort((a: any, b: any) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            if (sortConfig.key === 'name') {
                aValue = (a.name_first + ' ' + a.name_last).toLowerCase();
                bValue = (b.name_first + ' ' + b.name_last).toLowerCase();
            } else if (sortConfig.key === 'status') {
                aValue = (a.latestStatus || '').toLowerCase();
                bValue = (b.latestStatus || '').toLowerCase();
            } else if (sortConfig.key === 'whatsapp') {
                aValue = (a.whatsapp || '').toLowerCase();
                bValue = (b.whatsapp || '').toLowerCase();
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    };

    const getPaginatedLeads = () => {
        const sorted = getSortedLeads();
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sorted.slice(startIndex, startIndex + itemsPerPage);
    };

    const totalPages = Math.ceil(leads.length / itemsPerPage);

    const getStatusColor = (status?: string) => {
        const s = (status || '').toLowerCase();
        if (s.includes('active') || s.includes('ativo')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
        if (s.includes('deal') || s.includes('won')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        if (s.includes('cancel') || s.includes('lost') || s.includes('inativo')) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
        if (s.includes('open') || s.includes('new') || s.includes('em contato')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
    };

    const handleChatClick = (whatsapp: string) => {
        navigate(`/chat?chatId=${whatsapp}`);
    };

    return (
        <main className="p-8">
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Leads</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie sua base de clientes e prospecções</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 mb-6">
                <div className="flex gap-4 w-full max-w-2xl">
                    <div className="relative flex-1">
                        <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            className="w-full pl-10 pr-4 py-2.5 bg-background-light dark:bg-background-dark border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:text-white"
                            placeholder="Buscar por nome..."
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-48 px-3 py-2.5 bg-background-light dark:bg-background-dark border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:text-white cursor-pointer"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="open">Open</option>
                        <option value="deal">Deal</option>
                        <option value="canceled">Canceled</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                <th
                                    className="px-6 py-4 cursor-pointer hover:text-primary transition-colors select-none"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-1">
                                        Nome
                                        {sortConfig.key === 'name' && (
                                            <span className="material-icons-round text-sm">
                                                {sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 cursor-pointer hover:text-primary transition-colors select-none"
                                    onClick={() => handleSort('whatsapp')}
                                >
                                    <div className="flex items-center gap-1">
                                        WhatsApp
                                        {sortConfig.key === 'whatsapp' && (
                                            <span className="material-icons-round text-sm">
                                                {sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 cursor-pointer hover:text-primary transition-colors select-none"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center gap-1">
                                        Status
                                        {sortConfig.key === 'status' && (
                                            <span className="material-icons-round text-sm">
                                                {sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-4 w-10 text-center">Chats</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                                        Carregando leads...
                                    </td>
                                </tr>
                            ) : leads.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                                        Nenhum lead encontrado.
                                    </td>
                                </tr>
                            ) : (
                                getPaginatedLeads().map((lead, i) => (
                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-semibold dark:text-slate-200">
                                            {lead.name_first} {lead.name_last}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                <span className="text-sm font-mono">{lead.whatsapp}</span>
                                                <span
                                                    className="material-icons-round text-sm text-slate-400 cursor-pointer hover:text-primary"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(lead.whatsapp);
                                                    }}
                                                    title="Copiar whatsapp"
                                                >
                                                    content_copy
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase 
                                                ${getStatusColor(lead.latestStatus)}`}>
                                                {lead.latestStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleChatClick(lead.whatsapp)}
                                                className="text-slate-400 hover:text-primary transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                                title="Ir para conversa"
                                            >
                                                <span className="material-icons-round">chat</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {!loading && leads.length > 0 && (
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                        <span>Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, leads.length)} - {Math.min(currentPage * itemsPerPage, leads.length)} de {leads.length} resultados</span>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-icons-round text-sm">chevron_left</span>
                            </button>
                            <span className="flex items-center px-2 font-medium">
                                Página {currentPage} de {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-icons-round text-sm">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}