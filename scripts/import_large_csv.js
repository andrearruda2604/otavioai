import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import dns from 'dns';

// --- ENV LOADING (OPTIONAL LOGGING ONLY) ---
// Just to debug which file exists, but we won't use values from them.
const envFiles = ['.env.local', '.env'];
for (const file of envFiles) {
    const envPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(envPath)) {
        console.log(`Checking env file: ${file} exists.`);
    }
}

// FORCING HARDCODED VALUES WITH VERIFIED CREDENTIALS
// Project ID: ifjtxtorvcztdmvsdskg
const SUPABASE_URL = 'https://ifjtxtorvcztdmvsdskg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmanR4dG9ydmN6dGRtdnNkc2tnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODkwODksImV4cCI6MjA4MzU2NTA4OX0.zJaXA4UIbFW6RurY-CzYG9kvKhFyqQ1v4UCm0rZoJWY';

console.log('Testing connectivity to google.com...');
dns.lookup('google.com', (err) => {
    if (err) {
        console.error('❌ Network Error: Could not resolve google.com. You seem to be offline or have a DNS issue.');
        console.error(err);
    } else {
        console.log('✅ Network check passed (google.com resolved).');
    }
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: false
    }
});


// ARGS PARSING (RESTORED)
const args = process.argv.slice(2);
const filePath = args[0];
const tableName = args[1];

if (!filePath || !tableName) {
    console.error('Usage: node scripts/import_large_csv.js <path_to_csv> <table_name>');
    process.exit(1);
}

// --- BETTER CSV PARSING WITH MULTILINE SUPPORT ---

async function importCsv() {
    console.log(`🚀 Starting import of ${filePath} into table '${tableName}'...`);

    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let headers = [];
    let batch = [];
    const BATCH_SIZE = 50;
    let totalRows = 0;
    let isHeader = true;

    let lineBuffer = '';

    for await (const line of rl) {
        if (lineBuffer) {
            lineBuffer += '\n' + line;
        } else {
            lineBuffer = line;
        }

        const quoteCount = (lineBuffer.match(/"/g) || []).length;
        if (quoteCount % 2 !== 0) continue;

        const rowString = lineBuffer;
        lineBuffer = '';

        const row = parseCsvLine(rowString);
        if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

        if (isHeader) {
            headers = row;
            // Clean headers
            headers = headers.map(h => h.trim().replace(/^["']|["']$/g, ''));
            isHeader = false;
            console.log('Headers detected:', headers);
            continue;
        }

        if (row.length !== headers.length) {
            console.warn(`Skipping malformed line. Expected ${headers.length}, got ${row.length}`);
            continue;
        }

        const rowData = {};
        headers.forEach((header, index) => {
            let value = row[index];
            if (value === 'true') value = true;
            if (value === 'false') value = false;
            if (value === 'NULL' || value === '') value = null;

            if (typeof value === 'string' && value !== null) {
                value = value.replace(/\\n/g, '\n');
            }

            rowData[header] = value;
        });

        batch.push(rowData);

        if (batch.length >= BATCH_SIZE) {
            await insertBatchWithRetry(batch);
            batch = [];
            totalRows += BATCH_SIZE;
            console.log(`Processed ${totalRows} rows...`);
        }
    }

    if (batch.length > 0) {
        await insertBatchWithRetry(batch);
        totalRows += batch.length;
    }

    console.log(`✅ Import finished! Total rows: ${totalRows}`);
}

async function insertBatchWithRetry(rows, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        const { error } = await supabase.from(tableName).insert(rows);
        if (!error) return;

        console.warn(`⚠️ Batch insert failed (Attempt ${i + 1}/${maxRetries}):`);
        console.warn(error);

        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
    console.error('❌ Failed to insert batch after multiple attempts. Skipping this batch.');
}

function parseCsvLine(text) {
    const result = [];
    let curVal = '';
    let inQuote = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (char === '"') {
            if (inQuote && text[i + 1] === '"') {
                curVal += '"';
                i++;
            } else {
                inQuote = !inQuote;
            }
        } else if (char === ',' && !inQuote) {
            result.push(curVal);
            curVal = '';
        } else {
            curVal += char;
        }
    }
    result.push(curVal);

    return result.map(val => val);
}

importCsv().catch(console.error);
