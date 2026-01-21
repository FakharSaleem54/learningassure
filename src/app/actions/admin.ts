"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from "next/cache";

export async function toggleUserStatus(userId: string, currentStatus: string) {
    try {
        const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
        await prisma.user.update({
            where: { id: userId },
            data: { status: newStatus },
        });
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle user status:", error);
        return { success: false, error: "Failed to update user status" };
    }
}

export async function updateUserRole(userId: string, newRole: string) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
        });
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Failed to update user role:", error);
        return { success: false, error: "Failed to update user role" };
    }
}

export async function updateCourseStatus(courseId: string, status: string) {
    try {
        const isPublished = status === 'ACTIVE';
        await prisma.course.update({
            where: { id: courseId },
            data: {
                status: status,
                published: isPublished
            },
        });
        revalidatePath("/admin/courses");
        return { success: true };
    } catch (error) {
        console.error("Failed to update course status:", error);
        return { success: false, error: "Failed to update course status" };
    }
}

import { hash } from "bcryptjs";

export async function createUser(data: FormData) {
    const name = data.get("name") as string;
    const email = data.get("email") as string;
    const password = data.get("password") as string;
    const role = data.get("role") as string;

    if (!name || !email || !password || !role) {
        return { success: false, error: "Missing required fields" };
    }

    try {
        const hashedPassword = await hash(password, 10);
        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                status: "ACTIVE",
            },
        });
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Failed to create user:", error);
        return { success: false, error: "Failed to create user. Email might be taken." };
    }
}

export async function updateUser(data: FormData) {
    const userId = data.get("userId") as string;
    const name = data.get("name") as string;
    const email = data.get("email") as string;
    const role = data.get("role") as string;
    const password = data.get("password") as string;

    if (!userId || !name || !email || !role) {
        return { success: false, error: "Missing required fields" };
    }

    try {
        const updateData: any = { name, email, role };
        if (password && password.trim() !== "") {
            updateData.password = await hash(password, 10);
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Failed to update user:", error);
        return { success: false, error: "Failed to update user." };
    }
}

export async function deleteUser(userId: string) {
    try {
        await prisma.user.delete({
            where: { id: userId },
        });
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete user:", error);
        return { success: false, error: "Failed to delete user." };
    }
}
