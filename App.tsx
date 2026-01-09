import React, { useState } from 'react';
import { HashRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import DashboardPage from './pages/Dashboard';
import InsightsPage from './pages/Insights';
import PipelinePage from './pages/Pipeline';
import ChatPage from './pages/Chat';
import LeadsPage from './pages/Leads';
import KnowledgePage from './pages/Knowledge';

const Sidebar = () => {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;
    const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

    const toggleDarkMode = () => {
        const isCurrentlyDark = document.documentElement.classList.contains('dark');
        if (isCurrentlyDark) {
            document.documentElement.classList.remove('dark');
            setIsDark(false);
        } else {
            document.documentElement.classList.add('dark');
            setIsDark(true);
        }
    };

    const navItems = [
        { path: '/', icon: 'dashboard', label: 'Dashboard' },
        { path: '/insights', icon: 'insights', label: 'Insights' },
        { path: '/pipeline', icon: 'account_tree', label: 'Pipeline' },
        { path: '/chat', icon: 'chat', label: 'Chat' },
        { path: '/leads', icon: 'people', label: 'Leads' },
        { path: '/knowledge', icon: 'menu_book', label: 'Base de Conhecimento' },
    ];

    return (
        <aside className="w-64 bg-sidebar flex-shrink-0 flex flex-col border-r border-slate-800 hidden lg:flex h-screen sticky top-0">
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="material-icons-round text-white">smart_toy</span>
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">Octavio AI</h1>
            </div>
            <nav className="flex-1 px-4 mt-4 space-y-1">
                {navItems.map((item) => (
                    <Link 
                        key={item.path}
                        to={item.path} 
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(item.path) ? 'sidebar-active text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <span className={`material-icons-round ${isActive(item.path) ? 'text-primary' : ''}`}>{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                    </Link>
                ))}
            </nav>
            <div className="p-6 mt-auto">
                <button 
                    onClick={toggleDarkMode}
                    className="w-full mb-4 flex items-center justify-center gap-2 py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-slate-300 hover:text-white"
                >
                    <span className="material-icons-round text-lg">
                        {isDark ? 'light_mode' : 'dark_mode'}
                    </span>
                    <span className="text-sm font-medium">
                        {isDark ? 'Modo Claro' : 'Modo Escuro'}
                    </span>
                </button>

                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <img alt="Avatar" className="w-10 h-10 rounded-full border border-white/10 object-cover" src="https://picsum.photos/id/64/100/100"/>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">Ricardo S.</span>
                        <span className="text-xs text-slate-500">Administrador</span>
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-[10px] text-slate-600 uppercase tracking-widest px-1">
                    <span>Versão 1.2.0</span>
                </div>
            </div>
        </aside>
    );
};

export default function App() {
  return (
    <HashRouter>
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-background-light dark:bg-background-dark">
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/insights" element={<InsightsPage />} />
                    <Route path="/pipeline" element={<PipelinePage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/leads" element={<LeadsPage />} />
                    <Route path="/knowledge" element={<KnowledgePage />} />
                </Routes>
            </div>
        </div>
    </HashRouter>
  );
}