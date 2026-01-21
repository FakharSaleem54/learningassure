'use client';

import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Mail, MessageCircle, FileText } from 'lucide-react';

// FAQ Data Type
type FAQItem = {
    question: string;
    answer: string;
    category: string;
};

// Initial FAQ Data
const faqData: FAQItem[] = [
    {
        category: 'Getting Started',
        question: 'How do I create an account?',
        answer: 'To create an account, click the "Sign Up" button in the top right corner of the homepage. Fill in your details, including your name, email, and password, then click "Create Account". You will receive a confirmation email to verify your account.'
    },
    {
        category: 'Getting Started',
        question: 'Is Learning Assure free to use?',
        answer: 'Learning Assure offers both free and paid courses. Signing up is free, and you can browse our catalog to find free content. Premium courses require a one-time purchase or subscription, depending on the course.'
    },
    {
        category: 'Courses',
        question: 'How do I enroll in a course?',
        answer: 'Once you find a course you are interested in, click on the course card to view details. Then, click the "Enroll Now" or "Buy Now" button. Follow the prompts to complete your enrollment.'
    },
    {
        category: 'Courses',
        question: 'Can I download course materials?',
        answer: 'Yes, many instructors provide downloadable resources such as PDFs, slides, and code snippets. Look for the "Resources" tab or download icons within the course player.'
    },
    {
        category: 'Account & Billing',
        question: 'How do I reset my password?',
        answer: 'If you have forgotten your password, go to the Login page and click "Forgot Password?". Enter your email address, and we will send you instructions to reset it.'
    },
    {
        category: 'Account & Billing',
        question: 'What payment methods do you accept?',
        answer: 'We accept major credit cards (Visa, MasterCard, American Express), PayPal, and other regional payment methods depending on your location.'
    },
    {
        category: 'Troubleshooting',
        question: 'The video player is not loading properly.',
        answer: 'Please check your internet connection and try refreshing the page. If the issue persists, try clearing your browser cache or using a different browser. If you still have trouble, contact our support team.'
    },
];

export default function HelpCenter() {
    const [searchQuery, setSearchQuery] = useState('');
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const filteredFAQs = faqData.filter(item =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const categories = Array.from(new Set(faqData.map(item => item.category)));

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">

            {/* Search Section */}
            <div className="mb-12 text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">How can we help you today?</h2>
                <div className="relative max-w-xl mx-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm shadow-sm transition-shadow"
                        placeholder="Search for answers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Quick Categories - Only show if not searching or if items match */}
            {searchQuery === '' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-center group">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
                            <FileText className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Documentation</h3>
                        <p className="text-sm text-gray-500">Comprehensive guides for all features.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-center group">
                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-100 transition-colors">
                            <MessageCircle className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Community Forum</h3>
                        <p className="text-sm text-gray-500">Join discussions with other learners.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-center group">
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-100 transition-colors">
                            <Mail className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Contact Support</h3>
                        <p className="text-sm text-gray-500">Get direct help from our team.</p>
                    </div>
                </div>
            )}

            {/* FAQs Accordion */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-900">Frequently Asked Questions</h3>
                </div>

                <div className="divide-y divide-gray-200">
                    {filteredFAQs.length > 0 ? (
                        filteredFAQs.map((faq, index) => (
                            <div key={index} className="group">
                                <button
                                    onClick={() => toggleAccordion(index)}
                                    className="w-full flex items-center justify-between p-6 text-left focus:outline-none hover:bg-gray-50 transition-colors"
                                    aria-expanded={openIndex === index}
                                >
                                    <div>
                                        <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-1 block">{faq.category}</span>
                                        <span className="text-lg font-medium text-gray-900 group-hover:text-primary transition-colors">{faq.question}</span>
                                    </div>
                                    <span className="ml-6 flex-shrink-0">
                                        {openIndex === index ? (
                                            <ChevronUp className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
                                        )}
                                    </span>
                                </button>
                                {openIndex === index && (
                                    <div className="px-6 pb-6 pt-0 bg-gray-50/50">
                                        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="p-6 text-center text-gray-500">
                            No results found for "{searchQuery}". Try a different keyword.
                        </div>
                    )}
                </div>
            </div>

            {/* Contact Section */}
            <div id="contact" className="mt-16 bg-gradient-to-br from-primary to-blue-700 rounded-2xl shadow-lg p-8 md:p-12 text-center text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-4">Still need help?</h3>
                    <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                        Our support team is available 24/7 to assist you with any issues or questions you may have.
                        Don't hesitate to reach out!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="mailto:support@learningassure.com"
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-primary bg-white hover:bg-gray-100 transition-colors shadow-sm"
                        >
                            <Mail className="h-5 w-5 mr-2" />
                            Email Support
                        </a>
                        <a
                            href="/community"
                            className="inline-flex items-center justify-center px-6 py-3 border border-white/30 text-base font-medium rounded-lg text-white bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
                        >
                            <MessageCircle className="h-5 w-5 mr-2" />
                            Ask Community
                        </a>
                    </div>
                </div>

                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl"></div>
            </div>
        </div>
    );
}
