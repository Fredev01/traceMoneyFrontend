"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, X, ArrowLeftRight, Banknote, Eye } from "lucide-react";
import { useAccountsStore } from "@/store/accounts-store";
import { formatMXN } from "@/lib/utils";
import type { Account, AccountMovement, AccountStatusResponse } from "@/lib/types";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

type Tab = "debito" | "credito";

const inputCls = "w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue";
const labelCls = "text-xs text-gray-500";

function UtilizationBar({ pct }: { pct: number }) {
  const clamp = Math.min(Math.max(pct, 0), 100);
  const barColor = clamp >= 80 ? "#ef4444" : clamp >= 50 ? "#f59e0b" : "#10b981";
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
      <div className="h-2 rounded-full transition-all" style={{ width: `${clamp}%`, backgroundColor: barColor }} />
    </div>
  );
}

function StatusModal({ account, onClose }: { account: Account; onClose: () => void }) {
  const { getStatus, getMovements } = useAccountsStore();
  const [status, setStatus] = useState<AccountStatusResponse | null>(null);
  const [movements, setMovements] = useState<AccountMovement[]>([]);
  const [tab, setTab] = useState<"resumen" | "movimientos">("resumen");

  useEffect(() => {
    getStatus(account.id).then(setStatus);
    getMovements(account.id).then(setMovements);
  }, [account.id]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl border border-gray-200 p-6 w-[520px] max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }} />
            <h3 className="font-semibold">{account.bank_name}</h3>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{account.account_type}</span>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="flex gap-2">
          {(["resumen", "movimientos"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-sm rounded-md capitalize transition-colors ${tab === t ? "bg-brand-blue text-white" : "text-gray-500 hover:text-gray-900"}`}>
              {t}
            </button>
          ))}
        </div>

        {!status ? (
          <p className="text-gray-400 text-sm text-center py-8">Cargando...</p>
        ) : tab === "resumen" ? (
          <div className="space-y-3">
            {account.account_type === "DEBITO" ? (
              <div className="bg-emerald-50 rounded-lg p-4">
                <p className="text-xs text-gray-500">Saldo disponible</p>
                <p className="text-2xl font-bold text-emerald-600">{formatMXN(status.balance ?? 0)}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Límite de crédito</p>
                    <p className="text-lg font-bold">{formatMXN(status.credit_limit ?? 0)}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Disponible</p>
                    <p className="text-lg font-bold text-green-600">{formatMXN(status.available_limit ?? 0)}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Cargos ciclo actual</p>
                    <p className="text-lg font-bold text-amber-600">{formatMXN(status.current_cycle_charges ?? 0)}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Total adeudado</p>
                    <p className="text-lg font-bold text-red-600">{formatMXN(status.total_owed ?? 0)}</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Utilización</span>
                    <span>{(status.utilization_pct ?? 0).toFixed(1)}%</span>
                  </div>
                  <UtilizationBar pct={status.utilization_pct ?? 0} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Próximo pago</p>
                    <p className="font-medium">{formatMXN(status.next_payment_amount ?? 0)}</p>
                    {status.next_payment_date && <p className="text-xs text-gray-400">{status.next_payment_date}</p>}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Días para corte / pago</p>
                    <p className="font-medium">{status.days_to_cut ?? "—"} / {status.days_to_payment ?? "—"} días</p>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {movements.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">Sin movimientos</p>
            ) : movements.map((m) => (
              <div key={m.id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                <div>
                  <p className="font-medium">{m.movement_type.replace("_", " ")}</p>
                  {m.note && <p className="text-xs text-gray-400">{m.note}</p>}
                  <p className="text-xs text-gray-400">{m.movement_date}</p>
                </div>
                <p className={`font-semibold ${m.movement_type === "TRANSFER_OUT" ? "text-red-500" : "text-emerald-600"}`}>
                  {m.movement_type === "TRANSFER_OUT" ? "-" : "+"}{formatMXN(m.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TarjetasPage() {
  const { accounts, loading, fetchAccounts, createAccount, updateAccount, deleteAccount, assignCapital, transfer } = useAccountsStore();
  const [tab, setTab] = useState<Tab>("debito");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    account_type: "DEBITO" as "DEBITO" | "CREDITO",
    bank_name: "",
    color: COLORS[0],
    credit_limit: "",
    cut_day: "",
    payment_due_day: "",
  });

  const [editing, setEditing] = useState<Account | null>(null);
  const [editForm, setEditForm] = useState({ bank_name: "", color: COLORS[0], credit_limit: "", cut_day: "", payment_due_day: "" });

  const [capitalAccount, setCapitalAccount] = useState<Account | null>(null);
  const [capitalForm, setCapitalForm] = useState({ amount: "", movement_date: new Date().toISOString().split("T")[0], note: "" });

  const [transferFrom, setTransferFrom] = useState<Account | null>(null);
  const [transferForm, setTransferForm] = useState({ target_account_id: "", amount: "", movement_date: new Date().toISOString().split("T")[0], note: "" });

  const [statusAccount, setStatusAccount] = useState<Account | null>(null);

  useEffect(() => { fetchAccounts(); }, []);

  const filtered = accounts.filter((a) => a.account_type === (tab === "debito" ? "DEBITO" : "CREDITO"));
  const debitAccounts = accounts.filter((a) => a.account_type === "DEBITO");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createAccount({
      account_type: createForm.account_type,
      bank_name: createForm.bank_name,
      color: createForm.color,
      credit_limit: createForm.credit_limit ? Number(createForm.credit_limit) : null,
      cut_day: createForm.cut_day ? Number(createForm.cut_day) : null,
      payment_due_day: createForm.payment_due_day ? Number(createForm.payment_due_day) : null,
    });
    setShowCreate(false);
    setCreateForm({ account_type: "DEBITO", bank_name: "", color: COLORS[0], credit_limit: "", cut_day: "", payment_due_day: "" });
  }

  function startEdit(a: Account) {
    setEditing(a);
    setEditForm({
      bank_name: a.bank_name,
      color: a.color,
      credit_limit: a.credit_limit != null ? String(a.credit_limit) : "",
      cut_day: a.cut_day != null ? String(a.cut_day) : "",
      payment_due_day: a.payment_due_day != null ? String(a.payment_due_day) : "",
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    await updateAccount(editing.id, {
      bank_name: editForm.bank_name,
      color: editForm.color,
      credit_limit: editForm.credit_limit ? Number(editForm.credit_limit) : null,
      cut_day: editForm.cut_day ? Number(editForm.cut_day) : null,
      payment_due_day: editForm.payment_due_day ? Number(editForm.payment_due_day) : null,
    });
    setEditing(null);
  }

  async function handleCapital(e: React.FormEvent) {
    e.preventDefault();
    if (!capitalAccount) return;
    await assignCapital(capitalAccount.id, {
      amount: Number(capitalForm.amount),
      movement_date: capitalForm.movement_date,
      note: capitalForm.note || null,
    });
    setCapitalAccount(null);
    setCapitalForm({ amount: "", movement_date: new Date().toISOString().split("T")[0], note: "" });
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!transferFrom) return;
    await transfer(transferFrom.id, {
      target_account_id: transferForm.target_account_id,
      amount: Number(transferForm.amount),
      movement_date: transferForm.movement_date,
      note: transferForm.note || null,
    });
    setTransferFrom(null);
    setTransferForm({ target_account_id: "", amount: "", movement_date: new Date().toISOString().split("T")[0], note: "" });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tarjetas y cuentas</h1>
        <button
          onClick={() => { setShowCreate(!showCreate); setCreateForm((f) => ({ ...f, account_type: tab === "debito" ? "DEBITO" : "CREDITO" })); }}
          className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Nueva {tab === "debito" ? "débito" : "crédito"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border border-gray-200 rounded-lg p-1 gap-1 w-fit">
        {(["debito", "credito"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm rounded-md capitalize transition-colors ${tab === t ? "bg-brand-blue text-white" : "text-gray-600 hover:text-gray-900"}`}>
            {t === "debito" ? "Débito" : "Crédito"}
          </button>
        ))}
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-sm">Nueva cuenta {createForm.account_type === "DEBITO" ? "débito" : "crédito"}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tipo</label>
              <select value={createForm.account_type} onChange={(e) => setCreateForm({ ...createForm, account_type: e.target.value as "DEBITO" | "CREDITO" })} className={inputCls}>
                <option value="DEBITO">Débito</option>
                <option value="CREDITO">Crédito</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Banco / Nombre</label>
              <input required value={createForm.bank_name} onChange={(e) => setCreateForm({ ...createForm, bank_name: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Color</label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setCreateForm({ ...createForm, color: c })}
                    className="w-6 h-6 rounded-full border-2 transition-all"
                    style={{ backgroundColor: c, borderColor: createForm.color === c ? "#1e3a5f" : "transparent" }}
                  />
                ))}
              </div>
            </div>
            {createForm.account_type === "CREDITO" && (
              <>
                <div>
                  <label className={labelCls}>Límite de crédito ($)</label>
                  <input required type="number" step="0.01" min="1" value={createForm.credit_limit} onChange={(e) => setCreateForm({ ...createForm, credit_limit: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Día de corte (1-31)</label>
                  <input required type="number" min="1" max="31" value={createForm.cut_day} onChange={(e) => setCreateForm({ ...createForm, cut_day: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Día de pago (1-31)</label>
                  <input required type="number" min="1" max="31" value={createForm.payment_due_day} onChange={(e) => setCreateForm({ ...createForm, payment_due_day: e.target.value })} className={inputCls} />
                </div>
              </>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowCreate(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">Cancelar</button>
            <button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark text-white text-sm px-5 py-2 rounded-lg">Guardar</button>
          </div>
        </form>
      )}

      {/* Accounts list */}
      {loading ? (
        <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-sm">Sin cuentas {tab === "debito" ? "de débito" : "de crédito"}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: a.color }} />
                  <span className="font-semibold">{a.bank_name}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <button onClick={() => setStatusAccount(a)} className="text-gray-400 hover:text-brand-blue transition-colors" title="Ver estado">
                    <Eye size={15} />
                  </button>
                  {a.account_type === "DEBITO" && (
                    <>
                      <button onClick={() => { setCapitalAccount(a); }} className="text-gray-400 hover:text-emerald-600 transition-colors" title="Asignar capital">
                        <Banknote size={15} />
                      </button>
                      <button onClick={() => { setTransferFrom(a); setTransferForm((f) => ({ ...f, target_account_id: "" })); }} className="text-gray-400 hover:text-amber-600 transition-colors" title="Transferir">
                        <ArrowLeftRight size={15} />
                      </button>
                    </>
                  )}
                  <button onClick={() => startEdit(a)} className="text-gray-400 hover:text-brand-blue transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteAccount(a.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {a.account_type === "CREDITO" && (
                <div className="text-sm text-gray-500 space-y-0.5">
                  <p>Límite: <span className="font-medium text-gray-800">{formatMXN(a.credit_limit ?? 0)}</span></p>
                  <p>Corte: día <span className="font-medium text-gray-800">{a.cut_day}</span> · Pago: día <span className="font-medium text-gray-800">{a.payment_due_day}</span></p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Status modal */}
      {statusAccount && <StatusModal account={statusAccount} onClose={() => setStatusAccount(null)} />}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <form onSubmit={handleUpdate} className="bg-white border border-gray-200 rounded-xl p-6 w-[460px] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Editar cuenta</h3>
              <button type="button" onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Banco / Nombre</label>
                <input required value={editForm.bank_name} onChange={(e) => setEditForm({ ...editForm, bank_name: e.target.value })} className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Color</label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setEditForm({ ...editForm, color: c })}
                      className="w-6 h-6 rounded-full border-2 transition-all"
                      style={{ backgroundColor: c, borderColor: editForm.color === c ? "#1e3a5f" : "transparent" }}
                    />
                  ))}
                </div>
              </div>
              {editing.account_type === "CREDITO" && (
                <>
                  <div>
                    <label className={labelCls}>Límite de crédito ($)</label>
                    <input type="number" step="0.01" min="1" value={editForm.credit_limit} onChange={(e) => setEditForm({ ...editForm, credit_limit: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Día de corte</label>
                    <input type="number" min="1" max="31" value={editForm.cut_day} onChange={(e) => setEditForm({ ...editForm, cut_day: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Día de pago</label>
                    <input type="number" min="1" max="31" value={editForm.payment_due_day} onChange={(e) => setEditForm({ ...editForm, payment_due_day: e.target.value })} className={inputCls} />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setEditing(null)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">Cancelar</button>
              <button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark text-white text-sm px-5 py-2 rounded-lg">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* Assign capital modal */}
      {capitalAccount && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <form onSubmit={handleCapital} className="bg-white border border-gray-200 rounded-xl p-6 w-[380px] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Asignar capital — {capitalAccount.bank_name}</h3>
              <button type="button" onClick={() => setCapitalAccount(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Monto ($)</label>
                <input required type="number" step="0.01" value={capitalForm.amount} onChange={(e) => setCapitalForm({ ...capitalForm, amount: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Fecha</label>
                <input type="date" value={capitalForm.movement_date} onChange={(e) => setCapitalForm({ ...capitalForm, movement_date: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Nota (opcional)</label>
                <input value={capitalForm.note} onChange={(e) => setCapitalForm({ ...capitalForm, note: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setCapitalAccount(null)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">Cancelar</button>
              <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-5 py-2 rounded-lg">Asignar</button>
            </div>
          </form>
        </div>
      )}

      {/* Transfer modal */}
      {transferFrom && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <form onSubmit={handleTransfer} className="bg-white border border-gray-200 rounded-xl p-6 w-[380px] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Transferir desde {transferFrom.bank_name}</h3>
              <button type="button" onClick={() => setTransferFrom(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Destino</label>
                <select required value={transferForm.target_account_id} onChange={(e) => setTransferForm({ ...transferForm, target_account_id: e.target.value })} className={inputCls}>
                  <option value="">Selecciona...</option>
                  {debitAccounts.filter((a) => a.id !== transferFrom.id).map((a) => (
                    <option key={a.id} value={a.id}>{a.bank_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Monto ($)</label>
                <input required type="number" step="0.01" min="0.01" value={transferForm.amount} onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Fecha</label>
                <input type="date" value={transferForm.movement_date} onChange={(e) => setTransferForm({ ...transferForm, movement_date: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Nota (opcional)</label>
                <input value={transferForm.note} onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setTransferFrom(null)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">Cancelar</button>
              <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white text-sm px-5 py-2 rounded-lg">Transferir</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
