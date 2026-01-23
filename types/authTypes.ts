export type UserStatus = 'Pendente' | 'Ativo' | 'Inativo';

export interface User {
    id: string;
    name: string;
    email: string;
    role_id: string | null;
    roleName: string;           // Nome do role para exibição (admin, tecnico, gerente)
    status: UserStatus;
    createdAt: string;
    deletedAt?: string | null;
    approvedBy?: string | null;
    approvedAt?: string | null;
}

export interface Role {
    id: string;
    name: string;
    description: string;
    isSystem: boolean;
    createdAt?: string;
}

export interface RolePermission {
    id: string;
    role_id: string;
    route_key: string;
}

// Permissões padrão para usuário sem role (apenas dashboard)
export const defaultPermissions: string[] = ['dashboard'];

export interface MenuPermissions {
    dashboard: boolean;
    insights: boolean;
    pipeline: boolean;
    chat: boolean;
    leads: boolean;
    knowledge: boolean;
    users: boolean;
}

export const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', category: 'Geral' },
    { key: 'insights', label: 'Insights', icon: 'insights', category: 'Geral' },
    { key: 'pipeline', label: 'Pipeline', icon: 'account_tree', category: 'Vendas' },
    { key: 'chat', label: 'Chat', icon: 'chat', category: 'Vendas' },
    { key: 'leads', label: 'Leads', icon: 'people', category: 'Vendas' },
    { key: 'knowledge', label: 'Base de Conhecimento', icon: 'menu_book', category: 'Recursos' },
    { key: 'users', label: 'Gestão de Usuários', icon: 'manage_accounts', category: 'Administração' },
];

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isManager: boolean;
    userPermissions: string[];  // Lista de route_keys que o usuário pode acessar
    login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
    signup: (email: string, password: string, name: string) => Promise<{ success: boolean; message: string }>;
    logout: () => void;
    users: User[];
    roles: Role[];
    showDeleted: boolean;
    setShowDeleted: (show: boolean) => void;
    createUser: (email: string, password: string, name: string, roleId: string) => Promise<boolean>;
    updateUserRole: (userId: string, roleId: string) => Promise<boolean>;
    updateUserStatus: (userId: string, status: UserStatus) => Promise<boolean>;
    deleteUser: (userId: string) => Promise<boolean>;
    restoreUser: (userId: string) => Promise<boolean>;
    approveUser: (userId: string) => Promise<boolean>;
    refreshUsers: () => Promise<void>;
    refreshRoles: () => Promise<void>;
    createRole: (name: string, description: string, permissions: MenuPermissions) => Promise<boolean>;
    updateRole: (roleId: string, name: string, description: string, permissions: MenuPermissions) => Promise<boolean>;
    deleteRole: (roleId: string) => Promise<boolean>;
    getRolePermissions: (roleId: string) => Promise<MenuPermissions>;
}
