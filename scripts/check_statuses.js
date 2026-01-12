import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ifjtxtorvcztdmvsdskg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmanR4dG9ydmN6dGRtdnNkc2tnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODkwODksImV4cCI6MjA4MzU2NTA4OX0.zJaXA4UIbFW6RurY-CzYG9kvKhFyqQ1v4UCm0rZoJWY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkStatuses() {
    console.log('🔍 Checking distinct statuses in requests table...');

    const { data, error } = await supabase
        .from('requests')
        .select('status');

    if (error) {
        console.error('❌ Error fetching statuses:', error);
        return;
    }

    if (data.length === 0) {
        console.log('⚠️ Requests table is empty.');
    } else {
        const statuses = [...new Set(data.map(item => item.status))];
        console.log('Distinct Statuses:', statuses);
    }
}

checkStatuses();
