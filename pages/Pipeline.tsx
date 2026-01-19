import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { KanbanCardData } from '../types';
import { PipelineDetailsSidebar, PipelineRequest } from '../components/PipelineDetailsSidebar';

// --- Types & Components ---

type DateRangeOption = 'today' | '7days' | '30days' | 'month' | 'total';
type VerificationFilter = 'all' | 'verified' | 'unverified';

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
        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${active
            ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
    >
        {label}
    </button>
);

interface KanbanColumnProps {
    title: string;
    count: number;
    color: string;
    cards: KanbanCardData[];
    onCardClick: (card: KanbanCardData) => void;
    onArchive?: (card: KanbanCardData) => void;
    onVerify?: (card: KanbanCardData) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, count, color, cards, onCardClick, onArchive, onVerify }) => {
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
                            onClick={() => onCardClick(card)}
                            className="bg-white dark:bg-card-dark p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer active:scale-[0.98] transform duration-200"
                        >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${color}-500 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate pr-2">{card.title}</h4>
                                <span className="material-icons-round text-slate-300 text-sm group-hover:text-primary transition-colors">open_in_new</span>
                            </div>
                            <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400 mb-4">
                                <p className="font-mono text-xs text-slate-400">#{card.id}</p>
                                {card.carInfo && <p className="text-xs font-medium text-primary dark:text-primary-light">{card.carInfo}</p>}
                                {card.quantity && <p className="text-xs">Qtd: {card.quantity}</p>}
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
                                            <input
                                                className="rounded text-primary focus:ring-primary border-slate-200 dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                                                type="checkbox"
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    if (onVerify) onVerify(card);
                                                }}
                                            />
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
    const [dateRange, setDateRange] = useState<DateRangeOption>('total');
    const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>('all');
    const [columns, setColumns] = useState<{ [key: string]: KanbanCardData[] }>({
        'Not Found': [],
        'Pending Feedback': [],
        'Cancelled': [],
        'Deal': []
    });
    const [loading, setLoading] = useState(true);

    // Store raw product data for detail view
    const [rawProducts, setRawProducts] = useState<any[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<PipelineRequest | null>(null);

    useEffect(() => {
        fetchPipelineData();

        // Realtime subscription for products updates
        const channel = supabase
            .channel('public:requests_products')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'requests_products' }, () => {
                fetchPipelineData();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [searchTerm, showArchived, dateRange, verificationFilter]);

    const fetchPipelineData = async () => {
        try {
            setLoading(true);

            // Fetch products with request and client data
            let query = supabase
                .from('requests_products')
                .select(`
                    prod_id,
                    prod_title,
                    car_brand,
                    car_model,
                    car_year,
                    search_result,
                    status,
                    deal_status,
                    prod_quantity,
                    selected_id,
                    created_at,
                    search_prod_ids,
                    requests (
                        request_id,
                        client_id,
                        archived,
                        clients (
                            client_id,
                            name_first,
                            name_last,
                            whatsapp,
                            company_name
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            // Note: Cannot filter by requests.archived directly in the query due to join limitations
            // Will filter client-side after fetching

            // 1. Filter by Verification Status
            if (verificationFilter === 'verified') {
                query = query.not('selected_id', 'is', null);
            } else if (verificationFilter === 'unverified') {
                query = query.is('selected_id', null);
            }

            // 2. Filter Date Range
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
                    startDate = new Date(0);
                    break;
            }

            if (dateRange !== 'total') {
                query = query.gte('created_at', startDate.toISOString());
            }

            const { data, error } = await query;

            if (error) throw error;

            let filteredData = data || [];

            // 3. Filter by Archived (client-side due to join limitations)
            filteredData = filteredData.filter((prod: any) => {
                const isArchived = prod.requests?.archived === true;
                return showArchived ? isArchived : !isArchived;
            });

            // 4. Filter Search Term (Client-side)
            if (searchTerm.trim()) {
                const lower = searchTerm.toLowerCase();
                filteredData = filteredData.filter((prod: any) => {
                    const clientName = prod.requests?.clients
                        ? `${prod.requests.clients.name_first} ${prod.requests.clients.name_last}`.toLowerCase()
                        : '';
                    const title = prod.prod_title?.toLowerCase() || '';
                    const carInfo = `${prod.car_brand || ''} ${prod.car_model || ''} ${prod.car_year || ''}`.toLowerCase();
                    return clientName.includes(lower) || title.includes(lower) || carInfo.includes(lower);
                });
            }

            // Store raw data for detail view
            setRawProducts(filteredData);

            // Map data to columns
            const newColumns: { [key: string]: KanbanCardData[] } = {
                'Not Found': [],
                'Pending Feedback': [],
                'Cancelled': [],
                'Deal': []
            };

            // Mapping function from product data to UI Column
            const mapStatus = (product: any) => {
                // If not found
                if (!product.search_result || product.search_result === false) {
                    return 'Not Found';
                }

                // If has deal_status, use it
                if (product.deal_status) {
                    const ds = product.deal_status.toLowerCase();
                    if (ds.includes('deal') || ds.includes('won') || ds.includes('closed')) {
                        return 'Deal';
                    }
                    if (ds.includes('cancel') || ds.includes('lost')) {
                        return 'Cancelled';
                    }
                }

                // If found but no selection
                if (product.search_result && !product.selected_id) {
                    return 'Pending Feedback';
                }

                // Default
                return 'Pending Feedback';
            };

            filteredData.forEach((prod: any) => {
                const columnTitle = mapStatus(prod);

                const clientName = prod.requests?.clients
                    ? `${prod.requests.clients.name_first || ''} ${prod.requests.clients.name_last || ''}`.trim()
                    : 'Desconhecido';

                const carInfo = `${prod.car_brand || ''} ${prod.car_model || ''} ${prod.car_year || ''}`.trim();

                const card: KanbanCardData = {
                    id: prod.prod_id.toString(),
                    title: prod.prod_title || 'Produto sem nome',
                    date: new Date(prod.created_at).toLocaleDateString('pt-BR'),
                    user: clientName,
                    chatId: prod.requests?.clients?.whatsapp,
                    verified: !!prod.selected_id,
                    clientId: prod.requests?.clients?.client_id,
                    carInfo: carInfo || undefined,
                    quantity: prod.prod_quantity || undefined
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

    const handleCardClick = async (card: KanbanCardData) => {
        // Find the full raw product data
        const rawProd = rawProducts.find((p: any) => p.prod_id.toString() === card.id);
        console.log('Raw product data:', rawProd);

        if (rawProd) {
            // Fetch stock products if search_prod_ids exists
            let stockProducts: any[] = [];
            console.log('search_prod_ids:', rawProd.search_prod_ids);

            if (rawProd.search_prod_ids && rawProd.search_prod_ids.length > 0) {
                console.log('Fetching stock products for IDs:', rawProd.search_prod_ids);

                const { data: stockData, error: stockError } = await supabase
                    .from('stock_products')
                    .select(`
                        product_id,
                        product_title,
                        url,
                        unit_price,
                        supplier_id,
                        suppliers (
                            supplier_id,
                            name,
                            apex_domain
                        )
                    `)
                    .in('product_id', rawProd.search_prod_ids.map((id: string) => parseInt(id)));

                if (stockError) {
                    console.error('Error fetching stock products:', stockError);
                }

                stockProducts = stockData || [];
                console.log('Stock products found:', stockProducts.length, stockProducts);
            }

            console.log('stockProducts.length:', stockProducts.length);
            console.log('Will use fallback?', stockProducts.length === 0);

            const orderedProds = stockProducts.length > 0
                ? stockProducts.map((sp: any) => ({
                    prod_id: sp.product_id?.toString(),
                    prod_title: rawProd.prod_title, // Title from request
                    prod_price: undefined, // Not used in current display
                    // Stock product details
                    stock_product_title: sp.product_title,
                    stock_product_url: sp.url,
                    stock_unit_price: sp.unit_price,
                    supplier_name: sp.suppliers?.name,
                    supplier_domain: sp.suppliers?.apex_domain
                }))
                : [{
                    prod_id: rawProd.prod_id?.toString(),
                    prod_title: rawProd.prod_title,
                    prod_price: undefined
                }];

            console.log('orderedProds created:', orderedProds);

            const mappedRequest: PipelineRequest = {
                request_id: rawProd.requests?.request_id || 0,
                title: card.title,
                status: rawProd.deal_status || rawProd.status || '',
                created_at: rawProd.created_at,
                total_price: null,
                ordered_prods: orderedProds,
                client: rawProd.requests?.clients ? {
                    client_id: rawProd.requests.clients.client_id,
                    name_first: rawProd.requests.clients.name_first,
                    name_last: rawProd.requests.clients.name_last,
                    whatsapp: rawProd.requests.clients.whatsapp,
                    company: rawProd.requests.clients.company_name
                } : undefined,
                verified: !!rawProd.selected_id,
                // Product details from requests_products
                prod_quantity: rawProd.prod_quantity,
                car_brand: rawProd.car_brand,
                car_model: rawProd.car_model,
                car_year: rawProd.car_year
            };

            console.log('Mapped request:', mappedRequest);
            console.log('ordered_prods:', mappedRequest.ordered_prods);
            console.log('ordered_prods JSON:', JSON.stringify(mappedRequest.ordered_prods, null, 2));

            setSelectedRequest(mappedRequest);
        }
    };

    const handleCloseSidebar = () => {
        setSelectedRequest(null);
    };

    const handleVerify = async (requestId: number) => {
        // For products, we need to find the product and toggle its selected_id
        try {
            const prod = rawProducts.find((p: any) => p.requests?.request_id === requestId);
            if (!prod) return;

            const newSelectedId = prod.selected_id ? null : 1; // Toggle: if has selection, remove; if no selection, set to 1 (dummy)

            await supabase
                .from('requests_products')
                .update({ selected_id: newSelectedId })
                .eq('prod_id', prod.prod_id);

            fetchPipelineData();
            setSelectedRequest(null);
        } catch (error) {
            console.error('Error verifying product:', error);
        }
    };

    const handleArchive = async (requestId: number) => {
        const prod = rawProducts.find((p: any) => p.requests?.request_id === requestId);
        if (!prod?.requests?.clients?.client_id) return;

        const confirm = window.confirm(`Deseja arquivar esta solicitação?`);
        if (!confirm) return;

        try {
            await supabase
                .from('requests')
                .update({ archived: true })
                .eq('request_id', requestId);

            fetchPipelineData();
            setSelectedRequest(null);
        } catch (error) {
            console.error('Error archiving request:', error);
            alert('Erro ao arquivar.');
        }
    };

    const handleVerifyFromCard = async (card: KanbanCardData) => {
        try {
            // Find the product by card ID
            const prod = rawProducts.find((p: any) => p.prod_id.toString() === card.id);
            if (!prod) return;

            // Toggle verification: set selected_id to 1 if null, or null if has value
            const newSelectedId = prod.selected_id ? null : 1;

            await supabase
                .from('requests_products')
                .update({ selected_id: newSelectedId })
                .eq('prod_id', prod.prod_id);

            // Refresh data to show updated verification status
            fetchPipelineData();
        } catch (error) {
            console.error('Error verifying product from card:', error);
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
            <header className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Pipeline</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie o follow-up de solicitações</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-card-dark p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    {/* Date Filters */}
                    <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                        <span className="material-icons-round text-slate-400 ml-2 mr-2">calendar_today</span>
                        <FilterButton active={dateRange === 'today'} onClick={() => setDateRange('today')} label="Hoje" />
                        <FilterButton active={dateRange === '7days'} onClick={() => setDateRange('7days')} label="7 dias" />
                        <FilterButton active={dateRange === '30days'} onClick={() => setDateRange('30days')} label="30 dias" />
                        <FilterButton active={dateRange === 'month'} onClick={() => setDateRange('month')} label="Mês atual" />
                        <FilterButton active={dateRange === 'total'} onClick={() => setDateRange('total')} label="Total" />
                    </div>

                    <div className="hidden md:block w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>

                    {/* Verification Filter */}
                    <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                            onClick={() => setVerificationFilter('all')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${verificationFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setVerificationFilter('verified')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${verificationFilter === 'verified' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            Verificados
                        </button>
                        <button
                            onClick={() => setVerificationFilter('unverified')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${verificationFilter === 'unverified' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            Não Verificados
                        </button>
                    </div>

                    <div className="hidden md:block w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>

                    {/* Existing Filters: Archived & Search */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <button
                                onClick={() => setShowArchived(false)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${!showArchived ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                            >
                                Ativos
                            </button>
                            <button
                                onClick={() => setShowArchived(true)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${showArchived ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                            >
                                Arquivados
                            </button>
                        </div>

                        <div className="relative group">
                            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                            <input
                                className="pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm w-48 focus:ring-2 focus:ring-primary transition-all dark:text-white"
                                placeholder="Buscar..."
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
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
                    <KanbanColumn title="Não Encontrado" count={columns['Not Found'].length} color="rose" cards={columns['Not Found']} onCardClick={handleCardClick} onArchive={handleBulkArchive} onVerify={handleVerifyFromCard} />
                    <KanbanColumn title="Sem Feedback" count={columns['Pending Feedback'].length} color="amber" cards={columns['Pending Feedback']} onCardClick={handleCardClick} onArchive={handleBulkArchive} onVerify={handleVerifyFromCard} />
                    <KanbanColumn title="Cancelado" count={columns['Cancelled'].length} color="slate" cards={columns['Cancelled']} onCardClick={handleCardClick} onArchive={handleBulkArchive} onVerify={handleVerifyFromCard} />
                    <KanbanColumn title="Deal" count={columns['Deal'].length} color="primary" cards={columns['Deal']} onCardClick={handleCardClick} onArchive={handleBulkArchive} onVerify={handleVerifyFromCard} />
                </div>
            )}

            {/* Sidebar */}
            <PipelineDetailsSidebar
                request={selectedRequest}
                isOpen={!!selectedRequest}
                onClose={handleCloseSidebar}
                onVerify={handleVerify}
                onArchive={handleArchive}
            />
        </main>
    );
}