const fs = require('fs');
const path = require('path');
const net = require('net');
const url = require('url');

// Simple .env parser
try {
    const envPath = path.resolve(process.cwd(), '.env');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    });
    console.log("Loaded keys:", Object.keys(process.env).filter(k => !k.includes('npm_')));
    fs.appendFileSync('db_connection_results.txt', "Loaded keys: " + Object.keys(process.env).filter(k => k.includes('URL')).join(', ') + '\n');
} catch (e) {
    console.log('Could not read .env file:', e.message);
}

function checkConnection(connectionString, name) {
    if (!connectionString) {
        console.log(`${name}: Not defined`);
        return;
    }

    try {
        const parsed = new url.URL(connectionString);
        const host = parsed.hostname;
        const port = parsed.port || 5432;

        const startMsg = `Testing ${name} -> Host: '${host}', Port: ${port}...`;
        console.log(startMsg);
        fs.appendFileSync('db_connection_results.txt', startMsg + '\n');

        const socket = new net.Socket();
        socket.setTimeout(8000);

        socket.on('connect', () => {
            const msg = `${name}: Connected successfully!`;
            console.log(msg);
            fs.appendFileSync('db_connection_results.txt', msg + '\n');
            socket.destroy();
        });

        socket.on('timeout', () => {
            const msg = `${name}: Timeout (5s)`;
            console.log(msg);
            fs.appendFileSync('db_connection_results.txt', msg + '\n');
            socket.destroy();
        });

        socket.on('error', (err) => {
            const msg = `${name}: Error - ${err.message}`;
            console.log(msg);
            fs.appendFileSync('db_connection_results.txt', msg + '\n');
        });
        socket.connect(port, host);

    } catch (e) {
        console.log(`${name}: Invalid URL - ${e.message}`);
    }
}

// Hardcoded fallback for debugging if .env loading fails
const FALLBACK_DB_URL = "postgresql://postgres.tbjnroriggjjguaumnvg:Nl4BMzlfUjMk0Zr1@db.tbjnroriggjjguaumnvg.supabase.co:5432/postgres";

console.log("Checking DB connections...");
const dbUrl = process.env.DATABASE_URL || FALLBACK_DB_URL;
const directUrl = process.env.DIRECT_URL || dbUrl;

checkConnection(dbUrl, "DATABASE_URL");
checkConnection(directUrl, "DIRECT_URL");
