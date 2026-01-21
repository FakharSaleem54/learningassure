'use server'

import { z } from 'zod'
import prisma from '@/lib/prisma'
import { hash, compare } from 'bcryptjs'
import { createSession, deleteSession } from '@/lib/session'
import { redirect } from 'next/navigation'

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/

const signupSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters long.' }),
    email: z.string().regex(emailRegex, { message: 'Please enter a valid email address (e.g., user@domain.com).' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters long.' }),
    role: z.enum(['LEARNER', 'INSTRUCTOR']).default('LEARNER'),
})

const loginSchema = z.object({
    email: z.string().regex(emailRegex, { message: 'Invalid email format.' }),
    password: z.string(),
})

export type FormState = {
    errors?: {
        name?: string[]
        email?: string[]
        password?: string[]
    }
    message?: string
}

export async function signup(prevState: FormState | undefined, formData: FormData): Promise<FormState> {
    const validatedFields = signupSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role'),
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: undefined,
        }
    }

    const { name, email, password, role } = validatedFields.data

    try {
        const hashedPassword = await hash(password, 10)
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                status: 'ACTIVE', // Ensure status is set
            },
        })
        await createSession(user.id, user.role)
    } catch (error) {
        console.error('Signup error:', error)
        return {
            message: error instanceof Error ? error.message : 'Database Error: Failed to Create User.',
            errors: undefined
        }
    }

    redirect('/dashboard')
}

export async function login(prevState: FormState | undefined, formData: FormData): Promise<FormState> {
    const validatedFields = loginSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: undefined
        }
    }

    const { email, password } = validatedFields.data

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user || !(await compare(password, user.password))) {
            return {
                message: 'Invalid credentials.',
                errors: undefined
            }
        }

        await createSession(user.id, user.role)
    } catch (error) {
        console.error('Login error:', error)
        return {
            message: 'Database Error: Failed to Login.',
            errors: undefined
        }
    }

    redirect('/dashboard')
}

export async function logout() {
    await deleteSession()
    redirect('/login')
}
