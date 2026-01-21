import { getCertificateById } from '@/actions/certificate-actions';
import CertificateTemplate from '@/components/certificates/CertificateTemplate';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function CertificatePage({ params }: PageProps) {
    const { id } = await params;
    const result = await getCertificateById(id);

    if (!result.success) {
        if (result.error === "Unauthorized") redirect('/login');
        // Handle other errors or not found
        return (
            <div className="container py-12 text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
                <p className="text-gray-600 mb-6">{result.error}</p>
                <Link href="/dashboard" className="text-blue-600 hover:underline">
                    Return to Dashboard
                </Link>
            </div>
        );
    }

    const { certificate } = result;

    if (!certificate) {
        return notFound();
    }

    // Transform data for template
    const certData = {
        id: certificate.id,
        user: { name: certificate.user.name },
        course: {
            title: certificate.enrollment.course.title,
            instructor: { name: certificate.enrollment.course.instructor.name }
        },
        issuedAt: certificate.issuedAt
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="bg-white border-b shadow-sm mb-8">
                <div className="container py-4">
                    <Link href="/dashboard" className="flex items-center text-gray-500 hover:text-gray-900 transition-colors">
                        <ChevronLeft size={20} />
                        <span className="ml-1 font-medium">Back to Dashboard</span>
                    </Link>
                </div>
            </div>

            <div className="container">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Course Certificate</h1>
                    <p className="text-gray-500 mt-2">Verified Unique ID: {certificate.id}</p>
                </div>

                <div className="flex justify-center">
                    <CertificateTemplate data={certData} />
                </div>
            </div>
        </div>
    );
}
