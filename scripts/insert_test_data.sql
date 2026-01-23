-- ========================================
-- SCRIPT COMPLETO PARA INSERIR DADOS DE TESTE
-- Execute este script no Supabase SQL Editor
-- ========================================

DO $$
DECLARE
    v_supplier_id bigint;
    v_product_ids text[];
    v_client_id bigint;
    v_request_id bigint;
    v_prod_id bigint;
BEGIN
    -- 1. Criar ou buscar fornecedor
    INSERT INTO suppliers (name, apex_domain)
    VALUES ('MegaPeças Online', 'megapecas.com.br')
    ON CONFLICT (name) DO UPDATE SET apex_domain = EXCLUDED.apex_domain
    RETURNING supplier_id INTO v_supplier_id;
    
    RAISE NOTICE '✅ Fornecedor ID: %', v_supplier_id;

    -- 2. Inserir produtos no estoque
    WITH inserted_products AS (
        INSERT INTO stock_products (product_title, url, unit_price, brand, supplier_id)
        VALUES 
            ('Filtro de Óleo Mann W719/30 - Original', 'https://megapecas.com.br/filtro-oleo-mann-w719-30', 45.90, 'Mann', v_supplier_id),
            ('Filtro de Óleo Tecfil PSL140 - Premium', 'https://megapecas.com.br/filtro-oleo-tecfil-psl140', 38.50, 'Tecfil', v_supplier_id),
            ('Filtro de Óleo Bosch 0986AF1042 - Performance', 'https://megapecas.com.br/filtro-oleo-bosch-0986af1042', 52.00, 'Bosch', v_supplier_id)
        RETURNING product_id
    )
    SELECT array_agg(product_id::text) INTO v_product_ids FROM inserted_products;
    
    RAISE NOTICE '✅ Produtos inseridos: %', array_length(v_product_ids, 1);

    -- 3. Criar ou buscar cliente
    INSERT INTO clients (name_first, name_last, whatsapp, company_name, archived)
    VALUES ('Maria', 'Santos', '5511988776655', 'Oficina Santos', false)
    ON CONFLICT (whatsapp) DO UPDATE SET 
        name_first = EXCLUDED.name_first,
        name_last = EXCLUDED.name_last
    RETURNING client_id INTO v_client_id;
    
    RAISE NOTICE '✅ Cliente ID: %', v_client_id;

    -- 4. Criar solicitação
    INSERT INTO requests (client_id, status, archived)
    VALUES (v_client_id, 'Em andamento', false)
    RETURNING request_id INTO v_request_id;
    
    RAISE NOTICE '✅ Solicitação ID: %', v_request_id;

    -- 5. Criar produto na solicitação com search_prod_ids
    INSERT INTO requests_products (
        request_id,
        prod_title,
        car_brand,
        car_model,
        car_year,
        prod_quantity,
        search_result,
        search_prod_ids,
        status,
        deal_status
    )
    VALUES (
        v_request_id,
        'Filtro de Óleo',
        'Honda',
        'Civic',
        2019,
        1,
        true,
        v_product_ids,
        'Cotação enviada',
        'Pending Feedback'
    )
    RETURNING prod_id INTO v_prod_id;
    
    RAISE NOTICE '✅ Produto na solicitação ID: %', v_prod_id;
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '🎉 SUCESSO! Dados inseridos com sucesso!';
    RAISE NOTICE '   Procure por "Filtro de Óleo" no Pipeline';
END $$;

-- Verificar os dados inseridos
SELECT 
    rp.prod_id AS "ID",
    rp.prod_title AS "Produto",
    rp.car_brand || ' ' || rp.car_model || ' ' || rp.car_year AS "Veículo",
    rp.prod_quantity AS "Qtd",
    array_length(rp.search_prod_ids, 1) AS "Produtos Estoque",
    c.name_first || ' ' || c.name_last AS "Cliente",
    c.whatsapp AS "WhatsApp",
    rp.created_at AS "Criado em"
FROM requests_products rp
JOIN requests r ON rp.request_id = r.request_id
JOIN clients c ON r.client_id = c.client_id
WHERE c.whatsapp = '5511988776655'
ORDER BY rp.created_at DESC
LIMIT 1;
