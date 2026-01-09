export type UserProfile = 'admin' | 'tecnico' | 'gerente';
export type UserStatus = 'Ativo' | 'Inativo';

export interface User {
    id: string;
    name: string;
    email: string;
    profile: UserProfile;
    status: UserStatus;
    createdAt: string;
}

export interface Profile {
    id: string;
    name: string;
    description: string;
    isSystem: boolean;
    permissionsCount: number;
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    users: User[];
    profiles: Profile[];
    updateUserProfile: (userId: string, profile: UserProfile) => void;
}
