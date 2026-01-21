import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secretKey = process.env.SESSION_SECRET || 'super-secret-learning-assure-key-change-me'
const encodedKey = new TextEncoder().encode(secretKey)

type SessionPayload = {
    userId: string
    role: string
    expiresAt: Date
}

export async function createSession(userId: string, role: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const session = await new SignJWT({ userId, role, expiresAt })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(encodedKey)

    const cookieStore = await cookies()
    cookieStore.set('session', session, {
        httpOnly: true,
        secure: true,
        expires: expiresAt,
        sameSite: 'lax',
        path: '/',
    })
}

export async function getSession() {
    const cookieStore = await cookies()
    const session = cookieStore.get('session')?.value
    if (!session) return null

    try {
        const { payload } = await jwtVerify(session, encodedKey, {
            algorithms: ['HS256'],
        })
        return payload as SessionPayload
    } catch (error) {
        return null
    }
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
}
