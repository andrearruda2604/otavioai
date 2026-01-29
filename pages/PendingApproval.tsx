import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PendingApprovalPage() {
    const { logout } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
            <div className="w-full max-w-md bg-white dark:bg-card-dark p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-center">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-icons-round text-amber-600 dark:text-amber-400 text-3xl">hourglass_empty</span>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                    Conta Aguardando Aprovação
                </h2>

                <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Seu cadastro foi realizado com sucesso! No entanto, sua conta precisa ser aprovada por um administrador antes que você possa acessar o sistema.
                </p>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                        <span className="font-semibold">O que acontece agora?</span>
                        <br />
                        Um administrador será notificado sobre seu cadastro e irá revisar suas informações. Você receberá acesso assim que sua conta for ativada.
                    </p>
                </div>

                <div className="space-y-3">
                    <Link
                        to="/login"
                        className="block w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors"
                    >
                        Voltar para Login
                    </Link>

                    <button
                        onClick={logout}
                        className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-icons-round text-lg">logout</span>
                        Sair
                    </button>
                </div>
            </div>
        </div>
    );
}
