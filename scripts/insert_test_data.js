import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ifjtxtorvcztdmvsdskg.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmanR4dG9ydmN6dGRtdnNkc2tnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODkwODksImV4cCI6MjA4MzU2NTA4OX0.zJaXA4UIbFW6RurY-CzYG9kvKhFyqQ1v4UCm0rZoJWY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function insertTestData() {
    console.log('🚀 Iniciando inserção de dados de teste...\n');

    try {
        // 1. Inserir ou buscar fornecedor
        console.log('📦 Verificando fornecedor...');
        let supplier;

        // Tentar buscar fornecedor existente
        const { data: existingSupplier } = await supabase
            .from('suppliers')
            .select()
            .eq('name', 'MegaPeças Online')
            .single();

        if (existingSupplier) {
            supplier = existingSupplier;
            console.log('✅ Fornecedor já existe:', supplier.name);
        } else {
            // Criar novo fornecedor
            const { data: newSupplier, error: supplierError } = await supabase
                .from('suppliers')
                .insert({
                    name: 'MegaPeças Online',
                    apex_domain: 'megapecas.com.br'
                })
                .select()
                .single();

            if (supplierError) {
                console.error('❌ Erro ao inserir fornecedor:', supplierError);
                return;
            }
            supplier = newSupplier;
            console.log('✅ Fornecedor criado:', supplier.name);
        }

        // 2. Inserir produtos no estoque
        console.log('\n📦 Inserindo produtos no estoque...');
        const stockProducts = [
            {
                product_title: 'Filtro de Óleo Mann W719/30 - Original',
                url: 'https://megapecas.com.br/filtro-oleo-mann-w719-30',
                unit_price: 45.90,
                brand: 'Mann',
                supplier_id: supplier.supplier_id,
                short_description: 'Filtro de óleo original Mann, alta qualidade'
            },
            {
                product_title: 'Filtro de Óleo Tecfil PSL140 - Premium',
                url: 'https://megapecas.com.br/filtro-oleo-tecfil-psl140',
                unit_price: 38.50,
                brand: 'Tecfil',
                supplier_id: supplier.supplier_id,
                short_description: 'Filtro de óleo premium Tecfil'
            },
            {
                product_title: 'Filtro de Óleo Bosch 0986AF1042 - Performance',
                url: 'https://megapecas.com.br/filtro-oleo-bosch-0986af1042',
                unit_price: 52.00,
                brand: 'Bosch',
                supplier_id: supplier.supplier_id,
                short_description: 'Filtro de óleo performance Bosch'
            }
        ];

        const { data: insertedProducts, error: productsError } = await supabase
            .from('stock_products')
            .insert(stockProducts)
            .select();

        if (productsError) {
            console.error('❌ Erro ao inserir produtos:', productsError);
            return;
        }
        console.log(`✅ ${insertedProducts.length} produtos inseridos no estoque`);

        // 3. Inserir ou buscar cliente
        console.log('\n👤 Verificando cliente...');
        let client;

        const { data: existingClient } = await supabase
            .from('clients')
            .select()
            .eq('whatsapp', '5511988776655')
            .single();

        if (existingClient) {
            client = existingClient;
            console.log('✅ Cliente já existe:', client.name_first, client.name_last);
        } else {
            const { data: newClient, error: clientError } = await supabase
                .from('clients')
                .insert({
                    name_first: 'Maria',
                    name_last: 'Santos',
                    whatsapp: '5511988776655',
                    company_name: 'Oficina Santos',
                    archived: false
                })
                .select()
                .single();

            if (clientError) {
                console.error('❌ Erro ao inserir cliente:', clientError);
                return;
            }
            client = newClient;
            console.log('✅ Cliente criado:', client.name_first, client.name_last);
        }

        // 4. Inserir solicitação
        console.log('\n📋 Inserindo solicitação...');
        const { data: request, error: requestError } = await supabase
            .from('requests')
            .insert({
                client_id: client.client_id,
                status: 'Em andamento',
                archived: false
            })
            .select()
            .single();

        if (requestError) {
            console.error('❌ Erro ao inserir solicitação:', requestError);
            return;
        }
        console.log('✅ Solicitação criada:', request.request_id);

        // 5. Inserir produto na solicitação com search_prod_ids
        console.log('\n🔗 Inserindo produto na solicitação com links para estoque...');
        const searchProdIds = insertedProducts.map(p => p.product_id.toString());

        const { data: requestProduct, error: reqProdError } = await supabase
            .from('requests_products')
            .insert({
                request_id: request.request_id,
                prod_title: 'Filtro de Óleo',
                car_brand: 'Honda',
                car_model: 'Civic',
                car_year: 2019,
                prod_quantity: 1,
                search_result: true,
                search_prod_ids: searchProdIds,
                status: 'Cotação enviada',
                deal_status: 'Pending Feedback'
            })
            .select()
            .single();

        if (reqProdError) {
            console.error('❌ Erro ao inserir produto na solicitação:', reqProdError);
            return;
        }

        console.log('✅ Produto na solicitação criado:', requestProduct.prod_title);
        console.log(`   - Vinculado a ${searchProdIds.length} produtos do estoque`);

        // 6. Verificar resultado final
        console.log('\n📊 Verificando dados inseridos...');
        const { data: verification } = await supabase
            .from('requests_products')
            .select(`
                prod_id,
                prod_title,
                car_brand,
                car_model,
                car_year,
                prod_quantity,
                search_prod_ids,
                requests (
                    request_id,
                    clients (
                        name_first,
                        name_last,
                        whatsapp
                    )
                )
            `)
            .eq('prod_id', requestProduct.prod_id)
            .single();

        console.log('\n✅ SUCESSO! Dados inseridos:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📦 Produto: ${verification.prod_title}`);
        console.log(`🚗 Veículo: ${verification.car_brand} ${verification.car_model} ${verification.car_year}`);
        console.log(`📊 Quantidade: ${verification.prod_quantity}`);
        console.log(`🔗 Produtos no estoque: ${verification.search_prod_ids.length}`);
        console.log(`👤 Cliente: ${verification.requests.clients.name_first} ${verification.requests.clients.name_last}`);
        console.log(`📱 WhatsApp: ${verification.requests.clients.whatsapp}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n🎉 Agora você pode testar no Pipeline!');
        console.log('   Procure por "Filtro de Óleo" e clique para ver todos os detalhes.');

    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

insertTestData();
