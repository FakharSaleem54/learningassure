'use server'

import { prisma } from '@/lib/prisma';
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getOrCreateCertificate(courseId: string) {
    const session = await getSession();
    if (!session || !session.userId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // 1. Verify Enrollment & Completion
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                userId: session.userId,
                courseId: courseId
            },
            include: {
                course: {
                    include: {
                        instructor: {
                            select: { name: true }
                        }
                    }
                },
                user: {
                    select: { name: true }
                },
                certificate: true
            }
        });

        if (!enrollment) {
            return { success: false, error: "Enrollment not found" };
        }

        // Allow certificate generation if progress is 100% OR completed flag is true
        // (Handling legacy or different completion tracking logic)
        if (!enrollment.completed && Number(enrollment.progress) < 100) {
            return { success: false, error: "Course not completed yet" };
        }

        // 2. Return existing certificate if found
        if (enrollment.certificate) {
            return { success: true, certificate: enrollment.certificate, course: enrollment.course, user: enrollment.user };
        }

        // 3. Create new certificate
        const newCertificate = await prisma.certificate.create({
            data: {
                userId: session.userId,
                enrollmentId: enrollment.id
            }
        });

        revalidatePath('/dashboard');

        return {
            success: true,
            certificate: newCertificate,
            course: enrollment.course,
            user: enrollment.user
        };

    } catch (error) {
        console.error("Certificate generation error:", error);
        return { success: false, error: "Failed to generate certificate" };
    }
}

export async function getCertificateById(certificateId: string) {
    const session = await getSession();
    // Public verification allowed? Or restricted?
    // User requested: "Only the learner who earned the certificate can access it."
    // But usually certificates are shareable. I'll implement strict ownership check for now 
    // to strictly follow requirements, but arguably this limits utility.

    if (!session || !session.userId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const certificate = await prisma.certificate.findUnique({
            where: { id: certificateId },
            include: {
                enrollment: {
                    include: {
                        course: {
                            include: {
                                instructor: {
                                    select: { name: true }
                                }
                            }
                        }
                    }
                },
                user: {
                    select: { name: true, id: true } // Need ID to check ownership
                }
            }
        });

        if (!certificate) {
            return { success: false, error: "Certificate not found" };
        }

        if (certificate.userId !== session.userId) {
            return { success: false, error: "Access denied. You do not own this certificate." };
        }

        return { success: true, certificate };

    } catch (error) {
        console.error("Certificate fetch error:", error);
        return { success: false, error: "Failed to fetch certificate" };
    }
}

export async function getUserCertificates() {
    const session = await getSession();
    if (!session || !session.userId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const certificates = await prisma.certificate.findMany({
            where: { userId: session.userId },
            include: {
                enrollment: {
                    include: {
                        course: {
                            select: {
                                title: true,
                                description: true
                            }
                        }
                    }
                }
            },
            orderBy: { issuedAt: 'desc' }
        });

        return { success: true, certificates };
    } catch (error) {
        console.error("Fetch user certificates error:", error);
        return { success: false, error: "Failed to fetch certificates" };
    }
}
