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
}

// Permissões padrão para usuário sem role (apenas dashboard)
export const defaultPermissions: string[] = ['dashboard'];
