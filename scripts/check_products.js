import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials not found in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductData() {
    console.log('Checking requests_products data...\n');

    // Get a sample of products
    const { data: products, error } = await supabase
        .from('requests_products')
        .select('prod_id, prod_title, search_prod_ids, search_result')
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Sample products:');
    products?.forEach(p => {
        console.log(`\nProd ID: ${p.prod_id}`);
        console.log(`Title: ${p.prod_title}`);
        console.log(`Search Result: ${p.search_result}`);
        console.log(`Search Prod IDs: ${JSON.stringify(p.search_prod_ids)}`);
    });

    // Check if any products have search_prod_ids
    const { data: withIds } = await supabase
        .from('requests_products')
        .select('prod_id, search_prod_ids')
        .not('search_prod_ids', 'is', null);

    console.log(`\n\nTotal products with search_prod_ids: ${withIds?.length || 0}`);

    if (withIds && withIds.length > 0) {
        console.log('\nSample product with IDs:');
        const sample = withIds[0];
        console.log(`Prod ID: ${sample.prod_id}`);
        console.log(`Search Prod IDs: ${JSON.stringify(sample.search_prod_ids)}`);

        // Try to fetch stock products for this sample
        if (sample.search_prod_ids && sample.search_prod_ids.length > 0) {
            const ids = sample.search_prod_ids.map(id => parseInt(id));
            console.log(`\nFetching stock products for IDs: ${ids}`);

            const { data: stockData, error: stockError } = await supabase
                .from('stock_products')
                .select(`
                    product_id,
                    product_title,
                    url,
                    unit_price,
                    suppliers (
                        name,
                        apex_domain
                    )
                `)
                .in('product_id', ids);

            if (stockError) {
                console.error('Stock error:', stockError);
            } else {
                console.log(`Found ${stockData?.length || 0} stock products`);
                stockData?.forEach(sp => {
                    console.log(`\n  - ${sp.product_title}`);
                    console.log(`    Price: R$ ${sp.unit_price}`);
                    console.log(`    Supplier: ${sp.suppliers?.name || 'N/A'}`);
                });
            }
        }
    }
}

checkProductData().catch(console.error);
