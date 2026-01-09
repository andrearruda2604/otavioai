export type UserProfile = 'admin' | 'tecnico' | 'gerente';
export type UserStatus = 'Pendente' | 'Ativo' | 'Inativo';

export interface MenuPermissions {
    dashboard: boolean;
    insights: boolean;
    pipeline: boolean;
    chat: boolean;
    leads: boolean;
    knowledge: boolean;
    users: boolean;
}

export interface User {
    id: string;
    name: string;
    email: string;
    profile: UserProfile;
    status: UserStatus;
    createdAt: string;
    deletedAt?: string | null;
    approvedBy?: string | null;
    approvedAt?: string | null;
}

export interface Profile {
    id: string;
    name: string;
    description: string;
    isSystem: boolean;
    permissionsCount: number;
    permissions: MenuPermissions;
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isManager: boolean;
    permissions: MenuPermissions | null;
    login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
    signup: (email: string, password: string, name: string) => Promise<{ success: boolean; message: string }>;
    logout: () => void;
    users: User[];
    profiles: Profile[];
    showDeleted: boolean;
    setShowDeleted: (show: boolean) => void;
    createUser: (email: string, password: string, name: string, role: UserProfile) => Promise<boolean>;
    updateUserProfile: (userId: string, profile: UserProfile) => Promise<boolean>;
    updateUserStatus: (userId: string, status: UserStatus) => Promise<boolean>;
    deleteUser: (userId: string) => Promise<boolean>;
    restoreUser: (userId: string) => Promise<boolean>;
    approveUser: (userId: string) => Promise<boolean>;
    createProfile: (name: string, description: string, permissions: MenuPermissions) => Promise<boolean>;
    updateProfile: (id: string, name: string, description: string, permissions: MenuPermissions) => Promise<boolean>;
    refreshUsers: () => Promise<void>;
    refreshProfiles: () => Promise<void>;
}

export const defaultPermissions: MenuPermissions = {
    dashboard: true,
    insights: false,
    pipeline: false,
    chat: false,
    leads: false,
    knowledge: false,
    users: false,
};

export const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', category: 'Geral' },
    { key: 'insights', label: 'Insights', icon: 'insights', category: 'Geral' },
    { key: 'pipeline', label: 'Pipeline', icon: 'account_tree', category: 'Geral' },
    { key: 'chat', label: 'Chat', icon: 'chat', category: 'Geral' },
    { key: 'leads', label: 'Leads', icon: 'people', category: 'Geral' },
    { key: 'knowledge', label: 'Base de Conhecimento', icon: 'menu_book', category: 'Geral' },
    { key: 'users', label: 'Gestão de Usuários', icon: 'manage_accounts', category: 'Administração' },
] as const;
