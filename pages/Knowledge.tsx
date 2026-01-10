import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AiSettings {
    max_discount_margin: number;
    tone_of_voice: 'friendly' | 'technical' | 'formal';
    system_prompt: string;
}

export default function KnowledgePage() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<AiSettings>({
        max_discount_margin: 10,
        tone_of_voice: 'friendly',
        system_prompt: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!user) return;
        fetchSettings();
    }, [user]);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('ai_settings')
                .select('*')
                .eq('user_id', user?.id)
                .single();

            if (data) {
                setSettings({
                    max_discount_margin: data.max_discount_margin,
                    tone_of_voice: data.tone_of_voice,
                    system_prompt: data.system_prompt
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const { error } = await supabase.from('ai_settings').upsert({
                user_id: user?.id,
                ...settings,
                updated_at: new Date().toISOString()
            });

            if (error) throw error;
            setMessage('Configurações salvas com sucesso!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage('Erro ao salvar configurações.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Carregando configurações...</div>;

    return (
        <main className="p-8 max-w-4xl mx-auto">
            <header className="mb-8">
                <h2 className="text-3xl font-bold dark:text-white">Configurações da IA</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Personalize o comportamento e os limites do seu agente</p>
            </header>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Margem de Desconto */}
                <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <span className="material-icons-round">payments</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg dark:text-white mb-2">Margem de Negociação</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                Defina até quanto a IA pode oferecer de desconto sem precisar de aprovação humana.
                            </p>

                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="0"
                                    max="50"
                                    value={settings.max_discount_margin}
                                    onChange={(e) => setSettings({ ...settings, max_discount_margin: parseInt(e.target.value) })}
                                    className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg font-bold text-slate-900 dark:text-white min-w-[4rem] text-center">
                                    {settings.max_discount_margin}%
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-slate-400 mt-2">
                                <span>0% (Sem desconto)</span>
                                <span>50% (Risco alto)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tom de Voz */}
                <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <span className="material-icons-round">record_voice_over</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg dark:text-white mb-2">Personalidade</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                Como o agente deve se comunicar com os clientes.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { id: 'friendly', label: 'Amigável', icon: 'sentiment_satisfied', desc: 'Empático e informal' },
                                    { id: 'technical', label: 'Técnico', icon: 'build', desc: 'Direto e preciso' },
                                    { id: 'formal', label: 'Formal', icon: 'business_center', desc: 'Sério e corporativo' }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setSettings({ ...settings, tone_of_voice: opt.id as any })}
                                        className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${settings.tone_of_voice === opt.id
                                                ? 'border-primary bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-slate-100 dark:border-slate-700 hover:border-blue-200'
                                            }`}
                                    >
                                        <span className={`material-icons-round mb-2 ${settings.tone_of_voice === opt.id ? 'text-primary' : 'text-slate-400'}`}>{opt.icon}</span>
                                        <span className={`font-semibold ${settings.tone_of_voice === opt.id ? 'text-primary dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>{opt.label}</span>
                                        <span className="text-xs text-slate-500 mt-1">{opt.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Prompt */}
                <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <span className="material-icons-round">psychology</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg dark:text-white mb-2">Instruções de Especialidade</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                Prompt do sistema para definir conhecimentos específicos (ex: "Especialista em peças Fiat").
                            </p>
                            <textarea
                                value={settings.system_prompt}
                                onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
                                placeholder="Ex: Você é um especialista em autopeças com foco em linha pesada Scania e Volvo. Sempre verifique o part number antes de confirmar disponibilidade..."
                                className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none dark:text-white resize-none"
                            ></textarea>
                            <div className="flex justify-end mt-2">
                                <span className="text-xs text-slate-400">{settings.system_prompt.length}/500 caracteres</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4">
                    {message && (
                        <span className={`text-sm ${message.includes('Erro') ? 'text-rose-500' : 'text-emerald-500'} font-medium animate-fade-in`}>
                            {message}
                        </span>
                    )}
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Salvando...
                            </>
                        ) : (
                            <>
                                <span className="material-icons-round">save</span>
                                Salvar Alterações
                            </>
                        )}
                    </button>
                </div>
            </form>
        </main>
    );
}