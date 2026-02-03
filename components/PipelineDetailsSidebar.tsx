import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { PipelineRequest } from '../types/pipeline';

interface PipelineDetailsSidebarProps {
    request: PipelineRequest | null;
    isOpen: boolean;
    onClose: () => void;
    onVerify: (requestId: number) => void;
    onArchive: (requestId: number) => void;
}

export const PipelineDetailsSidebar: React.FC<PipelineDetailsSidebarProps> = ({
    request,
    isOpen,
    onClose,
    onVerify,
    onArchive
}) => {
    const navigate = useNavigate();
    const [expandedProducts, setExpandedProducts] = React.useState<Set<number>>(new Set());

    if (!isOpen || !request) return null;

    const clientName = request.client
        ? `${request.client.name_first || ''} ${request.client.name_last || ''}`.trim() || 'Cliente Desconhecido'
        : 'Cliente Desconhecido';

    const handleGoToConversation = () => {
        if (request.client?.whatsapp) {
            navigate(`/chat?chatId=${request.client.whatsapp}`);
        }
    };

    const toggleProductExpansion = (idx: number) => {
        setExpandedProducts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(idx)) {
                newSet.delete(idx);
            } else {
                newSet.add(idx);
            }
            return newSet;
        });
    };

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/30 z-40 transition-opacity"
                onClick={onClose}
            ></div>

            {/* Sidebar Panel */}
            <div className="fixed right-0 top-0 bottom-0 w-[400px] max-w-[90vw] bg-white dark:bg-card-dark z-50 shadow-2xl flex flex-col animate-slide-in-right overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-card-dark">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Detalhes do Produto</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                <div className="p-5 flex flex-col flex-1 gap-6">
                    {/* Title & Status */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{request.title}</h3>
                        <div className="flex items-center gap-2">
                            <StatusBadge status={request.status} />
                        </div>
                    </div>

                    {/* Lead Section */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Lead</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                {clientName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-800 dark:text-white">{clientName}</p>
                                {request.client?.company && (
                                    <p className="text-sm text-slate-500">{request.client.company}</p>
                                )}
                            </div>
                        </div>
                        {request.client?.whatsapp && (
                            <p className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-2">
                                <span className="material-icons-round text-sm text-green-500">phone</span>
                                {request.client.whatsapp}
                            </p>
                        )}
                    </div>

                    {/* Solicitação Section */}
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Solicitação</p>
                        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                            <p><span className="text-slate-400">Número:</span> #{request.request_id}</p>
                            <p><span className="text-slate-400">Data:</span> {new Date(request.created_at).toLocaleDateString('pt-BR')} às {new Date(request.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                            <p><span className="text-slate-400">Canal:</span> WhatsApp</p>
                            {request.prod_quantity && (
                                <p><span className="text-slate-400">Quantidade:</span> {request.prod_quantity}</p>
                            )}
                            {(request.car_brand || request.car_model || request.car_year) && (
                                <p><span className="text-slate-400">Veículo:</span> {[request.car_brand, request.car_model, request.car_year].filter(Boolean).join(' ')}</p>
                            )}
                            {request.title && (
                                <p><span className="text-slate-400">Produto:</span> {request.title}</p>
                            )}
                        </div>
                    </div>

                    {/* Produtos Section - Always show if ordered_prods exists and has items */}
                    {request.ordered_prods && request.ordered_prods.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                                <span className="material-icons-round text-sm">shopping_bag</span>
                                Produtos Encontrados
                            </p>
                            <div className="space-y-3">
                                {request.ordered_prods.map((prod, idx) => (
                                    <div key={idx} className={`rounded-lg overflow-hidden border ${prod.not_found ? 'bg-slate-50 border-slate-200 dark:bg-slate-800/30 dark:border-slate-700' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                                        <div className="p-3 flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-800 dark:text-white text-sm">
                                                    {prod.stock_product_title || prod.prod_title || 'Produto sem nome'}
                                                </p>
                                                {prod.stock_unit_price ? (
                                                    <p className="text-sm font-semibold text-emerald-600">R$ {prod.stock_unit_price.toFixed(2).replace('.', ',')}</p>
                                                ) : (
                                                    !prod.not_found && (
                                                        <p className="text-xs text-slate-500 italic mt-1">
                                                            Preço sob consulta
                                                        </p>
                                                    )
                                                )}
                                            </div>
                                            {!prod.not_found && (
                                                <button
                                                    onClick={() => toggleProductExpansion(idx)}
                                                    className="text-slate-400 hover:text-primary transition-colors flex items-center gap-1"
                                                >
                                                    <span className="text-xs font-medium">Detalhes</span>
                                                    <span className={`material-icons-round text-sm transition-transform ${expandedProducts.has(idx) ? 'rotate-180' : ''}`}>
                                                        expand_more
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                        {expandedProducts.has(idx) && !prod.not_found && (
                                            <div className="px-3 pb-3 pt-0 border-t border-slate-200 dark:border-slate-700 mt-2 space-y-2">
                                                <div className="pt-2">
                                                    <p className="text-xs text-slate-400 mb-1">Produto no Estoque:</p>
                                                    {prod.stock_product_url ? (
                                                        <a
                                                            href={prod.stock_product_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm font-medium text-primary hover:text-primary-dark dark:text-primary-light flex items-center gap-1"
                                                        >
                                                            {prod.stock_product_title || prod.prod_title}
                                                            <span className="material-icons-round text-xs">open_in_new</span>
                                                        </a>
                                                    ) : (
                                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                            {prod.stock_product_title || prod.prod_title || 'Não vinculado ao estoque'}
                                                        </p>
                                                    )}
                                                </div>
                                                {prod.stock_unit_price && (
                                                    <div>
                                                        <p className="text-xs text-slate-400 mb-1">Preço Unitário:</p>
                                                        <p className="text-sm font-semibold text-emerald-600">R$ {prod.stock_unit_price.toFixed(2).replace('.', ',')}</p>
                                                    </div>
                                                )}
                                                {prod.supplier_name && (
                                                    <div>
                                                        <p className="text-xs text-slate-400 mb-1">Fornecedor:</p>
                                                        {prod.supplier_domain ? (
                                                            <a
                                                                href={`https://${prod.supplier_domain}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm font-medium text-primary hover:text-primary-dark dark:text-primary-light flex items-center gap-1"
                                                            >
                                                                {prod.supplier_name}
                                                                <span className="material-icons-round text-xs">open_in_new</span>
                                                            </a>
                                                        ) : (
                                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{prod.supplier_name}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-auto space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => onVerify(request.request_id)}
                            className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${request.verified
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-slate-800 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'
                                }`}
                        >
                            <span className="material-icons-round text-sm">check</span>
                            {request.verified ? 'Verificado' : 'Marcar como verificado'}
                        </button>

                        <div className="flex gap-3">
                            <button
                                onClick={handleGoToConversation}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-icons-round text-sm">chat</span>
                                Conversa
                            </button>
                            <button
                                onClick={() => onArchive(request.request_id)}
                                className="flex-1 py-2.5 rounded-xl border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-icons-round text-sm">archive</span>
                                Arquivar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
