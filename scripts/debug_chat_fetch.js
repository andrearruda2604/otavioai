import { createClient } from '@supabase/supabase-js';

// Credentials (Verified working in previous steps)
const SUPABASE_URL = 'https://ifjtxtorvcztdmvsdskg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmanR4dG9ydmN6dGRtdnNkc2tnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODkwODksImV4cCI6MjA4MzU2NTA4OX0.zJaXA4UIbFW6RurY-CzYG9kvKhFyqQ1v4UCm0rZoJWY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TARGET_ID = '5511982852108';

async function debugChat() {
    console.log(`🔍 Debugging Chat for Session ID: ${TARGET_ID}`);

    // 1. Try exact match
    console.log('\n--- Attempt 1: Exact Match ---');
    const { data: exactData, error: exactError } = await supabase
        .from('n8n_chat_histories')
        .select('*')
        .eq('session_id', TARGET_ID);

    if (exactError) {
        console.error('❌ Error fetching exact match:', exactError);
    } else {
        console.log(`Results found: ${exactData.length}`);
        if (exactData.length > 0) {
            console.log('Sample row:', JSON.stringify(exactData[0], null, 2));
        }
    }

    // 2. If empty, try to list ALL IDs to see what format they are in
    if (!exactData || exactData.length === 0) {
        console.log('\n--- Attempt 2: Listing top 5 rows to check format ---');
        const { data: allData, error: allError } = await supabase
            .from('n8n_chat_histories')
            .select('session_id')
            .limit(5);

        if (allError) {
            console.error('❌ Error listing all rows:', allError);
        } else {
            console.log('Top 5 IDs in DB:', allData);

            // Check for whitespace issues
            const hasWhitespace = allData.some(r => r.session_id.trim() !== r.session_id);
            if (hasWhitespace) console.warn('⚠️ WARNING: Some IDs have leading/trailing whitespace!');
        }
    }
}

debugChat();
