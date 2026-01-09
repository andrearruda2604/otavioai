import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, Profile, AuthContextType, UserProfile } from '../types/authTypes';

// Dados mockados para fallback (quando Supabase não está configurado)
const mockUsers: User[] = [
    { id: '1', name: 'Andre Arruda', email: 'admin@octavio.ai', profile: 'admin', status: 'Ativo', createdAt: '09/01/2026' },
    { id: '2', name: 'Maria Cruz', email: 'maria@wgabrasil.com.br', profile: 'tecnico', status: 'Ativo', createdAt: '19/12/2025' },
    { id: '3', name: 'Jose da Silva', email: 'josedasilva@wgabrasil.com', profile: 'tecnico', status: 'Inativo', createdAt: '19/12/2025' },
];

const mockPasswords: Record<string, string> = {
    'admin@octavio.ai': 'admin123',
    'maria@wgabrasil.com.br': 'tecnico123',
    'josedasilva@wgabrasil.com': 'tecnico123',
};

const mockProfiles: Profile[] = [
    { id: '1', name: 'admin', description: 'Administrador do sistema - acesso total', isSystem: true, permissionsCount: 11 },
    { id: '2', name: 'tecnico', description: 'Técnico de campo - acesso básico', isSystem: true, permissionsCount: 6 },
    { id: '3', name: 'gerente', description: 'Gerente de equipe - acesso intermediário', isSystem: true, permissionsCount: 8 },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>(mockProfiles);
    const [loading, setLoading] = useState(true);

    // Buscar perfil do usuário no Supabase
    const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', supabaseUser.id)
                .single();

            if (error || !data) {
                console.error('Error fetching profile:', error);
                return null;
            }

            return {
                id: data.id,
                name: data.name,
                email: supabaseUser.email || '',
                profile: data.role as UserProfile,
                status: data.status,
                createdAt: new Date(data.created_at).toLocaleDateString('pt-BR'),
            };
        } catch (err) {
            console.error('Error in fetchUserProfile:', err);
            return null;
        }
    };

    // Buscar todos os usuários (para gestão)
    const fetchAllUsers = async () => {
        if (!isSupabaseConfigured()) {
            setUsers(mockUsers);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching users:', error);
                setUsers([]);
                return;
            }

            // Buscar emails dos usuários via função RPC ou view
            // Por enquanto, usamos o nome como identificador
            const mappedUsers: User[] = data.map((profile: any) => ({
                id: profile.id,
                name: profile.name,
                email: profile.name.toLowerCase().replace(/\s/g, '.') + '@email.com', // Placeholder
                profile: profile.role as UserProfile,
                status: profile.status,
                createdAt: new Date(profile.created_at).toLocaleDateString('pt-BR'),
            }));

            setUsers(mappedUsers);
        } catch (err) {
            console.error('Error in fetchAllUsers:', err);
            setUsers([]);
        }
    };

    // Buscar perfis de acesso
    const fetchAccessProfiles = async () => {
        if (!isSupabaseConfigured()) {
            setProfiles(mockProfiles);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('access_profiles')
                .select('*')
                .order('name');

            if (error) {
                console.error('Error fetching access profiles:', error);
                return;
            }

            const mappedProfiles: Profile[] = data.map((p: any) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                isSystem: p.is_system,
                permissionsCount: p.permissions_count,
            }));

            setProfiles(mappedProfiles);
        } catch (err) {
            console.error('Error in fetchAccessProfiles:', err);
        }
    };

    // Inicialização e listener de auth
    useEffect(() => {
        if (!isSupabaseConfigured()) {
            // Modo mock
            const savedUser = localStorage.getItem('octavio_user');
            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }
            setUsers(mockUsers);
            setProfiles(mockProfiles);
            setLoading(false);
            return;
        }

        // Modo Supabase
        const initAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                const profile = await fetchUserProfile(session.user);
                setUser(profile);
            }

            await fetchAllUsers();
            await fetchAccessProfiles();
            setLoading(false);
        };

        initAuth();

        // Listener para mudanças de auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const profile = await fetchUserProfile(session.user);
                setUser(profile);
                await fetchAllUsers();
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Login
    const login = async (email: string, password: string): Promise<boolean> => {
        if (!isSupabaseConfigured()) {
            // Modo mock
            const foundUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (foundUser && mockPasswords[foundUser.email] === password) {
                if (foundUser.status === 'Inativo') return false;
                setUser(foundUser);
                localStorage.setItem('octavio_user', JSON.stringify(foundUser));
                return true;
            }
            return false;
        }

        // Modo Supabase
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('Login error:', error.message);
                return false;
            }

            if (data.user) {
                const profile = await fetchUserProfile(data.user);
                if (profile?.status === 'Inativo') {
                    await supabase.auth.signOut();
                    return false;
                }
                setUser(profile);
                return true;
            }

            return false;
        } catch (err) {
            console.error('Login error:', err);
            return false;
        }
    };

    // Logout
    const logout = async () => {
        if (!isSupabaseConfigured()) {
            setUser(null);
            localStorage.removeItem('octavio_user');
            return;
        }

        await supabase.auth.signOut();
        setUser(null);
    };

    // Atualizar perfil do usuário
    const updateUserProfile = async (userId: string, profile: UserProfile) => {
        if (!isSupabaseConfigured()) {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, profile } : u));
            return;
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: profile })
                .eq('id', userId);

            if (error) {
                console.error('Error updating profile:', error);
                return;
            }

            // Atualizar lista local
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, profile } : u));
        } catch (err) {
            console.error('Error in updateUserProfile:', err);
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isAdmin: user?.profile === 'admin',
        login,
        logout,
        users,
        profiles,
        updateUserProfile,
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-dark">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};
