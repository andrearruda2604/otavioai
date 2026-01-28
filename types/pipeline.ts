export type DateRangeOption = 'today' | '7days' | '30days' | 'month' | 'total';
export type VerificationFilter = 'all' | 'verified' | 'unverified';

export interface PipelineRequest {
    request_id: number;
    title: string;
    status: string;
    created_at: string;
    total_price?: number | null;
    ordered_prods?: PipelineProduct[];
    client?: PipelineClient;
    verified?: boolean;
    prod_quantity?: number;
    car_brand?: string;
    car_model?: string;
    car_year?: number;
}

export interface PipelineProduct {
    prod_id?: string;
    prod_title?: string;
    prod_price?: number;
    stock_product_title?: string;
    stock_product_url?: string;
    stock_unit_price?: number;
    supplier_name?: string;
    supplier_domain?: string;
    not_found?: boolean;
    search_prod_ids?: string[];
    has_search_ids?: boolean;
}

export interface PipelineClient {
    client_id?: number;
    name_first?: string;
    name_last?: string;
    whatsapp?: string;
    company?: string;
}
