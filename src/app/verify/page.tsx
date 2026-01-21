import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function VerifyPage({ params, searchParams }: { params: Promise<{ id?: string }>, searchParams: Promise<{ id?: string }> }) {
    const resolvedSearchParams = await searchParams;
    const resolvedParams = await params;
    const queryId = resolvedSearchParams.id || resolvedParams?.id

    let result = null
    if (queryId) {
        result = await prisma.certificate.findUnique({
            where: { id: queryId as string },
            include: {
                user: true,
                enrollment: { include: { course: true } }
            }
        })
    }

    return (
        <div className="container" style={{ padding: '4rem 1rem', maxWidth: '600px', textAlign: 'center' }}>
            <h1 style={{ marginBottom: '2rem' }}>Certificate Verification</h1>

            <form style={{ display: 'flex', gap: '0.5rem', marginBottom: '3rem' }}>
                <input
                    name="id"
                    defaultValue={queryId}
                    placeholder="Enter Certificate ID"
                    required
                    style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
                />
                <button className="btn btn-primary">Verify</button>
            </form>

            {queryId && !result && (
                <div style={{ padding: '2rem', background: 'var(--error)', color: 'white', borderRadius: 'var(--radius)' }}>
                    Certificate ID not found.
                </div>
            )}

            {result && (
                <div style={{ padding: '2rem', background: 'var(--surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', textAlign: 'left', border: '1px solid var(--secondary)' }}>
                    <h3 style={{ color: 'var(--secondary)', marginBottom: '1rem', textAlign: 'center' }}>✅ Valid Certificate</h3>
                    <p><strong>Issued To:</strong> {result.user.name}</p>
                    <p><strong>Course:</strong> {result.enrollment.course.title}</p>
                    <p><strong>Date:</strong> {new Date(result.issuedAt).toLocaleDateString()}</p>
                    <Link href={`/certificates/${result.id}`} style={{ display: 'block', marginTop: '1rem', color: 'var(--primary)', textAlign: 'center' }}>View Certificate</Link>
                </div>
            )}
        </div>
    )
}
