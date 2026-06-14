import { cn } from "@/lib/utils";

const tagColors: Record<string, string> = {
  FIJO: "bg-blue-100 text-blue-700",
  VARIABLE: "bg-purple-100 text-purple-700",
  HORMIGA: "bg-pink-100 text-pink-700",
};

const statusColors: Record<string, string> = {
  PAGADO: "bg-emerald-100 text-emerald-700",
  PENDIENTE: "bg-amber-100 text-amber-700",
};

export function TagBadge({ tag }: { tag: string }) {
  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", tagColors[tag] ?? "bg-gray-100 text-gray-600")}>
      {tag}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", statusColors[status] ?? "bg-gray-100 text-gray-600")}>
      {status}
    </span>
  );
}
