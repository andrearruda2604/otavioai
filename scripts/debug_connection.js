import dns from 'dns';

const domains = [
    'google.com',
    'ifjtxtorvcztdmvsdskg.supabase.co', // New Project ID from user
    'fqksfmowjxsqvkclhnvz.supabase.co'  // Old ID (for comparison)
];

console.log('🔍 Starting DNS Diagnosis...');

domains.forEach(domain => {
    console.log(`\nTesting: ${domain}`);
    dns.lookup(domain, (err, address, family) => {
        if (err) {
            console.error(`❌ FAILED to resolve ${domain}`);
            console.error(`   Error: ${err.message}`);
        } else {
            console.log(`✅ SUCCESS: ${domain} -> ${address} (IPv${family})`);
        }
    });
});
