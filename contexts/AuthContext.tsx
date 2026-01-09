import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Profile, AuthContextType, UserProfile } from '../types/authTypes';

// Dados mockados de usuários
const mockUsers: User[] = [
    { id: '1', name: 'Andre Arruda', email: 'admin@octavio.ai', profile: 'admin', status: 'Ativo', createdAt: '09/01/2026' },
    { id: '2', name: 'Maria Cruz', email: 'maria@wgabrasil.com.br', profile: 'tecnico', status: 'Ativo', createdAt: '19/12/2025' },
    { id: '3', name: 'Jose da Silva', email: 'josedasilva@wgabrasil.com', profile: 'tecnico', status: 'Inativo', createdAt: '19/12/2025' },
    { id: '4', name: 'O Andre', email: 'andrelsarruda3@gmail.com', profile: 'tecnico', status: 'Ativo', createdAt: '17/12/2025' },
    { id: '5', name: 'José Souza', email: 'financeforge66@gmail.com', profile: 'tecnico', status: 'Ativo', createdAt: '17/12/2025' },
    { id: '6', name: 'Chico', email: 'andrecamilochico@gmail.com', profile: 'tecnico', status: 'Ativo', createdAt: '14/12/2025' },
    { id: '7', name: 'Mario Santos', email: 'oeco200480@gmail.com', profile: 'tecnico', status: 'Ativo', createdAt: '09/12/2025' },
];

// Senhas mockadas (em produção, isso seria no backend)
const mockPasswords: Record<string, string> = {
    'admin@octavio.ai': 'admin123',
    'maria@wgabrasil.com.br': 'tecnico123',
    'josedasilva@wgabrasil.com': 'tecnico123',
    'andrelsarruda3@gmail.com': 'tecnico123',
    'financeforge66@gmail.com': 'tecnico123',
    'andrecamilochico@gmail.com': 'tecnico123',
    'oeco200480@gmail.com': 'tecnico123',
};

const mockProfiles: Profile[] = [
    { id: '1', name: 'admin', description: 'Administrador do sistema - acesso total', isSystem: true, permissionsCount: 11 },
    { id: '2', name: 'tecnico', description: 'Técnico de campo - acesso básico', isSystem: true, permissionsCount: 6 },
    { id: '3', name: 'gerente', description: 'Gerente de equipe - acesso intermediário', isSystem: true, permissionsCount: 8 },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>(mockUsers);
    const [profiles] = useState<Profile[]>(mockProfiles);

    // Carregar usuário do localStorage ao iniciar
    useEffect(() => {
        const savedUser = localStorage.getItem('octavio_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (foundUser && mockPasswords[foundUser.email] === password) {
            if (foundUser.status === 'Inativo') {
                return false;
            }
            setUser(foundUser);
            localStorage.setItem('octavio_user', JSON.stringify(foundUser));
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('octavio_user');
    };

    const updateUserProfile = (userId: string, profile: UserProfile) => {
        setUsers(prevUsers =>
            prevUsers.map(u =>
                u.id === userId ? { ...u, profile } : u
            )
        );
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
