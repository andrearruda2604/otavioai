-- ========================================
-- SCRIPT SIMPLIFICADO PARA TESTE RÁPIDO
-- Execute este script no Supabase SQL Editor
-- ========================================

-- Passo 1: Criar cliente de teste
WITH new_client AS (
    INSERT INTO clients (name_first, name_last, whatsapp, company_name, archived)
    VALUES ('Maria', 'Santos', '5511988776655', 'Oficina Santos', false)
    ON CONFLICT (whatsapp) DO UPDATE SET name_first = EXCLUDED.name_first
    RETURNING client_id
),
-- Passo 2: Criar solicitação
new_request AS (
    INSERT INTO requests (client_id, status, archived)
    SELECT client_id, 'Em andamento', false FROM new_client
    RETURNING request_id
),
-- Passo 3: Criar fornecedor
new_supplier AS (
    INSERT INTO suppliers (name, apex_domain)
    VALUES ('MegaPeças Online', 'megapecas.com.br')
    ON CONFLICT (name) DO UPDATE SET apex_domain = EXCLUDED.apex_domain
    RETURNING supplier_id
),
-- Passo 4: Criar produtos no estoque
new_products AS (
    INSERT INTO stock_products (product_title, url, unit_price, brand, supplier_id)
    SELECT * FROM (VALUES
        ('Filtro de Óleo Mann W719/30 - Original', 'https://megapecas.com.br/filtro-oleo-mann-w719-30', 45.90, 'Mann', (SELECT supplier_id FROM new_supplier)),
        ('Filtro de Óleo Tecfil PSL140 - Premium', 'https://megapecas.com.br/filtro-oleo-tecfil-psl140', 38.50, 'Tecfil', (SELECT supplier_id FROM new_supplier)),
        ('Filtro de Óleo Bosch 0986AF1042 - Performance', 'https://megapecas.com.br/filtro-oleo-bosch-0986af1042', 52.00, 'Bosch', (SELECT supplier_id FROM new_supplier))
    ) AS t(product_title, url, unit_price, brand, supplier_id)
    RETURNING product_id
)
-- Passo 5: Criar produto na solicitação com search_prod_ids
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
SELECT 
    request_id,
    'Filtro de Óleo',
    'Honda',
    'Civic',
    2019,
    1,
    true,
    ARRAY(SELECT product_id::text FROM new_products),
    'Cotação enviada',
    'Pending Feedback'
FROM new_request;

-- Verificar o resultado
SELECT 
    rp.prod_id AS "ID do Produto",
    rp.prod_title AS "Título",
    rp.car_brand || ' ' || rp.car_model || ' ' || rp.car_year AS "Veículo",
    rp.prod_quantity AS "Quantidade",
    array_length(rp.search_prod_ids, 1) AS "Qtd Produtos Estoque",
    c.name_first || ' ' || c.name_last AS "Cliente",
    c.whatsapp AS "WhatsApp"
FROM requests_products rp
JOIN requests r ON rp.request_id = r.request_id
JOIN clients c ON r.client_id = c.client_id
WHERE c.whatsapp = '5511988776655'
ORDER BY rp.created_at DESC
LIMIT 1;
