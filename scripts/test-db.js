// @ts-nocheck
const { PrismaClient } = require('@prisma/client');
// const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('--- START DIAGNOSTICS (STANDALONE) ---');

    // 1. Test Bcrypt

    try {
        console.log('Testing bcrypt...');
        // bcryptjs might export object or be default
        const bcrypt = require('bcryptjs'); // Require here to avoid top level failure if missing
        const hashFn = bcrypt.hash || bcrypt.default?.hash;
        if (!hashFn) throw new Error('bcrypt.hash not found');

        const hashed = await hashFn('password123', 10);
        console.log('Bcrypt hash success:', hashed.substring(0, 10) + '...');
    } catch (e) {
        console.error('Bcrypt failed:', e);
    }


    // 2. Test Prisma Connection
    try {
        console.log('Testing Prisma connection...');
        const count = await prisma.user.count();
        console.log(`Prisma connected.User count: ${count} `);

        // 3. Test Create (Simulate Signup)
        const testEmail = `test_${Date.now()} @example.com`;
        console.log(`Testing user creation for ${testEmail}...`);
        const user = await prisma.user.create({
            data: {
                name: 'Test User',
                email: testEmail,
                password: 'hashedpassword',
                role: 'LEARNER'
            }
        });
        console.log('User created:', user.id);

        // Cleanup
        await prisma.user.delete({ where: { id: user.id } });
        console.log('Test user cleaned up.');

    } catch (e) {
        console.error('Prisma failed:', e);
    } finally {
        await prisma.$disconnect();
    }
    console.log('--- END DIAGNOSTICS ---');
}

main();
