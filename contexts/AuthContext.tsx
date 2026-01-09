import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, Profile, AuthContextType, UserProfile, UserStatus, MenuPermissions, defaultPermissions } from '../types/authTypes';

// Dados mockados para fallback
const mockUsers: User[] = [
    { id: '1', name: 'Admin', email: 'admin@otavio.ai', profile: 'admin', status: 'Ativo', createdAt: '09/01/2026' },
    { id: '2', name: 'Maria Cruz', email: 'maria@empresa.com.br', profile: 'tecnico', status: 'Ativo', createdAt: '19/12/2025' },
    { id: '3', name: 'Jose Silva', email: 'jose@empresa.com', profile: 'tecnico', status: 'Pendente', createdAt: '19/12/2025' },
];

const mockPasswords: Record<string, string> = {
    'admin@otavio.ai': 'admin123',
    'maria@empresa.com.br': 'tecnico123',
};

const mockProfiles: Profile[] = [
    { id: '1', name: 'admin', description: 'Administrador do sistema - acesso total', isSystem: true, permissionsCount: 7, permissions: { dashboard: true, insights: true, pipeline: true, chat: true, leads: true, knowledge: true, users: true } },
    { id: '2', name: 'tecnico', description: 'Técnico de campo - acesso básico', isSystem: true, permissionsCount: 4, permissions: { dashboard: true, insights: false, pipeline: false, chat: true, leads: true, knowledge: true, users: false } },
    { id: '3', name: 'gerente', description: 'Gerente de equipe - acesso intermediário', isSystem: true, permissionsCount: 6, permissions: { dashboard: true, insights: true, pipeline: true, chat: true, leads: true, knowledge: true, users: false } },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>(mockProfiles);
    const [showDeleted, setShowDeleted] = useState(false);
    const [loading, setLoading] = useState(true);

    const getUserPermissions = (): MenuPermissions | null => {
        if (!user) return null;
        const profile = profiles.find(p => p.name === user.profile);
        return profile?.permissions || defaultPermissions;
    };

    // Buscar perfil do usuário
    const fetchUserProfile = async (supabaseUser: any): Promise<User | null> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', supabaseUser.id)
                .single();

            if (error || !data) return null;

            return {
                id: data.id,
                name: data.name,
                email: supabaseUser.email || '',
                profile: data.role as UserProfile,
                status: data.status as UserStatus,
                createdAt: new Date(data.created_at).toLocaleDateString('pt-BR'),
                deletedAt: data.deleted_at,
                approvedBy: data.approved_by,
                approvedAt: data.approved_at,
            };
        } catch (err) {
            return null;
        }
    };

    // Buscar todos os usuários
    const fetchAllUsers = async () => {
        if (!isSupabaseConfigured()) {
            setUsers(mockUsers);
            return;
        }

        try {
            let query = supabase.from('profiles').select('*');

            if (!showDeleted) {
                query = query.is('deleted_at', null);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) {
                setUsers([]);
                return;
            }

            const mappedUsers: User[] = data.map((profile: any) => ({
                id: profile.id,
                name: profile.name,
                email: profile.email || `${profile.name.toLowerCase().replace(/\s/g, '.')}@email.com`,
                profile: profile.role as UserProfile,
                status: profile.status as UserStatus,
                createdAt: new Date(profile.created_at).toLocaleDateString('pt-BR'),
                deletedAt: profile.deleted_at,
                approvedBy: profile.approved_by,
                approvedAt: profile.approved_at,
            }));

            setUsers(mappedUsers);
        } catch (err) {
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
            const { data, error } = await supabase.from('access_profiles').select('*').order('name');

            if (error) return;

            const mappedProfiles: Profile[] = data.map((p: any) => ({
                id: p.id,
                name: p.name,
                description: p.description || '',
                isSystem: p.is_system,
                permissionsCount: p.permissions ? Object.values(p.permissions).filter(Boolean).length : 0,
                permissions: p.permissions || defaultPermissions,
            }));

            setProfiles(mappedProfiles);
        } catch (err) {
            console.error('Error fetching profiles:', err);
        }
    };

    // Inicialização
    useEffect(() => {
        if (!isSupabaseConfigured()) {
            const savedUser = localStorage.getItem('otavio_user');
            if (savedUser) setUser(JSON.parse(savedUser));
            setUsers(mockUsers);
            setProfiles(mockProfiles);
            setLoading(false);
            return;
        }

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

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const profile = await fetchUserProfile(session.user);
                setUser(profile);
                await fetchAllUsers();
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        fetchAllUsers();
    }, [showDeleted]);

    // Login
    const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
        if (!isSupabaseConfigured()) {
            const foundUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (foundUser && mockPasswords[foundUser.email] === password) {
                if (foundUser.status === 'Pendente') return { success: false, message: 'Sua conta está aguardando aprovação.' };
                if (foundUser.status === 'Inativo') return { success: false, message: 'Sua conta foi desativada.' };
                setUser(foundUser);
                localStorage.setItem('otavio_user', JSON.stringify(foundUser));
                return { success: true, message: '' };
            }
            return { success: false, message: 'Email ou senha inválidos.' };
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { success: false, message: error.message };

            if (data.user) {
                const profile = await fetchUserProfile(data.user);
                if (profile?.status === 'Pendente') {
                    await supabase.auth.signOut();
                    return { success: false, message: 'Sua conta está aguardando aprovação de um administrador.' };
                }
                if (profile?.status === 'Inativo') {
                    await supabase.auth.signOut();
                    return { success: false, message: 'Sua conta foi desativada. Entre em contato com o administrador.' };
                }
                setUser(profile);
                return { success: true, message: '' };
            }
            return { success: false, message: 'Erro desconhecido.' };
        } catch (err) {
            return { success: false, message: 'Erro ao fazer login.' };
        }
    };

    // Signup
    const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; message: string }> => {
        if (!isSupabaseConfigured()) {
            const newUser: User = {
                id: String(mockUsers.length + 1),
                name,
                email,
                profile: 'tecnico',
                status: 'Pendente',
                createdAt: new Date().toLocaleDateString('pt-BR'),
            };
            mockUsers.push(newUser);
            return { success: true, message: '' };
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { name, role: 'tecnico' } }
            });

            if (error) return { success: false, message: error.message };
            await supabase.auth.signOut();
            return { success: true, message: '' };
        } catch (err) {
            return { success: false, message: 'Erro ao criar conta.' };
        }
    };

    // Logout
    const logout = async () => {
        if (!isSupabaseConfigured()) {
            setUser(null);
            localStorage.removeItem('otavio_user');
            return;
        }
        await supabase.auth.signOut();
        setUser(null);
    };

    // Criar usuário (admin)
    const createUser = async (email: string, password: string, name: string, role: UserProfile): Promise<boolean> => {
        if (!isSupabaseConfigured()) {
            const newUser: User = {
                id: String(mockUsers.length + 1),
                name,
                email,
                profile: role,
                status: 'Ativo',
                createdAt: new Date().toLocaleDateString('pt-BR'),
            };
            mockUsers.push(newUser);
            setUsers([...mockUsers]);
            return true;
        }

        try {
            const { data, error } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name, role }
            });

            if (error) {
                // Fallback: usar signup normal
                const { error: signupError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { name, role } }
                });
                if (signupError) return false;
            }

            await fetchAllUsers();
            return true;
        } catch (err) {
            return false;
        }
    };

    // Atualizar perfil do usuário
    const updateUserProfile = async (userId: string, profile: UserProfile): Promise<boolean> => {
        if (!isSupabaseConfigured()) {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, profile } : u));
            return true;
        }

        try {
            const { error } = await supabase.from('profiles').update({ role: profile }).eq('id', userId);
            if (error) return false;
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, profile } : u));
            return true;
        } catch (err) {
            return false;
        }
    };

    // Atualizar status do usuário
    const updateUserStatus = async (userId: string, status: UserStatus): Promise<boolean> => {
        if (!isSupabaseConfigured()) {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
            return true;
        }

        try {
            const { error } = await supabase.from('profiles').update({ status }).eq('id', userId);
            if (error) return false;
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
            return true;
        } catch (err) {
            return false;
        }
    };

    // Soft delete usuário
    const deleteUser = async (userId: string): Promise<boolean> => {
        if (!isSupabaseConfigured()) {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, deletedAt: new Date().toISOString() } : u));
            return true;
        }

        try {
            const { error } = await supabase.from('profiles').update({ deleted_at: new Date().toISOString() }).eq('id', userId);
            if (error) return false;
            await fetchAllUsers();
            return true;
        } catch (err) {
            return false;
        }
    };

    // Restaurar usuário
    const restoreUser = async (userId: string): Promise<boolean> => {
        if (!isSupabaseConfigured()) {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, deletedAt: null } : u));
            return true;
        }

        try {
            const { error } = await supabase.from('profiles').update({ deleted_at: null }).eq('id', userId);
            if (error) return false;
            await fetchAllUsers();
            return true;
        } catch (err) {
            return false;
        }
    };

    // Aprovar usuário
    const approveUser = async (userId: string): Promise<boolean> => {
        if (!isSupabaseConfigured()) {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'Ativo' as UserStatus, approvedBy: user?.id, approvedAt: new Date().toISOString() } : u));
            return true;
        }

        try {
            const { error } = await supabase.from('profiles').update({
                status: 'Ativo',
                approved_by: user?.id,
                approved_at: new Date().toISOString()
            }).eq('id', userId);
            if (error) return false;
            await fetchAllUsers();
            return true;
        } catch (err) {
            return false;
        }
    };

    // Criar perfil de acesso
    const createProfile = async (name: string, description: string, permissions: MenuPermissions): Promise<boolean> => {
        if (!isSupabaseConfigured()) {
            const newProfile: Profile = {
                id: String(profiles.length + 1),
                name,
                description,
                isSystem: false,
                permissionsCount: Object.values(permissions).filter(Boolean).length,
                permissions,
            };
            setProfiles(prev => [...prev, newProfile]);
            return true;
        }

        try {
            const { error } = await supabase.from('access_profiles').insert({
                name,
                description,
                is_system: false,
                permissions,
                permissions_count: Object.values(permissions).filter(Boolean).length
            });
            if (error) return false;
            await fetchAccessProfiles();
            return true;
        } catch (err) {
            return false;
        }
    };

    // Atualizar perfil de acesso
    const updateProfile = async (id: string, name: string, description: string, permissions: MenuPermissions): Promise<boolean> => {
        if (!isSupabaseConfigured()) {
            setProfiles(prev => prev.map(p => p.id === id ? {
                ...p,
                name,
                description,
                permissions,
                permissionsCount: Object.values(permissions).filter(Boolean).length
            } : p));
            return true;
        }

        try {
            const { error } = await supabase.from('access_profiles').update({
                name,
                description,
                permissions,
                permissions_count: Object.values(permissions).filter(Boolean).length
            }).eq('id', id);
            if (error) return false;
            await fetchAccessProfiles();
            return true;
        } catch (err) {
            return false;
        }
    };

    const refreshUsers = async () => { await fetchAllUsers(); };
    const refreshProfiles = async () => { await fetchAccessProfiles(); };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isAdmin: user?.profile === 'admin',
        isManager: user?.profile === 'admin' || user?.profile === 'gerente',
        permissions: getUserPermissions(),
        login,
        signup,
        logout,
        users,
        profiles,
        showDeleted,
        setShowDeleted,
        createUser,
        updateUserProfile,
        updateUserStatus,
        deleteUser,
        restoreUser,
        approveUser,
        createProfile,
        updateProfile,
        refreshUsers,
        refreshProfiles,
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

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    return context;
};
