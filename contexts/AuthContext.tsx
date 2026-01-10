import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, Role, AuthContextType, UserStatus, defaultPermissions } from '../types/authTypes';

// Dados mockados para fallback
const mockUsers: User[] = [
    { id: '1', name: 'Admin', email: 'admin@otavio.ai', role_id: '1', roleName: 'admin', status: 'Ativo', createdAt: '09/01/2026' },
    { id: '2', name: 'Maria Cruz', email: 'maria@empresa.com.br', role_id: '3', roleName: 'tecnico', status: 'Ativo', createdAt: '19/12/2025' },
    { id: '3', name: 'Jose Silva', email: 'jose@empresa.com', role_id: '3', roleName: 'tecnico', status: 'Pendente', createdAt: '19/12/2025' },
];

const mockPasswords: Record<string, string> = {
    'admin@otavio.ai': 'admin123',
    'maria@empresa.com.br': 'tecnico123',
};

const mockRoles: Role[] = [
    { id: '1', name: 'admin', description: 'Administrador do sistema - acesso total', isSystem: true },
    { id: '2', name: 'gerente', description: 'Gerente de equipe - acesso intermediário', isSystem: true },
    { id: '3', name: 'tecnico', description: 'Técnico de campo - acesso básico', isSystem: true },
];

