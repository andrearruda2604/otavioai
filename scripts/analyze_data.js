
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase credentials not found.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeData() {
    console.log("--- Analyzing 'requests' ---");
    const { data: requests, error: reqError } = await supabase
        .from('requests')
        .select('status, created_at, ordered_prods');

    if (reqError) {
        console.error("Error fetching requests:", reqError.message);
    } else {
        console.log(`Total Requests: ${requests.length}`);

        // Status Distribution
        const statusCounts = {};
        requests.forEach(r => {
            const s = r.status || 'Unknown';
            statusCounts[s] = (statusCounts[s] || 0) + 1;
        });
        console.log("Status Counts:", statusCounts);

        // Date Distribution (Last 7 days)
        // ... simplified
    }

    console.log("\n--- Analyzing 'requests_products' ---");
    const { count, error: prodError } = await supabase
        .from('requests_products')
        .select('*', { count: 'exact', head: true });

    if (prodError) {
        console.error("Error counting requests_products:", prodError.message);
    } else {
        console.log(`Total Rows in requests_products: ${count}`);
    }

    // Check one row of requests_products to see columns
    const { data: sampleProd } = await supabase.from('requests_products').select('*').limit(1);
    console.log("Sample Product Row:", sampleProd);
}

analyzeData();
