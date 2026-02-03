import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, Role, AuthContextType, UserStatus, defaultPermissions, MenuPermissions } from '../types/authTypes';

const mockUsers: User[] = [
    { id: '1', name: 'Admin', email: 'admin@otavio.ai', role_id: '1', roleName: 'admin', status: 'Ativo', createdAt: '09/01/2026' },
    { id: '2', name: 'Maria Cruz', email: 'maria@empresa.com.br', role_id: '2', roleName: 'usuario', status: 'Ativo', createdAt: '19/12/2025' },
    { id: '3', name: 'Jose Silva', email: 'jose@empresa.com', role_id: '2', roleName: 'usuario', status: 'Pendente', createdAt: '19/12/2025' },
];

const mockRoles: Role[] = [
    { id: '1', name: 'admin', description: 'Administrador do sistema - acesso total', isSystem: true },
    { id: '2', name: 'usuario', description: 'Usuário do sistema - acesso padrão', isSystem: true },
];

const mockPermissions: Record<string, string[]> = {
    'admin': ['dashboard', 'insights', 'pipeline', 'chat', 'leads', 'knowledge', 'users'],
    'usuario': ['dashboard', 'insights', 'pipeline', 'chat', 'leads', 'knowledge'],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>(mockRoles);
    const [userPermissions, setUserPermissions] = useState<string[]>([]);
    const [showDeleted, setShowDeleted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isPendingApproval, setIsPendingApproval] = useState(false);

    // Função auxiliar para traduzir erros do Supabase
    const translateAuthError = (message: string): string => {
        if (message.includes('Invalid login credentials')) return 'Credenciais de login inválidas.';
        if (message.includes('Email not confirmed')) return 'Email não confirmado.';
        if (message.includes('User already registered') || message.includes('already registered')) return 'Usuário já cadastrado.';
        if (message.includes('Password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.';
        if (message.includes('For security purposes, you can only request this once every')) return 'Por segurança, tente novamente em 60 segundos.';
        return message;
    };

    // Buscar permissões do usuário baseado no role_id
    const fetchUserPermissions = async (roleId: string | null): Promise<string[]> => {
        if (!roleId) return defaultPermissions;

        if (!isSupabaseConfigured()) {
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

    // Centraliza lógica de sessão
    const handleSession = async (session: any) => {
        if (!session?.user) {
            setUser(null);
            setUserPermissions([]);
            setIsPendingApproval(false);
            setLoading(false);
            return;
        }

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
                .eq('id', session.user.id)
                .single();

            if (error || !profile) {
                setUser(null);
                setLoading(false);
                return;
            }

            // Check pending status - set flag instead of logging out
            if (profile.status === 'Pendente') {
                setIsPendingApproval(true);
                setUser(null);
                setUserPermissions([]);
                await supabase.auth.signOut();
                setLoading(false);
                return;
            }

            // Reset pending flag if status is active
            setIsPendingApproval(false);

            const userData: User = {
                id: profile.id,
                name: profile.name,
                email: profile.email || session.user.email || '',
                role_id: profile.role_id,
                roleName: profile.roles?.name || 'usuario',
                status: profile.status as UserStatus,
                createdAt: new Date(profile.created_at).toLocaleDateString('pt-BR'),
                deletedAt: profile.deleted_at,
                approvedBy: profile.approved_by,
                approvedAt: profile.approved_at,
            };

            setUser(userData);
            const permissions = await fetchUserPermissions(userData.role_id);
            setUserPermissions(permissions);

            // Lazy load users/roles if has permission
            if (permissions.includes('users')) {
                fetchAllUsers();
                fetchRoles();
            }

        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

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
            if (!showDeleted) query = query.is('deleted_at', null);

            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;

            const mappedUsers: User[] = data.map((profile: any) => ({
                id: profile.id,
                name: profile.name,
                email: profile.email || `${profile.name.toLowerCase().replace(/\s/g, '.')}@email.com`,
                role_id: profile.role_id,
                roleName: profile.roles?.name || 'usuario',
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

    const fetchRoles = async () => {
        if (!isSupabaseConfigured()) {
            setRoles(mockRoles);
            return;
        }
        try {
            const { data, error } = await supabase.from('roles').select('*').order('name');
            if (error) throw error;
            const mappedRoles: Role[] = data.map((r: any) => ({
                id: r.id,
                name: r.name,
                description: r.description || '',
                isSystem: r.is_system,
                createdAt: r.created_at,
            }));
            setRoles(mappedRoles);
        } catch {
            // silent fail
        }
    };

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

        // Initial check
        supabase.auth.getSession().then(({ data: { session } }) => {
            handleSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            handleSession(session);
            if (event === 'PASSWORD_RECOVERY') {
                navigate('/update-password');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        // Fetch users if user has specific permission, not just hardcoded roles
        if (user && userPermissions.includes('users')) {
            fetchAllUsers();
            fetchRoles();
        }
    }, [showDeleted, user, userPermissions]);

    const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
        if (!isSupabaseConfigured()) {
            const foundUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (foundUser && password.length > 0) {
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
            // Check status BEFORE logging in (optional, but supabase doesn't expose status publicly usually)
            // So we login first, then handleSession will catch pending status and logout/error.
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { success: false, message: translateAuthError(error.message) };

            // handleSession will run via onAuthStateChange, but we can return success here.
            // However, if status is pending, we need to intercept.
            // Ideally handleSession handles the logout, but the UI needs a message.

            // HACK: Wait slightly for session to settle or check manually
            if (data.user) {
                const { data: profile } = await supabase.from('profiles').select('status').eq('id', data.user.id).single();
                if (profile?.status === 'Pendente') {
                    await supabase.auth.signOut();
                    return { success: false, message: 'Sua conta está aguardando aprovação de um administrador.' };
                }
                if (profile?.status === 'Inativo') {
                    await supabase.auth.signOut();
                    return { success: false, message: 'Sua conta foi desativada.' };
                }
            }

            return { success: true, message: '' };
        } catch {
            return { success: false, message: 'Erro ao fazer login.' };
        }
    };

    const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; message: string }> => {
        if (!isSupabaseConfigured()) {
            // Mock implementation
            const tecnicoRole = mockRoles.find(r => r.name === 'tecnico');
            const newUser: User = {
                id: String(mockUsers.length + 1),
                name,
                email,
                role_id: tecnicoRole?.id || '3',
                roleName: 'usuario',
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
                options: { data: { name, role: 'usuario' } }
            });
            if (error) return { success: false, message: translateAuthError(error.message) };

            // Force logout if auto-logged in (which happens if confirm off)
            const { data: { session } } = await supabase.auth.getSession();
            if (session) await supabase.auth.signOut();

            return { success: true, message: '' };
        } catch {
            return { success: false, message: 'Erro ao criar conta.' };
        }
    };

    const logout = async () => {
        if (!isSupabaseConfigured()) {
            setUser(null);
            setUserPermissions([]);
            localStorage.removeItem('otavio_user');
            window.location.reload();
            return;
        }
        await supabase.auth.signOut();
        // State clear handled by onAuthStateChange -> handleSession(null)
        // But we force reload to be clean
        window.location.reload();
    };

    // User management functions (createUser, updateUserRole, etc)
    const createUser = async (email: string, password: string, name: string, roleId: string): Promise<boolean> => {
        if (!isSupabaseConfigured()) {
            // Mock
            return true;
        }
        try {
            const role = roles.find(r => r.id === roleId);

            // Get current session to restore after signup
            // Call serverless function to create user using Admin API
            const response = await fetch('/api/create-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, name, roleId })
            });
            if (!response.ok) {
                return false;
            }

            await new Promise(resolve => setTimeout(resolve, 1000)); // wait for data to propagate
            await fetchAllUsers();
            return true;
        } catch { return false; }
    };

    const updateUserRole = async (userId: string, roleId: string): Promise<boolean> => {
        if (!isSupabaseConfigured()) return true;
        try {
            const { error } = await supabase.from('profiles').update({ role_id: roleId }).eq('id', userId);
            if (error) return false;
            // Optimistic update or refresh
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role_id: roleId } : u));
            return true;
        } catch { return false; }
    };

    const updateUserStatus = async (userId: string, status: UserStatus): Promise<boolean> => {
        if (!isSupabaseConfigured()) return true;
        try {
            const { error } = await supabase.from('profiles').update({ status }).eq('id', userId);
            if (error) return false;
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
            return true;
        } catch { return false; }
    };

    const deleteUser = async (userId: string): Promise<boolean> => {
        if (!isSupabaseConfigured()) return true;
        try {
            const { error } = await supabase.from('profiles').update({ deleted_at: new Date().toISOString() }).eq('id', userId);
            if (error) return false;
            await fetchAllUsers();
            return true;
        } catch { return false; }
    };

    const restoreUser = async (userId: string): Promise<boolean> => {
        if (!isSupabaseConfigured()) return true;
        try {
            const { error } = await supabase.from('profiles').update({ deleted_at: null }).eq('id', userId);
            if (error) return false;
            await fetchAllUsers();
            return true;
        } catch { return false; }
    };

    const approveUser = async (userId: string): Promise<boolean> => {
        if (!isSupabaseConfigured()) return true;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    status: 'Ativo',
                    approved_by: user?.id,
                    approved_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select();

            if (error) return false;

            // Check if any rows were updated
            if (!data || data.length === 0) return false;

            await fetchAllUsers();
            return true;
        } catch {
            return false;
        }
    };

    const refreshUsers = async () => { await fetchAllUsers(); };
    const refreshRoles = async () => { await fetchRoles(); };

    const createRole = async (name: string, description: string, permissions: MenuPermissions): Promise<boolean> => {
        if (!isSupabaseConfigured()) {
            const newRole: Role = {
                id: String(roles.length + 1),
                name,
                description,
                isSystem: false,
                createdAt: new Date().toISOString()
            };
            setRoles([...roles, newRole]);
            return true;
        }

        try {
            const { data: roleData, error: roleError } = await supabase
                .from('roles')
                .insert({ name, description, is_system: false })
                .select()
                .single();

            if (roleError || !roleData) throw roleError;

            const permissionsToInsert = Object.entries(permissions)
                .filter(([_, enabled]) => enabled)
                .map(([key]) => ({
                    role_id: roleData.id,
                    route_key: key
                }));

            if (permissionsToInsert.length > 0) {
                const { error: permError } = await supabase
                    .from('role_permissions')
                    .insert(permissionsToInsert);

                if (permError) throw permError;
            }

            await fetchRoles();
            return true;
        } catch {
            return false;
        }
    };

    const updateRole = async (roleId: string, name: string, description: string, permissions: MenuPermissions): Promise<boolean> => {
        if (!isSupabaseConfigured()) {
            setRoles(roles.map(r => r.id === roleId ? { ...r, name, description } : r));
            return true;
        }

        try {
            const { error: roleError } = await supabase
                .from('roles')
                .update({ name, description })
                .eq('id', roleId);

            if (roleError) throw roleError;

            // Delete old permissions
            const { error: delError } = await supabase
                .from('role_permissions')
                .delete()
                .eq('role_id', roleId);

            if (delError) throw delError;

            const permissionsToInsert = Object.entries(permissions)
                .filter(([_, enabled]) => enabled)
                .map(([key]) => ({
                    role_id: roleId,
                    route_key: key
                }));

            if (permissionsToInsert.length > 0) {
                const { error: permError } = await supabase
                    .from('role_permissions')
                    .insert(permissionsToInsert);

                if (permError) throw permError;
            }

            await fetchRoles();
            return true;
        } catch {
            return false;
        }
    };

    const deleteRole = async (roleId: string): Promise<boolean> => {
        if (!isSupabaseConfigured()) {
            setRoles(roles.filter(r => r.id !== roleId));
            return true;
        }
        try {
            const { error } = await supabase.from('roles').delete().eq('id', roleId);
            if (error) throw error;
            await fetchRoles();
            return true;
        } catch {
            return false;
        }
    };

    const getRolePermissions = async (roleId: string): Promise<MenuPermissions> => {
        const permissions: MenuPermissions = {
            dashboard: false,
            insights: false,
            pipeline: false,
            chat: false,
            leads: false,
            knowledge: false,
            users: false
        };

        const keys = await fetchUserPermissions(roleId);
        keys.forEach(key => {
            if (key in permissions) {
                (permissions as any)[key] = true;
            }
        });

        return permissions;
    };

    const resetPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
        if (!isSupabaseConfigured()) {
            return { success: true, message: 'Email de recuperação enviado (simulação).' };
        }
        try {
            // Redirect to the update-password page
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: window.location.origin,
            });
            if (error) throw error;
            return { success: true, message: 'Email de recuperação enviado.' };
        } catch (err: any) {
            return { success: false, message: translateAuthError(err.message || 'Erro ao enviar email.') };
        }
    };

    const updatePassword = async (password: string): Promise<{ success: boolean; message: string }> => {
        if (!isSupabaseConfigured()) {
            return { success: true, message: 'Senha atualizada com sucesso (simulação).' };
        }
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            return { success: true, message: 'Senha atualizada com sucesso.' };
        } catch (err: any) {
            return { success: false, message: translateAuthError(err.message || 'Erro ao atualizar senha.') };
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isAdmin: user?.roleName === 'admin',
        isManager: user?.roleName === 'admin' || user?.roleName === 'gerente',
        isPendingApproval,
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
        createRole,
        updateRole,
        deleteRole,
        getRolePermissions,
        resetPassword,
        updatePassword,
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
