// Mapeamento de rotas para chaves de permissão
export const ROUTE_PERMISSIONS: Record<string, string> = {
    '/dashboard': 'dashboard',
    '/insights': 'insights',
    '/pipeline': 'pipeline',
    '/chat': 'chat',
    '/leads': 'leads',
    '/knowledge': 'knowledge',
    '/users': 'users',
};

// Todas as permissões disponíveis (para UI de gestão)
export const ALL_PERMISSIONS = [
    { key: 'dashboard', label: 'Dashboard', group: 'Geral', icon: 'dashboard' },
    { key: 'insights', label: 'Insights', group: 'Geral', icon: 'insights' },
    { key: 'pipeline', label: 'Pipeline', group: 'Geral', icon: 'account_tree' },
    { key: 'chat', label: 'Chat', group: 'Geral', icon: 'chat' },
    { key: 'leads', label: 'Leads', group: 'Geral', icon: 'people' },
    { key: 'knowledge', label: 'Base de Conhecimento', group: 'Geral', icon: 'menu_book' },
    { key: 'users', label: 'Gestão de Usuários', group: 'Administração', icon: 'manage_accounts' },
] as const;

/**
 * Verifica se usuário pode acessar uma rota
 * @param userPermissions Lista de route_keys que o usuário tem permissão
 * @param routePath Caminho da rota a verificar
 * @returns true se pode acessar, false caso contrário
 */
export function canAccessRoute(userPermissions: string[] | null | undefined, routePath: string): boolean {
    if (!userPermissions || userPermissions.length === 0) return false;

    // Encontra a rota que melhor corresponde (maior match)
    let matchedKey: string | null = null;
    let longestMatch = 0;

    for (const [path, key] of Object.entries(ROUTE_PERMISSIONS)) {
        if (routePath.startsWith(path) && path.length > longestMatch) {
            matchedKey = key;
            longestMatch = path.length;
        }
    }

    // Rotas não mapeadas são permitidas (ex: /login, /signup)
    if (!matchedKey) return true;

    return userPermissions.includes(matchedKey);
}

/**
 * Verifica se usuário tem uma permissão específica
 * @param userPermissions Lista de route_keys que o usuário tem permissão
 * @param permissionKey Chave da permissão a verificar
 * @returns true se tem permissão, false caso contrário
 */
export function hasPermission(userPermissions: string[] | null | undefined, permissionKey: string): boolean {
    if (!userPermissions) return false;
    return userPermissions.includes(permissionKey);
}

/**
 * Filtra itens de navegação baseado em permissões
 * @param navItems Lista de itens de navegação
 * @param userPermissions Lista de route_keys que o usuário tem permissão
 * @returns Lista filtrada de itens de navegação
 */
export function filterNavigation<T extends { path: string }>(
    navItems: T[],
    userPermissions: string[] | null | undefined
): T[] {
    if (!userPermissions || userPermissions.length === 0) return [];

    return navItems.filter(item => {
        const permissionKey = ROUTE_PERMISSIONS[item.path];
        // Itens sem permissão mapeada são sempre visíveis
        if (!permissionKey) return true;
        return userPermissions.includes(permissionKey);
    });
}
