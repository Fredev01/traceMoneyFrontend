"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { api } from "@/lib/api";
import { formatMXN, currentYearMonth } from "@/lib/utils";
import type { IncomeResponse } from "@/lib/types";

const SOURCES = ["SUELDO", "FREELANCE", "BONO", "INVERSION", "RENTA", "OTRO"];

export default function IngresosPage() {
  const { year, month } = currentYearMonth();
  const [incomes, setIncomes] = useState<IncomeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    source: "SUELDO",
    income_date: new Date().toISOString().split("T")[0],
    note: "",
  });
  const [editing, setEditing] = useState<IncomeResponse | null>(null);
  const [editForm, setEditForm] = useState({ amount: "", source: "SUELDO", income_date: "", note: "" });

  async function load() {
    setLoading(true);
    const data = await api.get<IncomeResponse[]>(`/income/month?year=${year}&month=${month}`);
    setIncomes(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/income", { ...form, amount: Number(form.amount), note: form.note || null });
    setShowForm(false);
    setForm({ ...form, amount: "", note: "" });
    await load();
  }

  function startEdit(i: IncomeResponse) {
    setEditing(i);
    setEditForm({ amount: String(i.amount), source: i.source, income_date: i.income_date, note: i.note ?? "" });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    await api.put(`/income/${editing.id}`, {
      amount: Number(editForm.amount),
      source: editForm.source,
      income_date: editForm.income_date,
      note: editForm.note || null,
    });
    setEditing(null);
    await load();
  }

  async function handleDelete(id: string) {
    await api.delete(`/income/${id}`);
    await load();
  }

  const total = incomes.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ingresos</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Nuevo ingreso
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500">Monto ($)</label>
            <input required type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Fuente</label>
            <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue">
              {SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Fecha</label>
            <input type="date" value={form.income_date} onChange={(e) => setForm({ ...form, income_date: e.target.value })} className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Nota (opcional)</label>
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue" />
          </div>
          <div className="col-span-2 flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">Cancelar</button>
            <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-5 py-2 rounded-lg">Guardar</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 flex justify-between text-sm">
          <span className="text-gray-500">{incomes.length} registros</span>
          <span className="font-semibold text-emerald-600">Total: {formatMXN(total)}</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
        ) : incomes.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Sin ingresos este mes</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-200">
                <th className="px-5 py-3 text-left">Fecha</th>
                <th className="px-5 py-3 text-left">Fuente</th>
                <th className="px-5 py-3 text-left">Nota</th>
                <th className="px-5 py-3 text-right">Monto</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {incomes.map((i) => (
                <tr key={i.id} className="border-b border-gray-200 hover:bg-brand-light">
                  <td className="px-5 py-3 text-gray-500">{i.income_date}</td>
                  <td className="px-5 py-3 font-medium">{i.source}</td>
                  <td className="px-5 py-3 text-gray-500">{i.note ?? "—"}</td>
                  <td className="px-5 py-3 text-right font-medium text-emerald-600">{formatMXN(i.amount)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(i)} className="text-gray-400 hover:text-brand-blue transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(i.id)} className="text-gray-400 hover:text-red-500 transition-colors">
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

      {/* Modal editar ingreso */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <form onSubmit={handleUpdate} className="bg-white border border-gray-200 rounded-xl p-6 w-[400px] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Editar ingreso</h3>
              <button type="button" onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Monto ($)</label>
                <input required type="number" step="0.01" min="0.01" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Fuente</label>
                <select value={editForm.source} onChange={(e) => setEditForm({ ...editForm, source: e.target.value })} className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue">
                  {SOURCES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Fecha</label>
                <input type="date" value={editForm.income_date} onChange={(e) => setEditForm({ ...editForm, income_date: e.target.value })} className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Nota (opcional)</label>
                <input value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue" />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setEditing(null)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">Cancelar</button>
              <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-5 py-2 rounded-lg">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
