"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, X } from "lucide-react";
import { api } from "@/lib/api";
import type { CategoryResponse } from "@/lib/types";

export default function ConfiguracionPage() {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [form, setForm] = useState({ name: "", color: "#6366f1", parent_id: "" });
  const [editing, setEditing] = useState<CategoryResponse | null>(null);
  const [editForm, setEditForm] = useState({ name: "", color: "" });

  async function load() {
    const data = await api.get<CategoryResponse[]>("/expenses/categories");
    setCategories(data);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/expenses/categories", { name: form.name, color: form.color, parent_id: form.parent_id || null });
    setForm({ name: "", color: "#6366f1", parent_id: "" });
    await load();
  }

  function startEdit(c: CategoryResponse) {
    setEditing(c);
    setEditForm({ name: c.name, color: c.color });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    await api.put(`/expenses/categories/${editing.id}`, { name: editForm.name, color: editForm.color });
    setEditing(null);
    await load();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Configuración</h1>

      <section>
        <h2 className="text-lg font-semibold mb-4">Categorías de Gastos</h2>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {categories.map((c) => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.name}</p>
                {c.parent_id && <p className="text-xs text-gray-400">Subcategoría</p>}
              </div>
              <button
                onClick={() => startEdit(c)}
                className="text-gray-400 hover:text-brand-blue transition-colors shrink-0"
                title="Editar"
              >
                <Pencil size={14} />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-3 gap-3">
          <div className="col-span-3">
            <p className="text-sm font-medium text-gray-700 mb-3">Nueva categoría</p>
          </div>
          <div>
            <label className="text-xs text-gray-500">Nombre</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Categoría padre (opcional)</label>
            <select
              value={form.parent_id}
              onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
              className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue"
            >
              <option value="">Ninguna (principal)</option>
              {categories.filter((c) => !c.parent_id).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Color</label>
            <div className="flex gap-2 mt-1">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-9 w-12 bg-white border border-gray-300 rounded-lg px-1 cursor-pointer"
              />
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white text-sm rounded-lg px-3"
              >
                <Plus size={15} /> Agregar
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Modal editar categoría */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <form onSubmit={handleUpdate} className="bg-white border border-gray-200 rounded-xl p-6 w-80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Editar categoría</h3>
              <button type="button" onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div>
              <label className="text-xs text-gray-500">Nombre</label>
              <input
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Color</label>
              <input
                type="color"
                value={editForm.color}
                onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                className="w-full mt-1 h-9 bg-white border border-gray-300 rounded-lg px-2 cursor-pointer"
              />
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
