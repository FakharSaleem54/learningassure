import { LucideIcon } from "lucide-react";

interface StatsCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
}

export default function StatsCard({ label, value, icon: Icon, trend, trendUp }: StatsCardProps) {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{label}</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
                </div>
                <div className={`p-3 rounded-lg ${trendUp ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                    <Icon size={24} />
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center gap-2">
                    <span className={`text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                        {trend}
                    </span>
                    <span className="text-xs text-gray-400">vs last month</span>
                </div>
            )}
        </div>
    );
}
