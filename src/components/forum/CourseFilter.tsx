"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface CourseFilterProps {
    courses: { id: string; title: string }[];
    currentCourse?: string;
}

export default function CourseFilter({ courses, currentCourse }: CourseFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) {
            params.set("course", e.target.value);
        } else {
            params.delete("course");
        }
        router.push(`/community?${params.toString()}`);
    };

    return (
        <select
            value={currentCourse || ""}
            onChange={handleChange}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-[150px] transition-all"
        >
            <option value="">All Courses</option>
            {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
            ))}
        </select>
    );
}