const mockPermissions: Record<string, string[]> = {
    'admin': ['dashboard', 'insights', 'pipeline', 'chat', 'leads', 'knowledge', 'users'],
    'gerente': ['dashboard', 'insights', 'pipeline', 'chat', 'leads', 'knowledge'],
    'tecnico': ['dashboard', 'chat', 'leads', 'knowledge'],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>(mockRoles);
    const [userPermissions, setUserPermissions] = useState<string[]>([]);
    const [showDeleted, setShowDeleted] = useState(false);
    const [loading, setLoading] = useState(true);

    // Buscar permissões do usuário baseado no role_id
    const fetchUserPermissions = async (roleId: string | null): Promise<string[]> => {
        if (!roleId) return defaultPermissions;

        if (!isSupabaseConfigured()) {
            // Mock: encontrar role e retornar permissões
            const role = mockRoles.find(r => r.id === roleId);
            return role ? (mockPermissions[role.name] || defaultPermissions) : defaultPermissions;
        }

        try {
            const { data, error } = await supabase
                .from('role_permissions')
                .select('route_key')
                .eq('role_id', roleId);

            if (error || !data) return defaultPermissions;
            return data.map(p => p.route_key);
        } catch {
            return defaultPermissions;
        }
    };

    // Buscar perfil do usuário
    const fetchUserProfile = async (supabaseUser: any): Promise<User | null> => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    roles:role_id (
                        id,
                        name,
                        description
                    )
                `)
                .eq('id', supabaseUser.id)
                .single();

            if (error || !profile) return null;

            return {
                id: profile.id,
                name: profile.name,
                email: profile.email || supabaseUser.email || '',
                role_id: profile.role_id,
                roleName: profile.roles?.name || 'tecnico',
                status: profile.status as UserStatus,
                createdAt: new Date(profile.created_at).toLocaleDateString('pt-BR'),
                deletedAt: profile.deleted_at,
                approvedBy: profile.approved_by,
                approvedAt: profile.approved_at,
            };
        } catch {
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
            let query = supabase.from('profiles').select(`
                *,
                roles:role_id (
                    id,
                    name,
                    description
                )
            `);

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
                role_id: profile.role_id,
                roleName: profile.roles?.name || 'tecnico',
                status: profile.status as UserStatus,
                createdAt: new Date(profile.created_at).toLocaleDateString('pt-BR'),
                deletedAt: profile.deleted_at,
                approvedBy: profile.approved_by,
                approvedAt: profile.approved_at,
            }));

            setUsers(mappedUsers);
        } catch {
            setUsers([]);
        }
    };

    // Buscar roles
    const fetchRoles = async () => {
        if (!isSupabaseConfigured()) {
            setRoles(mockRoles);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('roles')
                .select('*')
                .order('name');

            if (error) return;

            const mappedRoles: Role[] = data.map((r: any) => ({
                id: r.id,
                name: r.name,
                description: r.description || '',
                isSystem: r.is_system,
                createdAt: r.created_at,
            }));

            setRoles(mappedRoles);
        } catch {
            console.error('Error fetching roles');
        }
    };

    // Inicialização
    useEffect(() => {
        if (!isSupabaseConfigured()) {
            const savedUser = localStorage.getItem('otavio_user');
            if (savedUser) {
                const parsedUser = JSON.parse(savedUser);
                setUser(parsedUser);
                const role = mockRoles.find(r => r.id === parsedUser.role_id);
                setUserPermissions(role ? (mockPermissions[role.name] || defaultPermissions) : defaultPermissions);
            }
            setUsers(mockUsers);
            setRoles(mockRoles);
            setLoading(false);
            return;
        }

        const initAuth = async () => {
            console.log('Auth: Starting initialization...');
            try {
                console.log('Auth: Checking session...');
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                console.log('Auth: Session check complete', { session: !!session, error: sessionError });

                if (sessionError) {
                    console.error('Session error:', sessionError);
                    setUsers(mockUsers);
                    setRoles(mockRoles);
                    setLoading(false);
                    return;
                }

                if (session?.user) {
                    console.log('Auth: User found, fetching profile...');
                    const profile = await fetchUserProfile(session.user);
                    if (profile) {
                        // Check if user is pending
                        if (profile.status === 'Pendente') {
                            console.log('Auth: User is pending, signing out...');
                            await supabase.auth.signOut();
                            setUsers(mockUsers);
                            setRoles(mockRoles);
                            setLoading(false);
                            return;
                        }

                        setUser(profile);
                        const permissions = await fetchUserPermissions(profile.role_id);
                        setUserPermissions(permissions);

                        // Fetch data only if authenticated and not pending
                        try {
                            console.log('Auth: Fetching users and roles...');
                            await Promise.all([fetchAllUsers(), fetchRoles()]);
                            console.log('Auth: Data fetch complete');
                        } catch (fetchError) {
                            console.error('Fetch error:', fetchError);
                        }
                    }
                } else {
                    console.log('Auth: No user session, skipping data fetch');
                }
            } catch (err) {
                console.error('Init auth error:', err);
                setUsers(mockUsers);
                setRoles(mockRoles);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            if (loading) {
                console.warn('Auth init timeout, using mock data');
                setUsers(mockUsers);
                setRoles(mockRoles);
                setLoading(false);
            }
        }, 10000);

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                console.log('Auth: Signed in, fetching data...');
                const profile = await fetchUserProfile(session.user);
                if (profile) {
                    // Check if user is pending
                    if (profile.status === 'Pendente') {
                        console.log('Auth: User is pending (onAuthStateChange), signing out...');
                        await supabase.auth.signOut();
                        return;
                    }

                    setUser(profile);
                    const permissions = await fetchUserPermissions(profile.role_id);
                    setUserPermissions(permissions);
                    await Promise.all([fetchAllUsers(), fetchRoles()]);
                }
            } else if (event === 'SIGNED_OUT') {
                console.log('Auth: Signed out, clearing state');
                setUser(null);
                setUserPermissions([]);
                setUsers([]);
            }
        });

        return () => {
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        // Only fetch users if authenticated and not in pending state logic
        if (user) {
            fetchAllUsers();
        }
    }, [showDeleted, user]);

    // Login
    const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
        if (!isSupabaseConfigured()) {
            const foundUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (foundUser && mockPasswords[foundUser.email] === password) {
                if (foundUser.status === 'Pendente') return { success: false, message: 'Sua conta está aguardando aprovação.' };
                if (foundUser.status === 'Inativo') return { success: false, message: 'Sua conta foi desativada.' };
                setUser(foundUser);
                const role = mockRoles.find(r => r.id === foundUser.role_id);
                setUserPermissions(role ? (mockPermissions[role.name] || defaultPermissions) : defaultPermissions);
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
                if (profile) {
                    setUser(profile);
                    const permissions = await fetchUserPermissions(profile.role_id);
                    setUserPermissions(permissions);
                }
                return { success: true, message: '' };
            }
            return { success: false, message: 'Erro desconhecido.' };
        } catch {
            return { success: false, message: 'Erro ao fazer login.' };
        }
    };

    // Signup
    const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; message: string }> => {
        if (!isSupabaseConfigured()) {
            const tecnicoRole = mockRoles.find(r => r.name === 'tecnico');
            const newUser: User = {
                id: String(mockUsers.length + 1),
                name,
                email,
                role_id: tecnicoRole?.id || '3',
                roleName: 'tecnico',
                status: 'Pendente',
                createdAt: new Date().toLocaleDateString('pt-BR'),
            };
            mockUsers.push(newUser);
            return { success: true, message: '' };
        }

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { name, role: 'tecnico' } }
            });

            if (error) return { success: false, message: error.message };

            // Do not sign out immediately here, let onAuthStateChange handle it if auto-login occurs.
            // But if auto-login DOES NOT occur (email confirm on), onAuthStateChange won't fire SIGNED_IN.
            // If auto-login DOES occur, our new logic in onAuthStateChange will catch 'Pendente' and sign out.
            // So we can remove the explicit signOut(); or keep it?
            // If we keep it, onAuthStateChange might see SIGNED_IN then SIGNED_OUT quickly.
            // Let's rely on manual check or onAuthStateChange.
            // Safest: check session after signup.

            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                await supabase.auth.signOut();
            }

            return { success: true, message: '' };
        } catch {
            return { success: false, message: 'Erro ao criar conta.' };
        }
    };

    // Logout
    const logout = async () => {
        if (!isSupabaseConfigured()) {
            setUser(null);
            setUserPermissions([]);
            localStorage.removeItem('otavio_user');
            return;
        }
        await supabase.auth.signOut();
        setUser(null);
        setUserPermissions([]);
    };

    // Criar usuário (admin)
    const createUser = async (email: string, password: string, name: string, roleId: string): Promise<boolean> => {
        if (!isSupabaseConfigured()) {
            const role = mockRoles.find(r => r.id === roleId);
            const newUser: User = {
                id: String(mockUsers.length + 1),
                name,
                email,
                role_id: roleId,
                roleName: role?.name || 'tecnico',
                status: 'Ativo',
                createdAt: new Date().toLocaleDateString('pt-BR'),
            };
            mockUsers.push(newUser);
            setUsers([...mockUsers]);
            return true;
        }

        try {
            // Get role name for metadata
            const role = roles.find(r => r.id === roleId);

            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { name, role: role?.name || 'tecnico' } }
            });

            if (error) return false;

            // Update the profile with correct role_id
            // (trigger creates with tecnico by default)
            // We need to wait a bit for the trigger to execute
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (user) {
                await fetchAllUsers();
            }
            return true;
        } catch {
            return false;
        }
    };

    // Atualizar role do usuário
    const updateUserRole = async (userId: string, roleId: string): Promise<boolean> => {
        if (!isSupabaseConfigured()) {
            const role = mockRoles.find(r => r.id === roleId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role_id: roleId, roleName: role?.name || 'tecnico' } : u));
            return true;
        }

        try {
            const { error } = await supabase.from('profiles').update({ role_id: roleId }).eq('id', userId);
            if (error) return false;

            const role = roles.find(r => r.id === roleId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role_id: roleId, roleName: role?.name || 'tecnico' } : u));
            return true;
        } catch {
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
        } catch {
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
        } catch {
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
        } catch {
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
        } catch {
            return false;
        }
    };

    const refreshUsers = async () => { await fetchAllUsers(); };
    const refreshRoles = async () => { await fetchRoles(); };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isAdmin: user?.roleName === 'admin',
        isManager: user?.roleName === 'admin' || user?.roleName === 'gerente',
        userPermissions,
        login,
        signup,
        logout,
        users,
        roles,
        showDeleted,
        setShowDeleted,
        createUser,
        updateUserRole,
        updateUserStatus,
        deleteUser,
        restoreUser,
        approveUser,
        refreshUsers,
        refreshRoles,
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
