import React from 'react';

export default function KnowledgePage() {
    return (
        <main className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <span className="material-icons-round text-6xl text-slate-300 dark:text-slate-600">menu_book</span>
            </div>
            <h2 className="text-2xl font-bold mb-2 dark:text-white">Base de Conhecimento</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md">
                Módulo em desenvolvimento. Aqui você poderá gerenciar os manuais e dados que treinam sua IA para obter respostas mais precisas.
            </p>
            <button className="mt-8 px-6 py-2 bg-primary text-white rounded-lg font-medium shadow-lg shadow-primary/30 hover:bg-blue-600 transition-all">
                Saiba mais
            </button>
        </main>
    );
}