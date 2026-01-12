
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

async function inspectData() {
    console.log("--- Fetching recent requests ---");
    const { data: requests, error } = await supabase
        .from('requests')
        .select('request_id, ordered_prods, status')
        .limit(5);

    if (error) {
        console.error("Error:", error);
        return;
    }

    requests.forEach(r => {
        console.log(`\nID: ${r.request_id} | Status: ${r.status}`);
        console.log('Ordered Prods type:', typeof r.ordered_prods);
        console.log('Ordered Prods value:', JSON.stringify(r.ordered_prods, null, 2));
    });
}

inspectData();
