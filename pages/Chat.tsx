import React from 'react';
import { ChatMessage } from '../types';

const ChatStat: React.FC<{ label: string; value: string; icon: string; color: string }> = ({ label, value, icon, color }) => (
    <div className={`bg-white dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-start`}>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <h3 className="text-4xl font-bold mt-2 dark:text-white">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-600 dark:text-${color}-400`}>
            <span className="material-icons-round">{icon}</span>
        </div>
    </div>
);

const ChatItem: React.FC<ChatMessage> = ({ name, company, msg, time, initials, color, online, unread }) => (
    <div className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
        <div className="flex items-center gap-4">
            <div className="relative">
                <div className={`w-12 h-12 rounded-full bg-${color}-100 dark:bg-${color}-900/40 flex items-center justify-center text-${color}-700 dark:text-${color}-300 font-bold text-lg`}>{initials}</div>
                {online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-card-dark rounded-full"></div>}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                    <h4 className="font-semibold text-slate-900 dark:text-white truncate">{name}</h4>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{time}</span>
                </div>
                <p className="text-xs font-medium text-primary mb-1">{company}</p>
                <p className={`text-sm ${unread ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'} truncate`}>{msg}</p>
            </div>
            {unread && <div className="w-2 h-2 bg-primary rounded-full"></div>}
        </div>
    </div>
);

export default function ChatPage() {
    return (
        <main className="p-8">
            <header className="mb-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-bold dark:text-white">Chat</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Acompanhe as conversas do agente com os clientes</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium dark:text-slate-200">Hoje</button>
                        <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium shadow-sm">Mês atual</button>
                    </div>
                </div>
            </header>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <ChatStat label="Contatos" value="12" icon="groups" color="blue" />
                <ChatStat label="Mensagens" value="191" icon="forum" color="emerald" />
                <ChatStat label="Tempo Médio" value="7 min" icon="timer" color="orange" />
            </section>
            <section className="bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative max-w-md">
                        <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:text-white" placeholder="Buscar conversas..." type="text"/>
                    </div>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    <ChatItem name="Ana Souza" company="Auto Peças Central" msg="Olá, você tem o farol esquerdo do Gol 2019?" time="06:55" initials="AS" color="indigo" online />
                    <ChatItem name="Henrique Silva" company="Marinho & Filhos" msg="Preciso do número do pedido para rastreamento" time="21:55" initials="HS" color="amber" />
                    <ChatItem name="Isabela Costa" company="Nevada Eco Peças" msg="Tem previsão de chegada do radiador Honda?" time="17:55" initials="IC" color="emerald" />
                    <ChatItem name="Elisa Martins" company="Via Auto Peças" msg="Vocês trabalham com peças de linha pesada?" time="Ontem" initials="EM" color="rose" unread />
                </div>
            </section>
        </main>
    );
}