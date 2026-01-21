import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secretKey = process.env.SESSION_SECRET || 'super-secret-learning-assure-key-change-me'
const encodedKey = new TextEncoder().encode(secretKey)

export async function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get('session')?.value

    // Verify session
    let session = null
    if (sessionCookie) {
        try {
            const { payload } = await jwtVerify(sessionCookie, encodedKey, {
                algorithms: ['HS256'],
            })
            session = payload
        } catch (error) {
            console.error('Middleware session verification failed:', error)
            // Invalid session, treat as guest
        }
    }

    const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup')
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/profile')

    // 1. If user is logged in and tries to access Auth routes (Login/Signup), redirect to Dashboard
    if (session && isAuthRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // 2. If user is NOT logged in and tries to access Protected routes, redirect to Login
    if (!session && isProtectedRoute) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|assets).*)'],
}
