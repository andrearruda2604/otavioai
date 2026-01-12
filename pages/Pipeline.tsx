import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { KanbanCardData } from '../types';

interface KanbanColumnProps {
    title: string;
    count: number;
    color: string;
    cards: KanbanCardData[];
    onArchive?: (card: KanbanCardData) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, count, color, cards, onArchive }) => {
    const navigate = useNavigate();

    const handleCardClick = (card: KanbanCardData) => {
        if (card.chatId) {
            navigate(`/chat?chatId=${card.chatId}`);
        } else {
            navigate('/chat');
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full bg-${color}-500`}></span>
                    <h3 className="font-bold text-slate-700 dark:text-slate-200">{title}</h3>
                </div>
                <span className={`px-2 py-0.5 text-xs font-bold bg-${color}-100 text-${color}-600 dark:bg-${color}-500/10 dark:text-${color}-400 rounded-full`}>{count}</span>
            </div>
            <div className={`space-y-4 min-h-[100px] ${cards.length === 0 ? 'opacity-50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center' : ''}`}>
                {cards.length === 0 ? (
                    <span className="text-xs text-slate-400">Vazio</span>
                ) : (
                    cards.map((card, i) => (
                        <div
                            key={i}
                            onClick={() => handleCardClick(card)}
                            className="bg-white dark:bg-card-dark p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer active:scale-[0.98] transform duration-200"
                        >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${color}-500 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate pr-2">{card.title}</h4>
                                <span className="material-icons-round text-slate-300 text-sm group-hover:text-primary transition-colors">open_in_new</span>
                            </div>
                            <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400 mb-4">
                                <p className="font-mono text-xs text-slate-400">#{card.id}</p>
                                <p>{card.date}</p>
                                <p className="font-medium text-slate-700 dark:text-slate-300 truncate">{card.user}</p>
                            </div>
                            <div className="flex items-center justify-between mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                                {onArchive && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onArchive(card); }}
                                        className="text-xs font-medium text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
                                        title="Arquivar conversa"
                                    >
                                        <span className="material-icons-round text-sm">archive</span>
                                        Arquivar
                                    </button>
                                )}
                                <div className="flex items-center justify-end">
                                    {card.verified ? (
                                        <div className="flex items-center gap-1 text-accent text-xs font-bold bg-accent/10 px-2 py-1 rounded-lg">
                                            <span className="material-icons-round text-xs">check_circle</span>
                                            Verificado
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 group/check" onClick={(e) => e.stopPropagation()}>
                                            <span className="text-xs font-medium text-slate-400 group-hover/check:text-slate-600 dark:group-hover/check:text-slate-300 transition-colors">Verificar</span>
                                            <input className="rounded text-primary focus:ring-primary border-slate-200 dark:border-slate-700 dark:bg-slate-800" type="checkbox" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default function PipelinePage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [columns, setColumns] = useState<{ [key: string]: KanbanCardData[] }>({
        'Not Found': [],
        'Pending Feedback': [],
        'Cancelled': [],
        'Deal': []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPipelineData();

        // Realtime subscription for requests updates
        const channel = supabase
            .channel('public:requests')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => {
                fetchPipelineData();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [searchTerm, showArchived]);

    const fetchPipelineData = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('requests')
                .select(`
                    request_id,
                    created_at,
                    status,
                    total_price,
                    ordered_prods,
                    archived,
                    clients (
                        client_id,
                        name_first,
                        name_last,
                        whatsapp
                    )
                `)
                .order('created_at', { ascending: false });

            // Filter Archived
            if (!showArchived) {
                query = query.or('archived.is.null,archived.eq.false');
            } else {
                query = query.eq('archived', true);
            }

            const { data, error } = await query;

            if (error) throw error;

            let filteredData = data || [];

            if (searchTerm.trim()) {
                const lower = searchTerm.toLowerCase();
                filteredData = filteredData.filter((req: any) => {
                    const clientName = req.clients ? `${req.clients.name_first} ${req.clients.name_last}`.toLowerCase() : '';
                    const title = req.ordered_prods?.[0]?.prod_title?.toLowerCase() || '';
                    return clientName.includes(lower) || title.includes(lower);
                });
            }

            // Map data to columns
            const newColumns: { [key: string]: KanbanCardData[] } = {
                'Not Found': [],
                'Pending Feedback': [],
                'Cancelled': [],
                'Deal': []
            };

            // Mapping function from DB Status to UI Column
            const mapStatus = (status: string | null) => {
                if (!status) return 'Not Found'; // Default column
                const s = status.toLowerCase();
                if (s.includes('deal') || s.includes('won') || s.includes('closed')) return 'Deal';
                if (s.includes('cancel') || s.includes('lost')) return 'Cancelled';
                if (s.includes('feedback') || s.includes('quota') || s.includes('wait')) return 'Pending Feedback';
                return 'Not Found'; // Fallback for 'Open', 'New', etc.
            };

            filteredData.forEach((req: any) => {
                const columnTitle = mapStatus(req.status);

                // Extract title from ordered_prods or default
                let title = "Solicitação";
                if (req.ordered_prods && Array.isArray(req.ordered_prods) && req.ordered_prods.length > 0) {
                    title = req.ordered_prods[0].prod_title || "Produto sem nome";
                }

                const clientName = req.clients ? `${req.clients.name_first || ''} ${req.clients.name_last || ''}`.trim() : 'Desconhecido';

                const card: KanbanCardData = {
                    id: req.request_id.toString(),
                    title: title,
                    date: new Date(req.created_at).toLocaleDateString('pt-BR'),
                    user: clientName,
                    chatId: req.clients?.whatsapp, // Ensuring link to chat
                    verified: !!req.total_price, // Dummy verification logic
                    clientId: req.clients?.client_id
                };

                if (newColumns[columnTitle]) {
                    newColumns[columnTitle].push(card);
                }
            });

            setColumns(newColumns);
        } catch (error) {
            console.error('Error fetching pipeline:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkArchive = async (card: KanbanCardData) => {
        if (!card.clientId) return;

        const confirm = window.confirm(
            `Deseja arquivar TODOS os itens de ${card.user}?\n\nIsso irá remover os cards deste painel e arquivar a conversa.`
        );

        if (!confirm) return;

        try {
            setLoading(true);

            // 1. Archive all requests for this client
            const { error: reqError } = await supabase
                .from('requests')
                .update({ archived: true })
                .eq('client_id', card.clientId);

            if (reqError) throw reqError;

            // 2. Archive the client (hides from Chat default view)
            const { error: clientError } = await supabase
                .from('clients')
                .update({ archived: true })
                .eq('client_id', card.clientId);

            if (clientError) throw clientError;

            // Refresh
            fetchPipelineData();

        } catch (error) {
            console.error("Error archiving:", error);
            alert("Erro ao arquivar itens.");
            setLoading(false);
        }
    };

    return (
        <main className="p-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Pipeline</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie o follow-up de solicitações</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex gap-1 bg-white dark:bg-card-dark p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <button
                            onClick={() => setShowArchived(false)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${!showArchived ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                        >
                            Ativos
                        </button>
                        <button
                            onClick={() => setShowArchived(true)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${showArchived ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                        >
                            Arquivados
                        </button>
                    </div>

                    <div className="relative group">
                        <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            className="pl-10 pr-4 py-2.5 bg-white dark:bg-card-dark border-none rounded-xl text-sm w-72 shadow-sm focus:ring-2 focus:ring-primary transition-all dark:text-white"
                            placeholder="Buscar cliente ou produto..."
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="flex items-center justify-center h-64 text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></div>
                    Carregando Pipeline...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                    <KanbanColumn title="Não Encontrado" count={columns['Not Found'].length} color="rose" cards={columns['Not Found']} onArchive={handleBulkArchive} />
                    <KanbanColumn title="Sem Feedback" count={columns['Pending Feedback'].length} color="amber" cards={columns['Pending Feedback']} onArchive={handleBulkArchive} />
                    <KanbanColumn title="Cancelado" count={columns['Cancelled'].length} color="slate" cards={columns['Cancelled']} onArchive={handleBulkArchive} />
                    <KanbanColumn title="Deal" count={columns['Deal'].length} color="primary" cards={columns['Deal']} onArchive={handleBulkArchive} />
                </div>
            )}
        </main>
    );
}