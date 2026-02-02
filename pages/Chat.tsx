import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ChatStatCard } from '../components/ChatStatCard';
import { Message, ClientSession } from '../types/chat';

export default function ChatPage() {
    const { user } = useAuth();
    const location = useLocation();
    const [sessions, setSessions] = useState<ClientSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState('');
    const [aiEnabled, setAiEnabled] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Stats
    const [totalLeads, setTotalLeads] = useState(0);
    const [receivedMessages, setReceivedMessages] = useState(0);
    const [followUpCount, setFollowUpCount] = useState(0);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'active' | 'archived'>('active');
    const [timeFilter, setTimeFilter] = useState<'all' | 'today'>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'Open', 'Deal', 'Canceled'

    // Initial Load & Debounced Search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSessions();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, filterStatus, timeFilter, statusFilter]);

    // Fetch stats on mount
    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        const channel = supabase
            .channel('public:clients')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
                fetchSessions();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const urlChatId = searchParams.get('chatId');
        if (urlChatId) {
            setSelectedSessionId(urlChatId);
        }
    }, [location.search]);

    useEffect(() => {
        if (!selectedSessionId) return;

        fetchMessages(selectedSessionId);

        const channel = supabase
            .channel(`n8n_chat_global`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'n8n_chat_histories'
            }, (payload) => {
                const newMsg = payload.new as Message;
                if (newMsg.session_id === selectedSessionId || newMsg.session_id === `${selectedSessionId}_orq`) {
                    setMessages(prev => [...prev, newMsg]);
                    scrollToBottom();
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedSessionId]);

    const fetchStats = async () => {
        try {
            // 1. Total Leads (from clients table)
            const { count: contactCount } = await supabase
                .from('clients')
                .select('*', { count: 'exact', head: true })
                .or('archived.is.null,archived.eq.false');

            setTotalLeads(contactCount || 0);

            // 2. Mensagens Recebidas (from count_messages id=1)
            const { data: msgData } = await supabase
                .from('count_messages')
                .select('messages_counter')
                .eq('id', 1)
                .single();

            if (msgData) {
                setReceivedMessages(msgData.messages_counter || 0);
            }

            // 3. Follow Up (from count_messages id=2)
            const { data: fupData } = await supabase
                .from('count_messages')
                .select('messages_counter')
                .eq('id', 2)
                .single();

            if (fupData) {
                setFollowUpCount(fupData.messages_counter || 0);
            }

        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchSessions = async () => {
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

            // 1. Status (Active/Archived)
            if (filterStatus === 'active') {
                query = query.or('archived.is.null,archived.eq.false');
            } else {
                query = query.eq('archived', true);
            }

            // 2. Time Filter
            if (timeFilter === 'today') {
                const today = new Date().toISOString().split('T')[0];
                query = query.gte('last_message', `${today}T00:00:00`);
            }

            // 3. Search
            if (searchTerm.trim()) {
                query = query.or(`name_first.ilike.%${searchTerm}%,name_last.ilike.%${searchTerm}%,whatsapp.ilike.%${searchTerm}%`);
            } else {
                query = query.limit(50); // Increased limit slightly
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data) {
                // Determine latest status for each client
                let processedData = data.map((client: any) => {
                    // Sort requests by date desc
                    const sortedRequests = (client.requests || []).sort((a: any, b: any) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    );
                    const latest = sortedRequests[0]?.status || 'Sem Status';
                    return { ...client, latestStatus: latest };
                });

                // 4. Status Filter (Client-side)
                if (statusFilter !== 'all') {
                    processedData = processedData.filter(c =>
                        c.latestStatus?.toLowerCase() === statusFilter.toLowerCase()
                    );
                }

                setSessions(processedData);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (sessionId: string) => {
        try {
            const { data, error } = await supabase
                .from('n8n_chat_histories')
                .select('*')
                .or(`session_id.eq.${sessionId},session_id.eq.${sessionId}_orq`)
                .in('message->>type', ['human', 'AI']) // Filter for human or AI messages only
                .order('id', { ascending: true });

            if (error) throw error;

            if (data) {
                setMessages(data);
                scrollToBottom();
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !selectedSessionId) return;

        const content = input;
        setInput('');

        try {
            const targetSessionId = `${selectedSessionId}_orq`;
            const newMessage = { type: 'human', content: content };
            const { error } = await supabase.from('n8n_chat_histories').insert({
                session_id: targetSessionId,
                message: newMessage
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Erro ao enviar mensagem');
        }
    };

    const handleSelectSession = (id: string) => {
        setSelectedSessionId(id);
    };

    const getMessageContent = (msg: Message) => {
        if (!msg.message) return '';
        let text = msg.message.content || '';

        // Robust cleanup for N8N "Used tools" logs which may contain nested brackets [ ]
        // Example: [Used tools: ... "pending": [] ... ] Actual message
        while (text.includes('[Used tools:')) {
            const startIndex = text.indexOf('[Used tools:');
            let depth = 0;
            let endIndex = -1;

            // Start scanning from the opening bracket of [Used tools:
            for (let i = startIndex; i < text.length; i++) {
                if (text[i] === '[') depth++;
                else if (text[i] === ']') depth--;

                if (depth === 0) {
                    endIndex = i;
                    break;
                }
            }

            if (endIndex !== -1) {
                // Remove the block including brackets
                text = text.slice(0, startIndex) + text.slice(endIndex + 1);
            } else {
                // Malformed/unclosed block, safety break to avoid infinite loop
                // Try simple regex fallback or just break
                text = text.replace(/\[Used tools:[\s\S]*?\]/g, '');
                break;
            }
        }

        return text.trim();
    };

    const getMessageRole = (msg: Message) => {
        return msg.message?.type === 'human' ? 'user' : 'assistant';
    };

    const selectedClient = sessions.find(s => s.whatsapp === selectedSessionId || s.client_id.toString() === selectedSessionId);

    // Helpers for Status Badge
    const getStatusColor = (status?: string) => {
        const s = (status || '').toLowerCase();
        if (s.includes('deal') || s.includes('won')) return 'bg-green-100 text-green-700';
        if (s.includes('cancel') || s.includes('lost')) return 'bg-slate-200 text-slate-600'; // Changed to gray
        if (s.includes('open') || s.includes('new')) return 'bg-blue-100 text-blue-700';
        return 'bg-slate-100 text-slate-500';
    };

    return (
        <main className="flex flex-col h-[calc(100vh-theme(spacing.20))] md:h-[calc(100vh-2rem)] p-4 md:p-8 gap-6">
            {/* Page Header with Stats */}
            <header className="flex flex-col gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Chat</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Acompanhe as conversas do agente com os clientes</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <ChatStatCard title="Leads" value={totalLeads.toString()} icon="group" color="blue" />
                    <ChatStatCard title="Mensagens Recebidas" value={receivedMessages.toString()} icon="chat" color="emerald" />
                    <ChatStatCard title="Follow Up" value={followUpCount.toString()} icon="send" color="indigo" />
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex flex-1 gap-6 min-h-0">
                {/* Sidebar List (Clients) */}
                <aside className={`w-full md:w-80 bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col ${selectedSessionId ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold dark:text-white">Conversas</h2>
                            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                <button
                                    onClick={() => setFilterStatus('active')}
                                    className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${filterStatus === 'active' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                                >
                                    Ativos
                                </button>
                                <button
                                    onClick={() => setFilterStatus('archived')}
                                    className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${filterStatus === 'archived' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                                >
                                    Arq.
                                </button>
                            </div>
                        </div>

                        <div className="relative">
                            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none dark:text-white"
                                placeholder="Buscar nome ou telefone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setTimeFilter(prev => prev === 'all' ? 'today' : 'all')}
                                className={`flex-1 text-xs font-medium py-1.5 rounded-lg border transition-colors ${timeFilter === 'today' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-200 text-slate-500'}`}
                            >
                                {timeFilter === 'today' ? '📅 Hoje' : '📅 Todos'}
                            </button>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="flex-1 text-xs font-medium py-1.5 px-2 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 text-slate-600 dark:text-slate-300 focus:outline-none"
                            >
                                <option value="all">📂 Todos Status</option>
                                <option value="open">🔵 Open</option>
                                <option value="deal">🟢 Deal</option>
                                <option value="canceled">🔴 Canceled</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {sessions.length === 0 && !loading && (
                            <div className="p-8 text-center">
                                <span className="material-icons-round text-3xl text-slate-300 mb-2">search_off</span>
                                <p className="text-sm text-slate-500">Nenhuma conversa encontrada</p>
                            </div>
                        )}
                        {sessions.map(client => (
                            <div
                                key={client.client_id}
                                onClick={() => handleSelectSession(client.whatsapp)}
                                className={`p-4 border-b border-slate-50 dark:border-slate-800/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedSessionId === client.whatsapp ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            >
                                <div className="flex justify-between mb-1">
                                    <h4 className="font-semibold text-slate-900 dark:text-white truncate max-w-[70%]">
                                        {client.name_first} {client.name_last}
                                    </h4>
                                    <span className="text-xs text-slate-400 whitespace-nowrap">
                                        {client.last_message ? new Date(client.last_message).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' - ' + new Date(client.last_message).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-xs text-primary truncate">{client.whatsapp}</p>
                                    {client.latestStatus && client.latestStatus !== 'Sem Status' && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${getStatusColor(client.latestStatus)}`}>
                                            {client.latestStatus}
                                        </span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                        {client.archived ? '📂 Arquivado' : (client.fup_done ? '✅ FUP Feito' : '⏳ Aguardando')}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {loading && <div className="p-4 text-center text-slate-400">Carregando...</div>}
                    </div>
                </aside>

                {/* Chat Area */}
                {selectedSessionId ? (
                    <section className="flex-1 bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
                        <header className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedSessionId(null)} className="md:hidden text-slate-500">
                                    <span className="material-icons-round">arrow_back</span>
                                </button>
                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                                    {selectedClient?.name_first?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <h3 className="font-bold dark:text-white">{selectedClient?.name_first} {selectedClient?.name_last || 'Cliente'}</h3>
                                    <p className="text-xs text-slate-500">{selectedClient?.whatsapp}</p>
                                </div>
                            </div>

                            {/* Status Label in Header */}
                            {selectedClient?.latestStatus && (
                                <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${getStatusColor(selectedClient.latestStatus)}`}>
                                    {selectedClient.latestStatus}
                                </span>
                            )}
                        </header>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-slate-900/20">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <span className="material-icons-round text-4xl mb-2">forum</span>
                                    <p>Nenhuma mensagem encontrada para este ID</p>
                                </div>
                            ) : (
                                messages.map(msg => {
                                    const role = getMessageRole(msg);
                                    const content = getMessageContent(msg);
                                    if (!content) return null;

                                    return (
                                        <div key={msg.id} className={`flex ${role === 'user' ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`max-w-[85%] md:max-w-[75%] p-3 rounded-2xl shadow-sm whitespace-pre-wrap ${role === 'user'
                                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 rounded-tl-none'
                                                : 'bg-primary text-white rounded-tr-none'
                                                }`}>
                                                <p className="text-sm">{content}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={sendMessage} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-card-dark">
                            <div className="flex gap-2 relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Digite sua mensagem..."
                                    className="flex-1 bg-slate-100 dark:bg-slate-900 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all dark:text-white"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50"
                                >
                                    <span className="material-icons-round">send</span>
                                </button>
                            </div>
                        </form>
                    </section>
                ) : (
                    <div className="hidden md:flex flex-1 items-center justify-center bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 flex-col">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                            <span className="material-icons-round text-4xl text-slate-300">people</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Selecione um Cliente</h3>
                        <p className="text-sm">Veja o histórico de conversa sincronizado com o N8N</p>
                    </div>
                )}
            </div>
        </main>
    );
}