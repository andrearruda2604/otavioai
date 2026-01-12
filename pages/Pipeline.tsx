import React from 'react';
import { useNavigate } from 'react-router-dom';
import { KanbanCardData } from '../types';

interface KanbanColumnProps {
    title: string;
    count: number;
    color: string;
    cards: KanbanCardData[];
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, count, color, cards }) => {
    const navigate = useNavigate();

    const handleCardClick = (card: KanbanCardData) => {
        if (card.chatId) {
            navigate(`/chat?chatId=${card.chatId}`);
        } else {
            // Fallback if no chat ID, just go to chat or stay (optional: notify user)
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
            <div className="space-y-4">
                {cards.map((card, i) => (
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
                            <p className="font-mono text-xs text-slate-400">{card.id}</p>
                            <p>{card.date}</p>
                            <p className="font-medium text-slate-700 dark:text-slate-300">{card.user}</p>
                        </div>
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
                ))}
            </div>
        </div>
    );
};

export default function PipelinePage() {
    return (
        <main className="p-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Pipeline</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie o follow-up de solicitações</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input className="pl-10 pr-4 py-2.5 bg-white dark:bg-card-dark border-none rounded-xl text-sm w-72 shadow-sm focus:ring-2 focus:ring-primary transition-all dark:text-white" placeholder="Buscar produto..." type="text" />
                    </div>
                </div>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                <KanbanColumn title="Não Encontrado" count={44} color="rose" cards={[
                    { title: "Lanterna Traseira", id: "#1000", date: "09/01/2026", user: "Renata Moura", chatId: "1" },
                    { title: "Tulipa Câmbio", id: "#1000", date: "09/01/2026", user: "Renata Moura" }
                ]} />
                <KanbanColumn title="Sem Feedback" count={54} color="amber" cards={[
                    { title: "Lanterna Traseira", id: "#1001", date: "08/01/2026", user: "Vinicius Melo" },
                    { title: "Pastilha de Freio Dianteira", id: "#1004", date: "07/01/2026", user: "Isabela Costa", chatId: "2" }
                ]} />
                <KanbanColumn title="Cancelado" count={33} color="slate" cards={[
                    { title: "Tulipa Câmbio", id: "#1003", date: "07/01/2026", user: "Lucas Ribeiro", verified: true },
                    { title: "Retrovisor Esquerdo", id: "#1005", date: "06/01/2026", user: "Vinicius Melo", verified: true }
                ]} />
                <KanbanColumn title="Deal" count={39} color="primary" cards={[
                    { title: "Alternador", id: "#1000", date: "09/01/2026", user: "Renata Moura" },
                    { title: "Difusor de Ar", id: "#1000", date: "09/01/2026", user: "Renata Moura", verified: true }
                ]} />
            </div>
        </main>
    );
}