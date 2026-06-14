"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useExpensesStore } from "@/store/expenses-store";
import { TagBadge } from "@/components/ui/Badge";
import { formatMXN, currentYearMonth } from "@/lib/utils";
import type { ExpenseResponse } from "@/lib/types";

const METHODS = ["EFECTIVO", "DEBITO", "CREDITO", "TRANSFERENCIA"];
const TAGS = ["FIJO", "VARIABLE", "HORMIGA"];

function getWeekRange(offset = 0): { start: string; end: string; label: string } {
  const now = new Date();
  const day = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const mon = new Date(now);
  mon.setDate(now.getDate() - day + offset * 7);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return {
    start: fmt(mon),
    end: fmt(sun),
    label: `${fmt(mon)} — ${fmt(sun)}`,
  };
}

export default function GastosPage() {
  const { expenses, categories, loading, fetchByWeek, fetchByMonth, fetchCategories, createExpense, updateExpense, deleteExpense } =
    useExpensesStore();
  const [view, setView] = useState<"semanal" | "mensual">("semanal");
  const [weekOffset, setWeekOffset] = useState(0);
  const { year, month } = currentYearMonth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    description: "",
    category_id: "",
    tag: "VARIABLE",
    payment_method: "EFECTIVO",
    expense_date: new Date().toISOString().split("T")[0],
  });
  const [editing, setEditing] = useState<ExpenseResponse | null>(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    description: "",
    category_id: "",
    tag: "VARIABLE",
    payment_method: "EFECTIVO",
    expense_date: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (view === "semanal") {
      const { start, end } = getWeekRange(weekOffset);
      fetchByWeek(start, end);
    } else {
      fetchByMonth(year, month);
    }
  }, [view, weekOffset, year, month]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createExpense({ ...form, amount: Number(form.amount) });
    setShowForm(false);
    setForm({ ...form, amount: "", description: "" });
  }

  function startEdit(e: ExpenseResponse) {
    setEditing(e);
    setEditForm({
      amount: String(e.amount),
      description: e.description,
      category_id: e.category_id,
      tag: e.tag,
      payment_method: e.payment_method,
      expense_date: e.expense_date,
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    await updateExpense(editing.id, { ...editForm, amount: Number(editForm.amount) });
    setEditing(null);
  }

  async function handleDelete(id: string) {
    await deleteExpense(id);
  }

  const week = getWeekRange(weekOffset);
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gastos</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Nuevo gasto
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500">Monto ($)</label>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Descripción</label>
            <input
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Fecha</label>
            <input
              type="date"
              value={form.expense_date}
              onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
              className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Categoría</label>
            <select
              required
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue"
            >
              <option value="">Selecciona...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Etiqueta</label>
            <select
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue"
            >
              {TAGS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Método de pago</label>
            <select
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
              className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue"
            >
              {METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="col-span-2 flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
              Cancelar
            </button>
            <button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark text-white text-sm px-5 py-2 rounded-lg">
              Guardar
            </button>
          </div>
        </form>
      )}

      {/* Toggle vista */}
      <div className="flex items-center gap-4">
        <div className="flex bg-white border border-gray-200 rounded-lg p-1 gap-1">
          {(["semanal", "mensual"] as const).map((v) => (
            <button
              key={v}
              onClick={() => { setView(v); setWeekOffset(0); }}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors capitalize ${view === v ? "bg-brand-blue text-white" : "text-gray-600 hover:text-gray-900"}`}
            >
              {v}
            </button>
          ))}
        </div>
        {view === "semanal" && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <button onClick={() => setWeekOffset((o) => o - 1)} className="hover:text-gray-900">
              <ChevronLeft size={18} />
            </button>
            <span>{week.label}</span>
            <button onClick={() => setWeekOffset((o) => o + 1)} disabled={weekOffset >= 0} className="hover:text-gray-900 disabled:opacity-40">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 flex justify-between text-sm">
          <span className="text-gray-500">{expenses.length} registros</span>
          <span className="font-semibold">Total: {formatMXN(total)}</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Sin gastos en este período</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-200">
                <th className="px-5 py-3 text-left">Fecha</th>
                <th className="px-5 py-3 text-left">Descripción</th>
                <th className="px-5 py-3 text-left">Categoría</th>
                <th className="px-5 py-3 text-left">Etiqueta</th>
                <th className="px-5 py-3 text-left">Método</th>
                <th className="px-5 py-3 text-right">Monto</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-gray-200 hover:bg-brand-light transition-colors">
                  <td className="px-5 py-3 text-gray-500">{e.expense_date}</td>
                  <td className="px-5 py-3">{e.description}</td>
                  <td className="px-5 py-3 text-gray-500">{e.category_name ?? "—"}</td>
                  <td className="px-5 py-3"><TagBadge tag={e.tag} /></td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{e.payment_method}</td>
                  <td className="px-5 py-3 text-right font-medium">{formatMXN(e.amount)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(e)} className="text-gray-400 hover:text-brand-blue transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(e.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal editar gasto */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <form onSubmit={handleUpdate} className="bg-white border border-gray-200 rounded-xl p-6 w-[480px] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Editar gasto</h3>
              <button type="button" onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Monto ($)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Descripción</label>
                <input
                  required
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Fecha</label>
                <input
                  type="date"
                  value={editForm.expense_date}
                  onChange={(e) => setEditForm({ ...editForm, expense_date: e.target.value })}
                  className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Categoría</label>
                <select
                  required
                  value={editForm.category_id}
                  onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                  className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue"
                >
                  <option value="">Selecciona...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Etiqueta</label>
                <select
                  value={editForm.tag}
                  onChange={(e) => setEditForm({ ...editForm, tag: e.target.value })}
                  className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue"
                >
                  {TAGS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Método de pago</label>
                <select
                  value={editForm.payment_method}
                  onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value })}
                  className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue"
                >
                  {METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setEditing(null)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
                Cancelar
              </button>
              <button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark text-white text-sm px-5 py-2 rounded-lg">
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
