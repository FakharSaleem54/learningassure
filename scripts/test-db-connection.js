const { Client } = require('pg');
const dns = require('dns');
const url = require('url');
require('dotenv').config();

async function testConnection() {
    console.log('--- Database Connection Diagnostic ---');

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ DATABASE_URL is not defined');
        return;
    }

    // Mask password for logging
    const maskedUrl = connectionString.replace(/:([^@]+)@/, ':****@');
    console.log(`URL: ${maskedUrl}`);

    const parsed = url.parse(connectionString);
    const host = parsed.hostname;

    console.log(`\n1. Testing DNS Resolution for: ${host}`);

    try {
        const aRecords = await dns.promises.resolve(host, 'A');
        console.log('✅ IPv4 (A records):', aRecords);
    } catch (err) {
        console.error('❌ IPv4 Resolution Failed:', err.message);
    }

    try {
        const aaaaRecords = await dns.promises.resolve(host, 'AAAA');
        console.log('✅ IPv6 (AAAA records):', aaaaRecords);
    } catch (err) {
        console.log('ℹ️ No IPv6 records found or resolution failed');
    }

    console.log('\n2. Testing Connection...');
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false } // Supabase requires SSL
    });

    try {
        await client.connect();
        console.log('✅ Connection Successful!');
        const res = await client.query('SELECT NOW()');
        console.log('Query Result:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('❌ Connection Failed:', err);
        console.error('Stack:', err.stack);
    }
}

testConnection();
