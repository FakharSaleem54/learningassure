"use client";

import Link from "next/link";

export default function CertificateActions({ dashboardUrl = "/dashboard" }: { dashboardUrl?: string }) {
    return (
        <div style={{ marginTop: '2rem' }}>
            <button
                className="btn btn-primary"
                onClick={() => window.print()}
                style={{ marginRight: '1rem' }}
            >
                Download PDF
            </button>
            <Link
                href={dashboardUrl}
                className="btn"
                style={{ background: 'var(--border)' }}
            >
                Back to Dashboard
            </Link>
        </div>
    );
}
