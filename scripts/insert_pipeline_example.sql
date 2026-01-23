-- Script para inserir dados de exemplo que demonstram 100% da funcionalidade do Pipeline

-- 1. Inserir um cliente de teste
INSERT INTO clients (name_first, name_last, whatsapp, company_name, archived)
VALUES ('João', 'Silva', '5511999887766', 'Auto Peças Silva', false)
ON CONFLICT DO NOTHING
RETURNING client_id;

-- Guardar o client_id (substitua pelo ID retornado acima)
-- Para este exemplo, vamos assumir client_id = 1000

-- 2. Inserir uma solicitação (request)
INSERT INTO requests (client_id, status, archived)
VALUES (
    (SELECT client_id FROM clients WHERE whatsapp = '5511999887766' LIMIT 1),
    'Em andamento',
    false
)
RETURNING request_id;

-- Guardar o request_id (substitua pelo ID retornado acima)
-- Para este exemplo, vamos assumir request_id = 2000

-- 3. Inserir um fornecedor
INSERT INTO suppliers (name, apex_domain)
VALUES ('Auto Peças Premium', 'autopecaspremium.com.br')
ON CONFLICT DO NOTHING
RETURNING supplier_id;

-- Guardar o supplier_id (substitua pelo ID retornado acima)
-- Para este exemplo, vamos assumir supplier_id = 10

-- 4. Inserir produtos no estoque (stock_products)
INSERT INTO stock_products (
    product_title,
    url,
    unit_price,
    brand,
    supplier_id
)
VALUES 
    (
        'Amortecedor Dianteiro Cofap - Lado Direito',
        'https://autopecaspremium.com.br/amortecedor-dianteiro-cofap-direito',
        285.90,
        'Cofap',
        (SELECT supplier_id FROM suppliers WHERE name = 'Auto Peças Premium' LIMIT 1)
    ),
    (
        'Amortecedor Dianteiro Monroe - Lado Direito',
        'https://autopecaspremium.com.br/amortecedor-dianteiro-monroe-direito',
        312.50,
        'Monroe',
        (SELECT supplier_id FROM suppliers WHERE name = 'Auto Peças Premium' LIMIT 1)
    ),
    (
        'Amortecedor Dianteiro Nakata - Lado Direito',
        'https://autopecaspremium.com.br/amortecedor-dianteiro-nakata-direito',
        265.00,
        'Nakata',
        (SELECT supplier_id FROM suppliers WHERE name = 'Auto Peças Premium' LIMIT 1)
    )
ON CONFLICT DO NOTHING
RETURNING product_id;

-- Guardar os product_ids retornados
-- Para este exemplo, vamos assumir product_ids = 5001, 5002, 5003

-- 5. Inserir o produto na solicitação com search_prod_ids
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
    (SELECT request_id FROM requests WHERE client_id = (SELECT client_id FROM clients WHERE whatsapp = '5511999887766' LIMIT 1) ORDER BY created_at DESC LIMIT 1),
    'Amortecedor Dianteiro Direito',
    'Toyota',
    'Corolla',
    2020,
    2,
    true,
    ARRAY[
        (SELECT product_id::text FROM stock_products WHERE product_title LIKE '%Amortecedor Dianteiro Cofap%' LIMIT 1),
        (SELECT product_id::text FROM stock_products WHERE product_title LIKE '%Amortecedor Dianteiro Monroe%' LIMIT 1),
        (SELECT product_id::text FROM stock_products WHERE product_title LIKE '%Amortecedor Dianteiro Nakata%' LIMIT 1)
    ],
    'Cotação enviada',
    'Pending Feedback'
);

-- Verificar os dados inseridos
SELECT 
    rp.prod_id,
    rp.prod_title,
    rp.car_brand,
    rp.car_model,
    rp.car_year,
    rp.prod_quantity,
    rp.search_prod_ids,
    c.name_first || ' ' || c.name_last AS cliente,
    c.whatsapp
FROM requests_products rp
JOIN requests r ON rp.request_id = r.request_id
JOIN clients c ON r.client_id = c.client_id
WHERE c.whatsapp = '5511999887766'
ORDER BY rp.created_at DESC
LIMIT 1;
