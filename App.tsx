import React, { useState } from 'react';
import { HashRouter, Routes, Route, useLocation, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { hasPermission } from './lib/permissions';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import DashboardPage from './pages/Dashboard';
import InsightsPage from './pages/Insights';
import PipelinePage from './pages/Pipeline';
import ChatPage from './pages/Chat';
import LeadsPage from './pages/Leads';
import KnowledgePage from './pages/Knowledge';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import UserManagementPage from './pages/UserManagement';
import ForgotPasswordPage from './pages/ForgotPassword';
import UpdatePasswordPage from './pages/UpdatePassword';
import PendingApprovalPage from './pages/PendingApproval';

const MobileHeader = ({ onMenuClick }: { onMenuClick: () => void }) => {
    const { user } = useAuth();

    return (
        <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                    <span className="material-icons-round">menu</span>
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="material-icons-round text-white text-lg">smart_toy</span>
                    </div>
                    <span className="text-lg font-bold text-white">Num Chat AI</span>
                </div>
            </div>
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="material-icons-round text-primary text-sm">person</span>
            </div>
        </header>
    );
};

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const location = useLocation();
    const { user, logout, userPermissions } = useAuth();
    const isActive = (path: string) => location.pathname === path;
    const [isDark, setIsDark] = useState(false);

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

    // Todos os itens de navegação com suas respectivas chaves de permissão
    const allNavItems = [
        { path: '/dashboard', icon: 'dashboard', label: 'Dashboard', permKey: 'dashboard' },
        { path: '/insights', icon: 'insights', label: 'Insights', permKey: 'insights' },
        { path: '/pipeline', icon: 'account_tree', label: 'Pipeline', permKey: 'pipeline' },
        { path: '/chat', icon: 'chat', label: 'Chat', permKey: 'chat' },
        { path: '/leads', icon: 'people', label: 'Leads', permKey: 'leads' },
        { path: '/knowledge', icon: 'menu_book', label: 'Base de Conhecimento', permKey: 'knowledge' },
    ];

    const adminItems = [
        { path: '/users', icon: 'manage_accounts', label: 'Gestão de Usuários', permKey: 'users' },
    ];

    // Filtrar itens baseado em permissões do role_permissions
    const navItems = allNavItems.filter(item => hasPermission(userPermissions, item.permKey));
    const visibleAdminItems = adminItems.filter(item => hasPermission(userPermissions, item.permKey));

    const handleNavClick = () => {
        if (window.innerWidth < 1024) {
            onClose();
        }
    };

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-sidebar flex-shrink-0 flex flex-col border-r border-slate-800
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                h-screen
            `}>
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="material-icons-round text-white">smart_toy</span>
                        </div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Num Chat AI</h1>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <span className="material-icons-round">close</span>
                    </button>
                </div>
                <nav className="flex-1 px-4 mt-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={handleNavClick}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(item.path) ? 'sidebar-active text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <span className={`material-icons-round ${isActive(item.path) ? 'text-primary' : ''}`}>{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}

                    {/* Seção de Administração */}
                    {visibleAdminItems.length > 0 && (
                        <>
                            <div className="pt-4 pb-2 px-4">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Administração
                                </span>
                            </div>
                            {visibleAdminItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={handleNavClick}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(item.path) ? 'sidebar-active text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <span className={`material-icons-round ${isActive(item.path) ? 'text-primary' : ''}`}>{item.icon}</span>
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            ))}
                        </>
                    )}
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
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <span className="material-icons-round text-primary">person</span>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-semibold text-white truncate">{user?.name || 'Usuário'}</span>
                            <span className="text-xs text-slate-500 capitalize">{user?.roleName || 'Carregando...'}</span>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                            title="Sair"
                        >
                            <span className="material-icons-round text-lg">logout</span>
                        </button>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-[10px] text-slate-600 uppercase tracking-widest px-1">
                        <span>Versão 1.4.0</span>
                    </div>
                </div>
            </aside>
        </>
    );
};

function AppContent() {
    const { isAuthenticated, userPermissions, isPendingApproval } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const publicRoutes = ['/login', '/signup', '/forgot-password', '/update-password', '/pending-approval'];
    const isPublicRoute = publicRoutes.includes(location.pathname);

    // Show pending approval page if user tried to login with pending account
    if (isPendingApproval && location.pathname !== '/pending-approval') {
        return <Navigate to="/pending-approval" replace />;
    }

    if (!isAuthenticated && !isPublicRoute) {
        return <Navigate to="/login" replace />;
    }

    if (isAuthenticated && isPublicRoute && location.pathname !== '/update-password') {
        return <Navigate to="/dashboard" replace />;
    }

    if (isPublicRoute) {
        return (
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/update-password" element={<UpdatePasswordPage />} />
                <Route path="/pending-approval" element={<PendingApprovalPage />} />
            </Routes>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-background-light dark:bg-background-dark pt-14 lg:pt-0">
                <Routes>
                    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                    <Route path="/insights" element={
                        hasPermission(userPermissions, 'insights') ? <ProtectedRoute><InsightsPage /></ProtectedRoute> : <Navigate to="/dashboard" replace />
                    } />
                    <Route path="/pipeline" element={
                        hasPermission(userPermissions, 'pipeline') ? <ProtectedRoute><PipelinePage /></ProtectedRoute> : <Navigate to="/dashboard" replace />
                    } />
                    <Route path="/chat" element={
                        hasPermission(userPermissions, 'chat') ? <ProtectedRoute><ChatPage /></ProtectedRoute> : <Navigate to="/dashboard" replace />
                    } />
                    <Route path="/leads" element={
                        hasPermission(userPermissions, 'leads') ? <ProtectedRoute><LeadsPage /></ProtectedRoute> : <Navigate to="/dashboard" replace />
                    } />
                    <Route path="/knowledge" element={
                        hasPermission(userPermissions, 'knowledge') ? <ProtectedRoute><KnowledgePage /></ProtectedRoute> : <Navigate to="/dashboard" replace />
                    } />
                    <Route path="/users" element={
                        hasPermission(userPermissions, 'users') ? <AdminRoute><UserManagementPage /></AdminRoute> : <Navigate to="/dashboard" replace />
                    } />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <HashRouter>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </HashRouter>
    );
}