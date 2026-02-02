import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);
            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Erro ao fazer login. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 p-12 flex-col justify-between relative overflow-hidden">
                {/* Background decorations */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <span className="material-icons-round text-white text-2xl">smart_toy</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white">Num Chat AI</h1>
                    </div>
                </div>

                <div className="relative z-10 space-y-6">
                    <h2 className="text-4xl font-bold text-white leading-tight">
                        Inteligência Artificial<br />
                        para Autopeças
                    </h2>
                    <p className="text-lg text-white/80 max-w-md">
                        Transforme conversas em vendas, com dados, atendimento humanizado e imediato
                    </p>
                    <div className="flex items-center gap-6 text-white/60 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="material-icons-round text-lg">trending_up</span>
                            <span>+40% conversão</span>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-white/40 text-sm">
                    © 2026 Otavio AI. Todos os direitos reservados.
                </div>
            </div>

            {/* Right side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background-light dark:bg-background-dark">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="material-icons-round text-white text-2xl">smart_toy</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Num Chat AI</h1>
                    </div>

                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Bem-vindo de volta
                        </h2>
                        <p className="mt-2 text-slate-600 dark:text-slate-400">
                            Entre com suas credenciais para acessar a plataforma
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                                    <span className="material-icons-round text-lg">error</span>
                                    {error}
                                </p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons-round text-slate-400 text-xl">
                                        email
                                    </span>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        placeholder="seu@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Senha
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-icons-round text-slate-400 text-xl">
                                        lock
                                    </span>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary" />
                                <span className="text-sm text-slate-600 dark:text-slate-400">Lembrar de mim</span>
                            </label>
                            <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80 font-medium">
                                Esqueceu a senha?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="material-icons-round animate-spin">autorenew</span>
                                    Entrando...
                                </>
                            ) : (
                                <>
                                    Entrar
                                    <span className="material-icons-round">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center">
                        <p className="text-slate-500 dark:text-slate-400">
                            Não tem uma conta?{' '}
                            <Link to="/signup" className="text-primary hover:text-primary/80 font-medium">
                                Criar conta
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
