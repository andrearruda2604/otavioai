import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ifjtxtorvcztdmvsdskg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmanR4dG9ydmN6dGRtdnNkc2tnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODkwODksImV4cCI6MjA4MzU2NTA4OX0.zJaXA4UIbFW6RurY-CzYG9kvKhFyqQ1v4UCm0rZoJWY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findStockProducts() {
    console.log('🔎 Buscando produtos "eixo" no estoque...\n');

    const { data: products } = await supabase
        .from('stock_products')
        .select('product_id, product_title, unit_price, brand')
        .or('product_title.ilike.%eixo%,product_title.ilike.%semi%')
        .limit(10);

    if (products && products.length > 0) {
        console.log(`✅ Encontrados ${products.length} produtos:\n`);
        products.forEach((p, idx) => {
            console.log(`${idx + 1}. ID: ${p.product_id}`);
            console.log(`   ${p.product_title}`);
            console.log(`   Marca: ${p.brand || 'N/A'} | Preço: R$ ${p.unit_price || 'N/A'}\n`);
        });

        const ids = products.slice(0, 3).map(p => p.product_id);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💡 Para vincular os 3 primeiros ao produto 826:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log(`UPDATE requests_products`);
        console.log(`SET search_prod_ids = ARRAY[${ids.map(id => `'${id}'`).join(', ')}]`);
        console.log(`WHERE prod_id = 826;`);
    } else {
        console.log('❌ Nenhum produto encontrado no estoque.');
        console.log('   Você precisa importar produtos primeiro!');
    }
}

findStockProducts().catch(console.error);
