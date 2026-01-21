import { Metadata } from 'next';
import HelpCenter from '@/components/support/HelpCenter';

export const metadata: Metadata = {
    title: 'Help & Support | Learning Assure',
    description: 'Find answers to your questions, browse FAQs, and get support for Learning Assure.',
};

export default function SupportPage() {
    return (
        <main className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 py-16 md:py-24 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-primary to-blue-600 mb-6 pb-2">
                        Help & Support Center
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        We're here to help. Search our knowledge base or get in touch with our team.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <HelpCenter />
        </main>
    );
}
