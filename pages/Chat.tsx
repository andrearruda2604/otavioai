import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    created_at: string;
}

interface ChatSession {
    id: string;
    contact_name: string;
    company_name: string;
    is_ai_enabled: boolean;
    last_message?: string;
    updated_at: string;
}

export default function ChatPage() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState('');
    const [aiEnabled, setAiEnabled] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Mock initial data if no real data
    useEffect(() => {
        if (!process.env.VITE_SUPABASE_URL) {
            setSessions([
                { id: '1', contact_name: 'Ana Souza', company_name: 'Auto Peças Central', is_ai_enabled: true, updated_at: new Date().toISOString() },
                { id: '2', contact_name: 'Henrique Silva', company_name: 'Marinho & Filhos', is_ai_enabled: false, updated_at: new Date().toISOString() }
            ]);
            setLoading(false);
            return;
        }
        fetchSessions();

        const channel = supabase
            .channel('public:chats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
                fetchSessions();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    useEffect(() => {
        if (!selectedSessionId) return;

        fetchMessages(selectedSessionId);

        // Find current session to set AI toggle state
        const session = sessions.find(s => s.id === selectedSessionId);
        if (session) setAiEnabled(session.is_ai_enabled);

        const channel = supabase
            .channel(`chat:${selectedSessionId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `chat_id=eq.${selectedSessionId}`
            }, (payload) => {
                setMessages(prev => [...prev, payload.new as Message]);
                scrollToBottom();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedSessionId]);

    const fetchSessions = async () => {
        try {
            const { data, error } = await supabase.from('chats').select('*').order('updated_at', { ascending: false });
            if (error) throw error;
            if (data) setSessions(data);
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (chatId: string) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true });

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

    const toggleAi = async () => {
        if (!selectedSessionId) return;
        const newState = !aiEnabled;
        setAiEnabled(newState);

        try {
            await supabase.from('chats').update({ is_ai_enabled: newState }).eq('id', selectedSessionId);
        } catch (error) {
            console.error('Error updating AI status:', error);
            setAiEnabled(!newState); // revert on error
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !selectedSessionId) return;

        const content = input;
        setInput('');

        try {
            const { error } = await supabase.from('messages').insert({
                chat_id: selectedSessionId,
                role: 'assistant', // Human operator acting as assistant
                content: content
            });

            if (error) throw error;

            // Should be handled by subscription, but optimistic update possible here
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleSelectSession = (id: string) => {
        setSelectedSessionId(id);
    };

    return (
        <main className="flex h-[calc(100vh-theme(spacing.20))] md:h-[calc(100vh-2rem)] p-4 md:p-8 gap-6">
            {/* Sidebar lista de chats */}
            <aside className={`w-full md:w-80 bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col ${selectedSessionId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold dark:text-white mb-4">Conversas</h2>
                    <div className="relative">
                        <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none dark:text-white" placeholder="Buscar..." />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {sessions.map(session => (
                        <div
                            key={session.id}
                            onClick={() => handleSelectSession(session.id)}
                            className={`p-4 border-b border-slate-50 dark:border-slate-800/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedSessionId === session.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        >
                            <div className="flex justify-between mb-1">
                                <h4 className="font-semibold text-slate-900 dark:text-white truncate">{session.contact_name}</h4>
                                <span className="text-xs text-slate-400">09:41</span>
                            </div>
                            <p className="text-xs text-primary mb-1">{session.company_name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                {session.is_ai_enabled ? '🤖 Atendimento Automático' : '👤 Atendimento Humano'}
                            </p>
                        </div>
                    ))}
                    {loading && <div className="p-4 text-center text-slate-400">Carregando...</div>}
                </div>
            </aside>

            {/* Area do Chat */}
            {selectedSessionId ? (
                <section className="flex-1 bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
                    <header className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSelectedSessionId(null)} className="md:hidden text-slate-500">
                                <span className="material-icons-round">arrow_back</span>
                            </button>
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                                {sessions.find(s => s.id === selectedSessionId)?.contact_name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold dark:text-white">{sessions.find(s => s.id === selectedSessionId)?.contact_name}</h3>
                                <p className="text-xs text-slate-500">{sessions.find(s => s.id === selectedSessionId)?.company_name}</p>
                            </div>
                        </div>

                        {/* Live Ops Toggle */}
                        <div className="flex items-center gap-3 bg-slate-200 dark:bg-slate-800 p-1.5 rounded-full pl-4 pr-1.5">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 mr-2">
                                {aiEnabled ? 'IA Ativada' : 'Humano'}
                            </span>
                            <button
                                onClick={toggleAi}
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out relative ${aiEnabled ? 'bg-primary' : 'bg-slate-400'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${aiEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </button>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-slate-900/20">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <span className="material-icons-round text-4xl mb-2">forum</span>
                                <p>Nenhuma mensagem nesta conversa</p>
                            </div>
                        ) : (
                            messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${msg.role === 'user'
                                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 rounded-tl-none'
                                            : 'bg-primary text-white rounded-tr-none'
                                        }`}>
                                        <p className="text-sm">{msg.content}</p>
                                        <div className={`text-[10px] mt-1 text-right ${msg.role === 'user' ? 'text-slate-400' : 'text-blue-100'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={sendMessage} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-card-dark">
                        <div className="flex gap-2 relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={aiEnabled}
                                placeholder={aiEnabled ? "Desative a IA para enviar mensagem..." : "Digite sua resposta..."}
                                className="flex-1 bg-slate-100 dark:bg-slate-900 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 transition-all dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || aiEnabled}
                                className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-icons-round">send</span>
                            </button>
                        </div>
                    </form>
                </section>
            ) : (
                <div className="hidden md:flex flex-1 items-center justify-center bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 flex-col">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                        <span className="material-icons-round text-4xl text-slate-300">chat_bubble_outline</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Selecione uma conversa</h3>
                    <p className="text-sm">Gerencie o atendimento automático ou intervenha manualmente</p>
                </div>
            )}
        </main>
    );
}