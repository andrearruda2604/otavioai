import React from 'react';
import { Lead } from '../types';

const leads: Lead[] = [
    { name: "Ana Souza", company: "Auto Peças Central", whatsapp: "+55 11 99999-1001", status: "Ativo" },
    { name: "Bruno Lima", company: "Desmonte Nova Era", whatsapp: "+55 11 99999-1002", status: "Ativo" },
    { name: "Diego Rocha", company: "Ferro Velho Cardoso", whatsapp: "+55 11 99999-1004", status: "Inativo" },
    { name: "Felipe Andrade", company: "Conecta Auto Peças", whatsapp: "+55 11 99999-1006", status: "Em Contato" }
];

export default function LeadsPage() {
    return (
        <main className="p-8">
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Leads</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie sua base de clientes e prospecções</p>
                    </div>
                    <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm hover:bg-blue-600 transition-colors">
                        <span className="material-icons-round text-sm">add</span>
                        Novo Lead
                    </button>
                </div>
            </div>
            <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 mb-6">
                <div className="relative w-full max-w-md">
                    <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input className="w-full pl-10 pr-4 py-2.5 bg-background-light dark:bg-background-dark border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:text-white" placeholder="Buscar por nome ou empresa..." type="text"/>
                </div>
            </div>
            <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                <th className="px-6 py-4">Nome</th>
                                <th className="px-6 py-4">Empresa</th>
                                <th className="px-6 py-4">WhatsApp</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {leads.map((lead, i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-semibold dark:text-slate-200">{lead.name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{lead.company}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                            <span className="text-sm font-mono">{lead.whatsapp}</span>
                                            <span className="material-icons-round text-sm text-slate-400 cursor-pointer hover:text-primary">content_copy</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                            ${lead.status === 'Ativo' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                                              lead.status === 'Inativo' ? 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300' : 
                                              'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button className="text-slate-400 hover:text-primary"><span className="material-icons-round">more_vert</span></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    <span>Mostrando 4 de 42 resultados</span>
                    <div className="flex gap-2">
                        <button className="p-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"><span className="material-icons-round text-sm">chevron_left</span></button>
                        <button className="p-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"><span className="material-icons-round text-sm">chevron_right</span></button>
                    </div>
                </div>
            </div>
        </main>
    );
}