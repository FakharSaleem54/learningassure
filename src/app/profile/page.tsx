import { prisma } from '@/lib/prisma';
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import PublicProfileForms from "@/components/PublicProfileForms";

export default async function ProfilePage() {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        }
    });

    if (!user) {
        redirect('/login');
    }

    return <PublicProfileForms user={user} />;
}
