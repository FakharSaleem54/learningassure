import { PrismaClient } from '@prisma/client';

// Disable prepared statements globally
const clientOptions = {
    // @ts-ignore - this is an internal private option
    __internal: { usePreparedStatements: false }
} as any;

if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient(clientOptions);
} else {
    if (!(global as any).prisma) {
        (global as any).prisma = new PrismaClient(clientOptions);
    }
    prisma = (global as any).prisma;
}

export default prisma;
