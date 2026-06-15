"use client";
import { useEffect, useState } from "react";
import {
  ComposedChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import { KpiCard } from "@/components/ui/KpiCard";
import { api } from "@/lib/api";
import { formatMXN, monthName, currentYearMonth } from "@/lib/utils";
import type { DashboardSummary } from "@/lib/types";

export default function DashboardPage() {
  const { year, month } = currentYearMonth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardSummary>(`/analytics/dashboard?year=${year}&month=${month}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year, month]);

  if (loading) return <div className="text-gray-500 text-sm">Cargando dashboard...</div>;
  if (!data) return <div className="text-red-500 text-sm">Error al cargar datos.</div>;

  const historyData = data.monthly_history.map((h) => ({
    label: `${monthName(h.month).slice(0, 3)} ${h.year}`,
    Ingresos: Number(h.total_income),
    Gastos: Number(h.total_expenses),
    Deudas: Number(h.total_debt_payments),
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {monthName(month)} {year}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Ingresos del mes"
          value={formatMXN(data.total_income)}
          variant="green"
        />
        <KpiCard
          label="Gastos del mes"
          value={formatMXN(data.total_expenses)}
          variant="red"
        />
        <KpiCard
          label="Pagos de deuda"
          value={formatMXN(data.total_debt_payments)}
          variant="amber"
        />
        <KpiCard
          label="Balance neto"
          value={formatMXN(data.net_balance)}
          variant={Number(data.net_balance) >= 0 ? "green" : "red"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown por categoría */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">Gastos por categoría</h2>
          {data.category_breakdown.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data.category_breakdown}
                  dataKey="total"
                  nameKey="category_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data.category_breakdown.map((c) => (
                    <Cell key={c.category_id} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatMXN(v as number)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Deuda total activa */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">Deuda activa total</h2>
          <p className="text-3xl font-bold text-amber-600 mb-4">
            {formatMXN(data.total_active_debt)}
          </p>
          <div className="space-y-3">
            {data.active_debts.map((d) => (
              <div key={d.plan_id}>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>
                    {d.bank_name} · {d.concept}
                  </span>
                  <span>{d.paid_percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-brand-blue h-2 rounded-full"
                    style={{ width: `${d.paid_percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>Restante: {formatMXN(d.remaining_balance)}</span>
                  {d.next_payment_date && (
                    <span>
                      Próx: {formatMXN(d.next_payment_amount ?? 0)} · {d.next_payment_date}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {data.active_debts.length === 0 && (
              <p className="text-gray-400 text-sm">Sin deudas activas</p>
            )}
          </div>
        </div>
      </div>

      {/* Balance mensual histórico */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-600 mb-4">Balance mensual (últimos 6 meses)</h2>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={historyData}>
            <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 12 }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatMXN(v as number)} />
            <Legend />
            <Bar dataKey="Ingresos" fill="#10b981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Gastos" fill="#ef4444" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Deudas" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Etiquetas */}
      {data.tag_breakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">Distribución por etiqueta</h2>
          <div className="flex gap-6">
            {data.tag_breakdown.map((t) => (
              <div key={t.tag} className="text-center">
                <p className="text-2xl font-bold">{t.percentage}%</p>
                <p className="text-xs text-gray-500 mt-1">{t.tag}</p>
                <p className="text-sm text-gray-600">{formatMXN(t.total)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tarjetas de débito */}
      {data.debit_accounts && data.debit_accounts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">Saldo tarjetas de débito</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {data.debit_accounts.map((d) => (
              <div key={d.account_id} className="rounded-lg p-4 border border-gray-100 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-gray-500 truncate">{d.bank_name}</span>
                </div>
                <p className={`text-xl font-bold ${Number(d.balance) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {formatMXN(d.balance)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado tarjetas de crédito */}
      {data.credit_card_status && data.credit_card_status.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">Tarjetas de crédito</h2>
          <div className="space-y-5">
            {data.credit_card_status.map((c) => {
              const pct = Math.min(Math.max(Number(c.utilization_pct), 0), 100);
              const barColor = pct >= 80 ? "#ef4444" : pct >= 50 ? "#f59e0b" : "#10b981";
              const cutAlert = Number(c.days_to_cut) <= 5;
              const payAlert = Number(c.days_to_payment) <= 5;
              return (
                <div key={c.account_id} className="border border-gray-100 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="font-medium text-sm">{c.bank_name}</span>
                    </div>
                    <div className="flex gap-3 text-xs">
                      {cutAlert && (
                        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          Corte en {c.days_to_cut}d
                        </span>
                      )}
                      {payAlert && (
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          Pago en {c.days_to_payment}d
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Disponible</p>
                      <p className="font-semibold text-green-600">{formatMXN(c.available_limit)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Cargos ciclo</p>
                      <p className="font-semibold text-amber-600">{formatMXN(c.current_cycle_charges)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Próximo pago</p>
                      <p className="font-semibold text-red-600">{formatMXN(c.next_payment_amount)}</p>
                      {c.next_payment_date && <p className="text-xs text-gray-400">{c.next_payment_date}</p>}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Utilización</span>
                      <span>{pct.toFixed(1)}% de {formatMXN(c.credit_limit)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
