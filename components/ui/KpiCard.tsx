import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  variant?: "default" | "green" | "red" | "amber";
}

const variants = {
  default: "border-gray-200",
  green: "border-emerald-500",
  red: "border-red-500",
  amber: "border-amber-400",
};

export function KpiCard({ label, value, sub, variant = "default" }: KpiCardProps) {
  return (
    <div className={cn("bg-white rounded-xl border p-5", variants[variant])}>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
