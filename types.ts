export interface ChartData {
    name: string;
    solicitacoes: number;
    produtos: number;
}

export interface KanbanCardData {
    title: string;
    id: string;
    date: string;
    user: string;
    verified?: boolean;
    chatId?: string;
    clientId?: number;
}

export interface ChatMessage {
    name: string;
    company: string;
    msg: string;
    time: string;
    initials: string;
    color: string;
    online?: boolean;
    unread?: boolean;
}

export interface Lead {
    name: string;
    company: string;
    whatsapp: string;
    status: 'Ativo' | 'Inativo' | 'Em Contato';
}

export interface StatItem {
    label: string;
    value: number;
    width: string;
    color: string;
}