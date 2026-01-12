import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// N8N Message Structure
interface N8NMessageContent {
    type: 'ai' | 'human' | 'system';
    content: string;
    tool_calls?: any[];
}

interface Message {
    id: number;
    session_id: string;
    message: N8NMessageContent;
    created_at?: string; // Might not exist in DB, fallback to ID order
}

interface ClientSession {
    client_id: string;
    name_first: string;
    name_last: string;
    whatsapp: string;
    last_message?: string;
    fup_done?: boolean;
    company_name?: string; // Optional if not in clients table
    archived?: boolean;
}

export default function ChatPage() {
    const { user } = useAuth();
    const location = useLocation();
    const [sessions, setSessions] = useState<ClientSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState('');
    const [aiEnabled, setAiEnabled] = useState(true); // TBD: Where to store this in new schema?
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'active' | 'archived'>('active');
    const [timeFilter, setTimeFilter] = useState<'all' | 'today'>('all');

    // Initial Load & Debounced Search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSessions();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [searchTerm, filterStatus, timeFilter]);

    useEffect(() => {
        const channel = supabase
            .channel('public:clients')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
                fetchSessions();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    // Handle URL query param (chatId = subscription/whatsapp)
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const urlChatId = searchParams.get('chatId');
        if (urlChatId) {
            setSelectedSessionId(urlChatId);
        }
    }, [location.search]);

    // Load Messages when Session Selected
    useEffect(() => {
        if (!selectedSessionId) return;

        fetchMessages(selectedSessionId);

        // Realtime subscription
        // Note: We subscribe to global INSERTs for this table to catch the suffixed ID events
        const channel = supabase
            .channel(`n8n_chat_global`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'n8n_chat_histories'
            }, (payload) => {
                const newMsg = payload.new as Message;
                // Check if the new message belongs to the current session (exact match OR suffix match)
                if (newMsg.session_id === selectedSessionId || newMsg.session_id === `${selectedSessionId}_orq`) {
                    setMessages(prev => [...prev, newMsg]);
                    scrollToBottom();
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedSessionId]);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('clients')
                .select('*')
                .order('last_message', { ascending: false });

            // Apply Filters

            // 1. Status Filter (Active vs Archived)
            // Assuming default is active (archived is false or null)
            if (filterStatus === 'active') {
                query = query.or('archived.is.null,archived.eq.false');
            } else {
                query = query.eq('archived', true);
            }

            // 2. Time Filter (Today)
            if (timeFilter === 'today') {
                const today = new Date().toISOString().split('T')[0];
                query = query.gte('last_message', `${today}T00:00:00`);
            }

            // 3. Search Filter
            if (searchTerm.trim()) {
                // Since Supabase doesn't support convenient "OR" across columns easily without raw SQL or specific syntax
                // We'll search by name_first OR whatsapp
                query = query.or(`name_first.ilike.%${searchTerm}%,name_last.ilike.%${searchTerm}%,whatsapp.ilike.%${searchTerm}%`);
            } else {
                // Limit initial load if no search to avoid heavy payload
                query = query.limit(20);
            }

            const { data, error } = await query;

            if (error) throw error;
            if (data) setSessions(data);
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (sessionId: string) => {
        try {
            // Fetching from n8n_chat_histories
            // Handling mismatch: Clients have "222", N8N has "222_orq"
            const { data, error } = await supabase
                .from('n8n_chat_histories')
                .select('*')
                // Use .or() to catch both clean ID and ID with suffix
                .or(`session_id.eq.${sessionId},session_id.eq.${sessionId}_orq`)
                .order('id', { ascending: true }); // Using ID for ordering as created_at might be missing

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

        // Optimistic UI update could go here

        try {
            // Insert into n8n_chat_histories
            // Defaulting to the '_orq' suffix format for consistency with existing history
            const targetSessionId = `${selectedSessionId}_orq`;

            const newMessage = {
                type: 'human', // User sending message
                content: content
            };

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

    // Helper to extract display text from N8N JSON
    const getMessageContent = (msg: Message) => {
        if (!msg.message) return '';
        let text = msg.message.content || '';

        // Cleanup "Used tools" logs if present (Optional)
        text = text.replace(/\[Used tools:.*?\]/g, '').trim();

        return text;
    };

    const getMessageRole = (msg: Message) => {
        // Map N8N types to UI roles
        return msg.message?.type === 'human' ? 'user' : 'assistant';
    };

    const selectedClient = sessions.find(s => s.whatsapp === selectedSessionId || s.client_id.toString() === selectedSessionId);

    return (
        <main className="flex h-[calc(100vh-theme(spacing.20))] md:h-[calc(100vh-2rem)] p-4 md:p-8 gap-6">
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
                                    {client.last_message ? new Date(client.last_message).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                            </div>
                            <p className="text-xs text-primary mb-1 truncate">{client.whatsapp}</p>
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

                        {/* AI Settings (Placeholder - as toggle column isn't in clients yet) */}
                        <div className="flex items-center gap-3 bg-slate-200 dark:bg-slate-800 p-1.5 rounded-full pl-4 pr-1.5 opacity-50 cursor-not-allowed" title="Configuração ainda não migrada para tabela Clients">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 mr-2">
                                IA Ativada
                            </span>
                            <div className="w-12 h-6 bg-primary rounded-full p-1 relative">
                                <div className="w-4 h-4 bg-white rounded-full shadow-md transform translate-x-6"></div>
                            </div>
                        </div>
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
                                            {/* Timestamp omitted for now as it's not in the base table, only maybe in JSON */}
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
                                placeholder="Digite sua mensagem (será salva como 'human')..."
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
        </main>
    );
}