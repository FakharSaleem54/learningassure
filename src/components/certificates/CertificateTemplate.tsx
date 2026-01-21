'use client';

import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface CertificateProps {
    data: {
        id: string;
        user: { name: string | null };
        course: { title: string; instructor: { name: string | null } };
        issuedAt: Date | string;
    };
}

export default function CertificateTemplate({ data }: CertificateProps) {
    const certificateRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        if (!certificateRef.current) return;
        setIsGenerating(true);

        try {
            // Wait for images depending on how they are loaded, but for now simple checks
            const canvas = await html2canvas(certificateRef.current, {
                scale: 2, // Higher resolution
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            } as any);

            const imgData = canvas.toDataURL('image/png');
            // A4 landscape: 297mm x 210mm
            const pdf = new jsPDF('l', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Certificate-${data.course.title.replace(/\s+/g, '-')}.pdf`);
        } catch (error) {
            console.error('PDF Generation failed', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6">
            <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="btn btn-primary flex items-center gap-2"
            >
                {isGenerating ? <Loader2 className="animate-spin" /> : <Download />}
                {isGenerating ? 'Generating PDF...' : 'Download Certificate'}
            </button>

            {/* Certificate Container - Rendered on screen and captured for PDF */}
            <div
                ref={certificateRef}
                className="w-[800px] h-[600px] bg-white relative p-12 text-center text-gray-900 shadow-2xl overflow-hidden"
                style={{
                    border: '20px solid #4169E1', // Royal Blue border
                    backgroundImage: 'radial-gradient(circle at center, #ffffff 0%, #f8f9fa 100%)'
                }}
            >
                {/* Decorative Corners */}
                <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-orange-500"></div>
                <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-orange-500"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-orange-500"></div>
                <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-orange-500"></div>

                {/* Header */}
                <div className="mt-8 mb-4">
                    <h1 className="text-5xl font-serif text-blue-900 font-bold tracking-wider uppercase mb-2">Certificate</h1>
                    <h2 className="text-2xl font-serif text-orange-600 uppercase tracking-widest">of Completion</h2>
                </div>

                {/* Content */}
                <div className="mt-12 space-y-6">
                    <p className="text-lg text-gray-600 italic">This is to certify that</p>

                    <h3 className="text-4xl font-bold text-gray-900 border-b-2 border-gray-300 inline-block px-12 py-2 min-w-[400px]">
                        {data.user.name || 'Learner'}
                    </h3>

                    <p className="text-lg text-gray-600 italic mt-4">has successfully completed the course</p>

                    <h4 className="text-3xl font-bold text-blue-800 mt-2">
                        {data.course.title}
                    </h4>
                </div>

                {/* Footer / Signatures */}
                <div className="absolute bottom-16 left-12 right-12 flex justify-between items-end px-8">
                    <div className="text-center">
                        <div className="w-48 border-b border-gray-400 mb-2"></div>
                        <p className="font-bold text-gray-700">{data.course.instructor.name || 'Instructor'}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Instructor</p>
                    </div>

                    <div className="text-center">
                        {/* Mock Seal */}
                        <div className="w-24 h-24 rounded-full bg-blue-900 text-white flex items-center justify-center font-serif font-bold border-4 border-orange-400 shadow-lg mx-auto mb-4">
                            <div className="text-center text-[10px] leading-tight">
                                LEARNING<br />ASSURE<br />OFFICIAL<br />SEAL
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 font-mono">ID: {data.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-gray-400 font-mono">
                            {new Date(data.issuedAt).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="w-48 border-b border-gray-400 mb-2"></div>
                        <p className="font-bold text-gray-700">Learning Assure</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Platform Director</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
