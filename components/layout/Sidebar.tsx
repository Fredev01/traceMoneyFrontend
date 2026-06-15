"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, TrendingUp, CreditCard, Wallet, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/gastos", label: "Gastos", icon: Receipt },
  { href: "/ingresos", label: "Ingresos", icon: TrendingUp },
  { href: "/tarjetas", label: "Tarjetas", icon: Wallet },
  { href: "/deudas", label: "Deudas", icon: CreditCard },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="px-5 py-6 border-b border-gray-200">
        <span className="text-xl font-bold text-brand-blue">TraceMoney</span>
        <p className="text-xs text-gray-400 mt-0.5">Finanzas personales</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              pathname === href
                ? "bg-brand-blue text-white font-medium"
                : "text-gray-600 hover:bg-brand-light hover:text-brand-blue"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
