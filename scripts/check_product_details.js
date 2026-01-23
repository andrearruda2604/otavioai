import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = 'https://ifjtxtorvcztdmvsdskg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmanR4dG9ydmN6dGRtdnNkc2tnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODkwODksImV4cCI6MjA4MzU2NTA4OX0.zJaXA4UIbFW6RurY-CzYG9kvKhFyqQ1v4UCm0rZoJWY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkProduct() {
    console.log('🔍 Verificando produto "Semi Eixo Direito"...\n');

    // Buscar o produto na requests_products
    const { data: product, error } = await supabase
        .from('requests_products')
        .select('*')
        .ilike('prod_title', '%Semi Eixo Direito%')
        .single();

    if (error) {
        console.error('❌ Erro:', error);
        return;
    }

    console.log('📦 Produto encontrado:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ID: ${product.prod_id}`);
    console.log(`Título: ${product.prod_title}`);
    console.log(`Veículo: ${product.car_brand} ${product.car_model} ${product.car_year}`);
    console.log(`Quantidade: ${product.prod_quantity}`);
    console.log(`search_prod_ids: ${JSON.stringify(product.search_prod_ids)}`);
    console.log(`search_result: ${product.search_result}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (!product.search_prod_ids || product.search_prod_ids.length === 0) {
        console.log('❌ PROBLEMA IDENTIFICADO:');
        console.log('   O campo search_prod_ids está VAZIO ou NULL');
        console.log('   Por isso o botão "Detalhes" não aparece!\n');

        console.log('💡 SOLUÇÃO:');
        console.log('   Você precisa preencher o campo search_prod_ids com IDs de produtos do estoque.');
        console.log('   Exemplo: search_prod_ids = ["826", "827", "828"]\n');

        // Buscar produtos do estoque que podem ser relacionados
        console.log('🔎 Buscando produtos do estoque relacionados...');
        const { data: stockProducts } = await supabase
            .from('stock_products')
            .select('product_id, product_title, unit_price')
            .ilike('product_title', '%eixo%')
            .limit(5);

        if (stockProducts && stockProducts.length > 0) {
            console.log('\n📋 Produtos do estoque encontrados:');
            stockProducts.forEach(sp => {
                console.log(`   - ID: ${sp.product_id} | ${sp.product_title} | R$ ${sp.unit_price}`);
            });

            const ids = stockProducts.map(sp => sp.product_id.toString());
            console.log(`\n💡 Para vincular, execute este SQL no Supabase:`);
            console.log(`\nUPDATE requests_products`);
            console.log(`SET search_prod_ids = ARRAY[${ids.map(id => `'${id}'`).join(', ')}]`);
            console.log(`WHERE prod_id = ${product.prod_id};`);
        }
    } else {
        console.log('✅ O produto TEM search_prod_ids!');
        console.log(`   IDs: ${product.search_prod_ids.join(', ')}\n`);

        // Buscar os produtos do estoque
        const { data: stockProducts } = await supabase
            .from('stock_products')
            .select(`
                product_id,
                product_title,
                url,
                unit_price,
                suppliers (name, apex_domain)
            `)
            .in('product_id', product.search_prod_ids.map(id => parseInt(id)));

        console.log(`📦 Produtos do estoque vinculados: ${stockProducts?.length || 0}`);
        stockProducts?.forEach((sp, idx) => {
            console.log(`\n   ${idx + 1}. ${sp.product_title}`);
            console.log(`      Preço: R$ ${sp.unit_price}`);
            console.log(`      Fornecedor: ${sp.suppliers?.name || 'N/A'}`);
        });
    }
}

checkProduct().catch(console.error);
