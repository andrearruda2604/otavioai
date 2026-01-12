
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
// Also try .env.local just in case
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log("URL:", supabaseUrl);
console.log("Key available:", !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase credentials not found in .env or .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Checking if 'archived' column exists in 'requests'...");

    const { data, error } = await supabase
        .from('requests')
        .select('request_id, archived')
        .limit(1);

    if (error) {
        console.error("Error selecting 'archived':", error.message);
        // console.error("Details:", error); // Only if needed
        return;
    }

    console.log("Select success. Data sample:", data);

    console.log("\nChecking 'clients' table...");
    const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('client_id, archived')
        .limit(1);

    if (clientError) {
        console.error("Error selecting 'archived' from clients:", clientError.message);
    } else {
        console.log("Clients Select success. Data sample:", clientData);
    }
}

checkSchema();
