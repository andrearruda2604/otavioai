export interface N8NMessageContent {
    type: 'ai' | 'human' | 'system';
    content: string;
    tool_calls?: unknown[];
}

export interface Message {
    id: number;
    session_id: string;
    message: N8NMessageContent;
    created_at?: string;
}

export interface ClientSession {
    client_id: string;
    name_first: string;
    name_last: string;
    whatsapp: string;
    last_message?: string;
    fup_done?: boolean;
    company_name?: string;
    archived?: boolean;
    requests?: { status: string; created_at: string }[];
    latestStatus?: string;
}
