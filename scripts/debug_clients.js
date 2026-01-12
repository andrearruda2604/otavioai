import { createClient } from '@supabase/supabase-js';

// Credentials
const SUPABASE_URL = 'https://ifjtxtorvcztdmvsdskg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmanR4dG9ydmN6dGRtdnNkc2tnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODkwODksImV4cCI6MjA4MzU2NTA4OX0.zJaXA4UIbFW6RurY-CzYG9kvKhFyqQ1v4UCm0rZoJWY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectClients() {
    console.log('🔍 Inspecting Clients Table...');

    const { data: results, error } = await supabase
        .from('requests')
        .select('*')
        .limit(5);

    if (error) {
        console.error('❌ Error fetching requests:', error);
        return;
    }

    if (results.length === 0) {
        console.log('⚠️ Requests table is empty.');
    } else {
        console.log('Found requests:', results.length);
    }
}

inspectClients();
