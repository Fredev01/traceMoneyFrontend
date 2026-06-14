"use client";
import { useEffect, useState, useMemo } from "react";
import { CheckCircle, X, ChevronDown, ChevronUp } from "lucide-react";
import { useDebtsStore } from "@/store/debts-store";
import { StatusBadge } from "@/components/ui/Badge";
import { ActionMenu } from "@/components/ui/action-menu";
import { formatMXN, currentYearMonth, monthName } from "@/lib/utils";
import { calcularPrestamo } from "@/lib/loan-calculator";
import type { ActivePlan, CreditCard, LoanDetail } from "@/lib/types";

type Tab = "resumen" | "planes" | "nueva-deuda" | "prestamos" | "nuevo-prestamo" | "tarjetas";

interface CancelTarget {
  type: "plan" | "loan";
  id: string;
  concept: string;
  hasPaid: boolean;
}

export default function DeudasPage() {
  const { year, month } = currentYearMonth();
  const {
    cards, monthSummary, loanSummary, activePlans, loading,
    fetchCards, fetchByMonth, fetchLoansByMonth, fetchActivePlans,
    createCard, updateCard, createPlan, createLoan,
    markAsPaid, markLoanPaymentAsPaid, markPaymentsAsPaid, addExtraPayment,
    cancelPlan, updatePlan, cancelLoan, updateLoan, fetchLoanDetail,
  } = useDebtsStore();

  const [tab, setTab] = useState<Tab>("resumen");

  // Resumen selectors
  const [resumYear, setResumYear] = useState(year);
  const [resumMonth, setResumMonth] = useState(month);

  // Planes tab state
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [selectedPayments, setSelectedPayments] = useState<Record<string, Set<string>>>({});

  // Edit/cancel modals
  const [editingPlan, setEditingPlan] = useState<ActivePlan | null>(null);
  const [editPlanForm, setEditPlanForm] = useState({ concept: "", total_amount: "", num_installments: "", annual_interest_rate: "", purchase_date: "" });
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [editingLoanData, setEditingLoanData] = useState<LoanDetail | null>(null);
  const [editLoanForm, setEditLoanForm] = useState({ concept: "", capital: "", cat_anual: "", plazo_meses: "", loan_date: "" });
  const [cancelTarget, setCancelTarget] = useState<CancelTarget | null>(null);

  // Forms
  const [cardForm, setCardForm] = useState({ bank_name: "", credit_limit: "", cut_day: "1", payment_due_day: "20", color: "#6366f1" });
  const [planForm, setPlanForm] = useState({ credit_card_id: "", concept: "", total_amount: "", num_installments: "12", annual_interest_rate: "0", purchase_date: new Date().toISOString().split("T")[0] });
  const [loanForm, setLoanForm] = useState({ card_id: "", concept: "", capital: "", cat_anual: "", plazo_meses: "3", loan_date: new Date().toISOString().split("T")[0] });
  const [extraPayment, setExtraPayment] = useState<{ planId: string; amount: string } | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [editCardForm, setEditCardForm] = useState({ bank_name: "", credit_limit: "", cut_day: "1", payment_due_day: "20", color: "#6366f1" });
  const [amortOpen, setAmortOpen] = useState(false);
  const [loanYear, setLoanYear] = useState(year);
  const [loanMonth, setLoanMonth] = useState(month);

  const loanPreview = useMemo(() => {
    const cap = parseFloat(loanForm.capital);
    const cat = parseFloat(loanForm.cat_anual);
    const plazo = parseInt(loanForm.plazo_meses);
    if (!cap || !cat || !plazo || cap <= 0 || cat <= 0 || plazo <= 0) return null;
    return calcularPrestamo(cap, cat / 100, plazo);
  }, [loanForm.capital, loanForm.cat_anual, loanForm.plazo_meses]);

  useEffect(() => {
    fetchCards();
    fetchByMonth(year, month);
    fetchLoansByMonth(year, month);
  }, []);

  useEffect(() => {
    if (tab === "planes") fetchActivePlans();
  }, [tab]);

  async function handleFetchResumen(y: number, m: number) {
    setResumYear(y);
    setResumMonth(m);
    await fetchByMonth(y, m);
  }

  async function handleCreateCard(e: React.FormEvent) {
    e.preventDefault();
    await createCard({ bank_name: cardForm.bank_name, credit_limit: Number(cardForm.credit_limit), cut_day: Number(cardForm.cut_day), payment_due_day: Number(cardForm.payment_due_day), color: cardForm.color });
    setCardForm({ bank_name: "", credit_limit: "", cut_day: "1", payment_due_day: "20", color: "#6366f1" });
  }

  function startEditCard(c: CreditCard) {
    setEditingCard(c);
    setEditCardForm({ bank_name: c.bank_name, credit_limit: String(c.credit_limit), cut_day: String(c.cut_day), payment_due_day: String(c.payment_due_day), color: c.color });
  }

  async function handleUpdateCard(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCard) return;
    await updateCard(editingCard.id, { bank_name: editCardForm.bank_name, credit_limit: Number(editCardForm.credit_limit), cut_day: Number(editCardForm.cut_day), payment_due_day: Number(editCardForm.payment_due_day), color: editCardForm.color });
    setEditingCard(null);
  }

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    await createPlan({ credit_card_id: planForm.credit_card_id, concept: planForm.concept, total_amount: Number(planForm.total_amount), num_installments: Number(planForm.num_installments), annual_interest_rate: Number(planForm.annual_interest_rate), purchase_date: planForm.purchase_date });
    setTab("resumen");
  }

  async function handleCreateLoan(e: React.FormEvent) {
    e.preventDefault();
    await createLoan({ card_id: loanForm.card_id, concept: loanForm.concept, capital: Number(loanForm.capital), cat_anual: Number(loanForm.cat_anual) / 100, plazo_meses: Number(loanForm.plazo_meses), loan_date: loanForm.loan_date });
    setLoanForm({ card_id: "", concept: "", capital: "", cat_anual: "", plazo_meses: "3", loan_date: new Date().toISOString().split("T")[0] });
    setTab("prestamos");
  }

  async function handleFetchLoans(y: number, m: number) {
    setLoanYear(y);
    setLoanMonth(m);
    await fetchLoansByMonth(y, m);
  }

  async function handleExtra(e: React.FormEvent) {
    e.preventDefault();
    if (!extraPayment) return;
    await addExtraPayment(extraPayment.planId, Number(extraPayment.amount));
    setExtraPayment(null);
  }

  // Planes tab helpers
  function toggleExpand(planId: string) {
    setExpandedPlans((prev) => {
      const next = new Set(prev);
      if (next.has(planId)) next.delete(planId); else next.add(planId);
      return next;
    });
  }

  function togglePayment(planId: string, paymentId: string) {
    setSelectedPayments((prev) => {
      const current = new Set(prev[planId] ?? []);
      if (current.has(paymentId)) current.delete(paymentId); else current.add(paymentId);
      return { ...prev, [planId]: current };
    });
  }

  function toggleAllPending(planId: string, pendingIds: string[]) {
    setSelectedPayments((prev) => {
      const current = prev[planId] ?? new Set<string>();
      const allSelected = pendingIds.every((id) => current.has(id));
      const next = new Set(allSelected ? [] : pendingIds);
      return { ...prev, [planId]: next };
    });
  }

  async function handleBulkPay(planId: string) {
    const ids = Array.from(selectedPayments[planId] ?? []);
    if (!ids.length) return;
    await markPaymentsAsPaid(planId, ids);
    setSelectedPayments((prev) => ({ ...prev, [planId]: new Set() }));
  }

  // Edit plan modal
  function openEditPlan(plan: ActivePlan) {
    setEditingPlan(plan);
    setEditPlanForm({
      concept: plan.concept,
      total_amount: String(plan.total_amount),
      num_installments: String(plan.num_installments),
      annual_interest_rate: String(plan.interest_rate ?? 0),
      purchase_date: plan.purchase_date,
    });
  }

  async function handleUpdatePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPlan) return;
    const hasPaid = editingPlan.payments.some((p) => p.status === "PAGADO");
    if (hasPaid) {
      await updatePlan(editingPlan.plan_id, { concept: editPlanForm.concept });
    } else {
      await updatePlan(editingPlan.plan_id, {
        concept: editPlanForm.concept,
        total_amount: Number(editPlanForm.total_amount),
        num_installments: Number(editPlanForm.num_installments),
        annual_interest_rate: Number(editPlanForm.annual_interest_rate),
        purchase_date: editPlanForm.purchase_date,
      });
    }
    setEditingPlan(null);
  }

  // Edit loan modal
  async function openEditLoan(loanId: string) {
    setEditingLoanId(loanId);
    const detail = await fetchLoanDetail(loanId);
    setEditingLoanData(detail);
    setEditLoanForm({
      concept: detail.concept,
      capital: String(detail.capital),
      cat_anual: String(Number(detail.cat_anual) * 100),
      plazo_meses: String(detail.plazo_meses),
      loan_date: detail.loan_date,
    });
  }

  async function handleUpdateLoan(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLoanId || !editingLoanData) return;
    const hasPaid = editingLoanData.status !== "ACTIVO" || (loanSummary?.payments ?? []).some((p) => p.loan_id === editingLoanId && p.status === "PAGADO");
    if (hasPaid) {
      await updateLoan(editingLoanId, { concept: editLoanForm.concept });
    } else {
      await updateLoan(editingLoanId, {
        concept: editLoanForm.concept,
        capital: Number(editLoanForm.capital),
        cat_anual: Number(editLoanForm.cat_anual) / 100,
        plazo_meses: Number(editLoanForm.plazo_meses),
        loan_date: editLoanForm.loan_date,
      });
    }
    setEditingLoanId(null);
    setEditingLoanData(null);
  }

  // Cancel confirmation
  async function handleConfirmCancel() {
    if (!cancelTarget) return;
    if (cancelTarget.type === "plan") {
      await cancelPlan(cancelTarget.id);
    } else {
      await cancelLoan(cancelTarget.id);
    }
    setCancelTarget(null);
  }

  const tabLabels: Record<Tab, string> = {
    resumen: "Resumen",
    planes: "Planes",
    "nueva-deuda": "Nueva Deuda",
    prestamos: "Prestamos",
    "nuevo-prestamo": "Nuevo Prestamo",
    tarjetas: "Tarjetas",
  };

  const inputCls = "w-full mt-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-blue";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deudas</h1>
          <p className="text-gray-500 text-sm mt-0.5">{monthName(month)} {year}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {(["resumen", "planes", "nueva-deuda", "prestamos", "nuevo-prestamo", "tarjetas"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`text-sm px-4 py-2 rounded-lg transition-colors ${tab === t ? "bg-brand-blue text-white" : "bg-white border border-gray-200 text-gray-600 hover:text-gray-900"}`}>
              {tabLabels[t]}
            </button>
          ))}
        </div>
      </div>

      {/* ── RESUMEN ── */}
      {tab === "resumen" && (
        <>
          <div className="flex items-center gap-3">
            <select value={resumYear} onChange={(e) => handleFetchResumen(Number(e.target.value), resumMonth)} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
              {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={resumMonth} onChange={(e) => handleFetchResumen(resumYear, Number(e.target.value))} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{monthName(m)}</option>
              ))}
            </select>
          </div>

          {monthSummary && (
            <div className="bg-amber-50 border border-amber-400/40 rounded-xl p-4 flex items-center justify-between">
              <span className="text-gray-600 text-sm">Total del mes</span>
              <span className="text-2xl font-bold text-amber-600">{formatMXN(monthSummary.total)}</span>
            </div>
          )}
          {loading ? (
            <div className="text-gray-400 text-sm p-8 text-center">Cargando...</div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-200">
                    <th className="px-5 py-3 text-left">Banco</th>
                    <th className="px-5 py-3 text-left">Concepto</th>
                    <th className="px-5 py-3 text-left">Vence</th>
                    <th className="px-5 py-3 text-right">Monto</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-3 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(monthSummary?.payments ?? []).map((p) => (
                    <tr key={p.payment_id} className="border-b border-gray-200 hover:bg-brand-light">
                      <td className="px-5 py-3 font-medium">{p.bank_name}</td>
                      <td className="px-5 py-3 text-gray-600">
                        {p.concept}
                        {p.num_installments > 0 && (
                          <span className="ml-1.5 text-xs text-gray-400">({p.month_number}/{p.num_installments})</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-500">{p.due_date}</td>
                      <td className="px-5 py-3 text-right font-medium">{formatMXN(p.amount)}</td>
                      <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-3 py-3 text-center">
                        <ActionMenu items={[
                          { label: "Marcar como pagado", onClick: () => markAsPaid(p.plan_id, p.payment_id), disabled: p.status !== "PENDIENTE" },
                          { label: "Abono extra", onClick: () => setExtraPayment({ planId: p.plan_id, amount: "" }), disabled: p.status !== "PENDIENTE" },
                        ]} />
                      </td>
                    </tr>
                  ))}
                  {(monthSummary?.payments ?? []).length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">Sin pagos este mes</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal abono extra */}
          {extraPayment && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <form onSubmit={handleExtra} className="bg-white border border-gray-200 rounded-xl p-6 w-80 space-y-4">
                <h3 className="font-semibold">Abono extra</h3>
                <div>
                  <label className="text-xs text-gray-500">Monto del abono ($)</label>
                  <input required type="number" step="0.01" min="0.01" value={extraPayment.amount} onChange={(e) => setExtraPayment({ ...extraPayment, amount: e.target.value })} className={inputCls} />
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setExtraPayment(null)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">Cancelar</button>
                  <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white text-sm px-5 py-2 rounded-lg">Abonar</button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* ── PLANES ── */}
      {tab === "planes" && (
        <div className="space-y-4">
          {activePlans.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-10 text-center text-gray-400 text-sm">Sin planes activos</div>
          )}
          {activePlans.map((plan) => {
            const pendingIds = plan.payments.filter((p) => p.status === "PENDIENTE").map((p) => p.payment_id);
            const paidCount = plan.payments.filter((p) => p.status === "PAGADO").length;
            const selected = selectedPayments[plan.plan_id] ?? new Set<string>();
            const allPendingSelected = pendingIds.length > 0 && pendingIds.every((id) => selected.has(id));
            const isExpanded = expandedPlans.has(plan.plan_id);

            return (
              <div key={plan.plan_id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-brand-light" onClick={() => toggleExpand(plan.plan_id)}>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold">{plan.concept}</p>
                      <p className="text-xs text-gray-500">{plan.bank_name} · {formatMXN(plan.total_amount)} total</p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {paidCount}/{plan.num_installments} pagadas
                    </span>
                    <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(paidCount / plan.num_installments) * 100}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {selected.size > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleBulkPay(plan.plan_id); }}
                        className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg"
                      >
                        Marcar {selected.size} como pagado{selected.size > 1 ? "s" : ""}
                      </button>
                    )}
                    <div onClick={(e) => e.stopPropagation()}>
                      <ActionMenu items={[
                        { label: "Editar", onClick: () => openEditPlan(plan) },
                        { label: "Eliminar", variant: "danger", onClick: () => setCancelTarget({ type: "plan", id: plan.plan_id, concept: plan.concept, hasPaid: paidCount > 0 }) },
                      ]} />
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-2 text-left">
                            {pendingIds.length > 0 && (
                              <input
                                type="checkbox"
                                checked={allPendingSelected}
                                onChange={() => toggleAllPending(plan.plan_id, pendingIds)}
                                className="cursor-pointer"
                                title="Seleccionar todos los pendientes"
                              />
                            )}
                          </th>
                          <th className="px-4 py-2 text-center">Mes</th>
                          <th className="px-4 py-2 text-left">Vence</th>
                          <th className="px-4 py-2 text-right">Monto</th>
                          <th className="px-4 py-2 text-left">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.payments.map((p) => (
                          <tr
                            key={p.payment_id}
                            className={`border-b border-gray-100 ${p.status === "PENDIENTE" && selected.has(p.payment_id) ? "bg-emerald-50" : "hover:bg-brand-light"}`}
                          >
                            <td className="px-4 py-2">
                              {p.status === "PENDIENTE" ? (
                                <input
                                  type="checkbox"
                                  checked={selected.has(p.payment_id)}
                                  onChange={() => togglePayment(plan.plan_id, p.payment_id)}
                                  className="cursor-pointer"
                                />
                              ) : (
                                <CheckCircle size={14} className="text-emerald-500 mx-auto" />
                              )}
                            </td>
                            <td className="px-4 py-2 text-center text-gray-600">{p.month_number}</td>
                            <td className="px-4 py-2 text-gray-500">{p.due_date}</td>
                            <td className="px-4 py-2 text-right font-medium">{formatMXN(p.amount)}</td>
                            <td className="px-4 py-2"><StatusBadge status={p.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── NUEVA DEUDA ── */}
      {tab === "nueva-deuda" && (
        <form onSubmit={handleCreatePlan} className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-2 gap-4 max-w-2xl">
          <h2 className="col-span-2 text-lg font-semibold">Nueva compra a meses</h2>
          <div>
            <label className="text-xs text-gray-500">Tarjeta</label>
            <select required value={planForm.credit_card_id} onChange={(e) => setPlanForm({ ...planForm, credit_card_id: e.target.value })} className={inputCls}>
              <option value="">Selecciona...</option>
              {cards.map((c) => <option key={c.id} value={c.id}>{c.bank_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Concepto</label>
            <input required value={planForm.concept} onChange={(e) => setPlanForm({ ...planForm, concept: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Monto total ($)</label>
            <input required type="number" step="0.01" min="0.01" value={planForm.total_amount} onChange={(e) => setPlanForm({ ...planForm, total_amount: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Número de meses</label>
            <input required type="number" min="1" value={planForm.num_installments} onChange={(e) => setPlanForm({ ...planForm, num_installments: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Tasa de interés anual (0 = MSI)</label>
            <input type="number" step="0.01" min="0" value={planForm.annual_interest_rate} onChange={(e) => setPlanForm({ ...planForm, annual_interest_rate: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Fecha de compra</label>
            <input type="date" value={planForm.purchase_date} onChange={(e) => setPlanForm({ ...planForm, purchase_date: e.target.value })} className={inputCls} />
          </div>
          <div className="col-span-2 flex justify-end gap-3">
            <button type="button" onClick={() => setTab("resumen")} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">Cancelar</button>
            <button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark text-white text-sm px-5 py-2 rounded-lg">Crear plan</button>
          </div>
        </form>
      )}

      {/* ── NUEVO PRESTAMO ── */}
      {tab === "nuevo-prestamo" && (
        <div className="max-w-2xl space-y-5">
          <form onSubmit={handleCreateLoan} className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-2 gap-4">
            <h2 className="col-span-2 text-lg font-semibold">Nuevo préstamo personal</h2>
            <div>
              <label className="text-xs text-gray-500">Tarjeta / Cuenta</label>
              <select required value={loanForm.card_id} onChange={(e) => setLoanForm({ ...loanForm, card_id: e.target.value })} className={inputCls}>
                <option value="">Selecciona...</option>
                {cards.map((c) => <option key={c.id} value={c.id}>{c.bank_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Concepto</label>
              <input required value={loanForm.concept} onChange={(e) => setLoanForm({ ...loanForm, concept: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Capital ($)</label>
              <input required type="number" step="0.01" min="0.01" value={loanForm.capital} onChange={(e) => setLoanForm({ ...loanForm, capital: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-500">CAT anual (%)</label>
              <input required type="number" step="0.01" min="0.01" value={loanForm.cat_anual} onChange={(e) => setLoanForm({ ...loanForm, cat_anual: e.target.value })} placeholder="Ej: 71.22" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Plazo (meses)</label>
              <input required type="number" min="1" value={loanForm.plazo_meses} onChange={(e) => setLoanForm({ ...loanForm, plazo_meses: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Fecha del préstamo</label>
              <input type="date" value={loanForm.loan_date} onChange={(e) => setLoanForm({ ...loanForm, loan_date: e.target.value })} className={inputCls} />
            </div>
            <div className="col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setTab("prestamos")} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">Cancelar</button>
              <button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark text-white text-sm px-5 py-2 rounded-lg">Guardar préstamo</button>
            </div>
          </form>

          {loanPreview && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-sm text-gray-700">Vista previa del préstamo</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-brand-light rounded-lg p-3">
                  <p className="text-xs text-gray-500">Cuota mensual</p>
                  <p className="text-lg font-bold text-brand-blue">{formatMXN(loanPreview.cuota)}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Total a pagar</p>
                  <p className="text-lg font-bold text-amber-600">{formatMXN(loanPreview.totalPagado)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Total intereses</p>
                  <p className="text-lg font-bold text-red-500">{formatMXN(loanPreview.totalIntereses)}</p>
                </div>
              </div>
              <button type="button" onClick={() => setAmortOpen(!amortOpen)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                {amortOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Tabla de amortización
              </button>
              {amortOpen && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-200">
                        <th className="px-3 py-2 text-left">Mes</th>
                        <th className="px-3 py-2 text-right">Saldo inicial</th>
                        <th className="px-3 py-2 text-right">Interés</th>
                        <th className="px-3 py-2 text-right">Abono capital</th>
                        <th className="px-3 py-2 text-right">Cuota</th>
                        <th className="px-3 py-2 text-right">Saldo final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loanPreview.amortizacion.map((row) => (
                        <tr key={row.mes} className="border-b border-gray-100">
                          <td className="px-3 py-2">{row.mes}</td>
                          <td className="px-3 py-2 text-right">{formatMXN(row.saldoInicial)}</td>
                          <td className="px-3 py-2 text-right text-red-500">{formatMXN(row.interes)}</td>
                          <td className="px-3 py-2 text-right text-emerald-600">{formatMXN(row.abonoCapital)}</td>
                          <td className="px-3 py-2 text-right font-medium">{formatMXN(row.cuota)}</td>
                          <td className="px-3 py-2 text-right">{formatMXN(row.saldoFinal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── PRESTAMOS ── */}
      {tab === "prestamos" && (
        <>
          <div className="flex items-center gap-3">
            <select value={loanYear} onChange={(e) => handleFetchLoans(Number(e.target.value), loanMonth)} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
              {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={loanMonth} onChange={(e) => handleFetchLoans(loanYear, Number(e.target.value))} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{monthName(m)}</option>
              ))}
            </select>
          </div>

          {loanSummary && (
            <div className="bg-amber-50 border border-amber-400/40 rounded-xl p-4 flex items-center justify-between">
              <span className="text-gray-600 text-sm">Total préstamos del mes</span>
              <span className="text-2xl font-bold text-amber-600">{formatMXN(loanSummary.total)}</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-200">
                  <th className="px-5 py-3 text-left">Banco</th>
                  <th className="px-5 py-3 text-left">Concepto</th>
                  <th className="px-5 py-3 text-center">Mes</th>
                  <th className="px-5 py-3 text-left">Vence</th>
                  <th className="px-5 py-3 text-right">Interés</th>
                  <th className="px-5 py-3 text-right">Cuota</th>
                  <th className="px-5 py-3 text-left">Estado</th>
                  <th className="px-3 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {(loanSummary?.payments ?? []).map((p) => (
                  <tr key={p.payment_id} className="border-b border-gray-200 hover:bg-brand-light">
                    <td className="px-5 py-3 font-medium">{p.bank_name}</td>
                    <td className="px-5 py-3 text-gray-600">{p.concept}</td>
                    <td className="px-5 py-3 text-center text-gray-500">{p.month_number}</td>
                    <td className="px-5 py-3 text-gray-500">{p.due_date}</td>
                    <td className="px-5 py-3 text-right text-red-500">{formatMXN(p.interes)}</td>
                    <td className="px-5 py-3 text-right font-medium">{formatMXN(p.cuota)}</td>
                    <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-3 py-3 text-center">
                      <ActionMenu items={[
                        { label: "Marcar como pagado", onClick: () => markLoanPaymentAsPaid(p.loan_id, p.payment_id), disabled: p.status !== "PENDIENTE" },
                        { separator: true as const },
                        { label: "Editar préstamo", onClick: () => openEditLoan(p.loan_id) },
                        { label: "Eliminar préstamo", variant: "danger", onClick: () => setCancelTarget({ type: "loan", id: p.loan_id, concept: p.concept, hasPaid: p.status === "PAGADO" }) },
                      ]} />
                    </td>
                  </tr>
                ))}
                {(loanSummary?.payments ?? []).length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-8 text-center text-gray-400">Sin préstamos este mes</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── TARJETAS ── */}
      {tab === "tarjetas" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4 relative">
                <div className="absolute top-3 right-3">
                  <ActionMenu items={[{ label: "Editar", onClick: () => startEditCard(c) }]} />
                </div>
                <div className="w-3 h-3 rounded-full mb-3" style={{ backgroundColor: c.color }} />
                <p className="font-semibold">{c.bank_name}</p>
                <p className="text-xs text-gray-500 mt-1">Límite: {formatMXN(c.credit_limit)}</p>
                <p className="text-xs text-gray-400">Corte día {c.cut_day}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleCreateCard} className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-2 gap-4 max-w-2xl">
            <h2 className="col-span-2 text-base font-semibold">Agregar tarjeta</h2>
            <div>
              <label className="text-xs text-gray-500">Banco</label>
              <input required value={cardForm.bank_name} onChange={(e) => setCardForm({ ...cardForm, bank_name: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Límite de crédito ($)</label>
              <input required type="number" min="1" value={cardForm.credit_limit} onChange={(e) => setCardForm({ ...cardForm, credit_limit: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Día de corte</label>
              <input required type="number" min="1" max="31" value={cardForm.cut_day} onChange={(e) => setCardForm({ ...cardForm, cut_day: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Día límite de pago</label>
              <input required type="number" min="1" max="31" value={cardForm.payment_due_day} onChange={(e) => setCardForm({ ...cardForm, payment_due_day: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Color</label>
              <input type="color" value={cardForm.color} onChange={(e) => setCardForm({ ...cardForm, color: e.target.value })} className="w-full mt-1 h-9 bg-white border border-gray-300 rounded-lg px-2 cursor-pointer" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark text-white text-sm px-5 py-2 rounded-lg w-full">Agregar</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal editar tarjeta ── */}
      {editingCard && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <form onSubmit={handleUpdateCard} className="bg-white border border-gray-200 rounded-xl p-6 w-[420px] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Editar tarjeta</h3>
              <button type="button" onClick={() => setEditingCard(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-gray-500">Banco</label>
                <input required value={editCardForm.bank_name} onChange={(e) => setEditCardForm({ ...editCardForm, bank_name: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Límite de crédito ($)</label>
                <input required type="number" min="1" value={editCardForm.credit_limit} onChange={(e) => setEditCardForm({ ...editCardForm, credit_limit: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Color</label>
                <input type="color" value={editCardForm.color} onChange={(e) => setEditCardForm({ ...editCardForm, color: e.target.value })} className="w-full mt-1 h-9 bg-white border border-gray-300 rounded-lg px-2 cursor-pointer" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Día de corte</label>
                <input required type="number" min="1" max="31" value={editCardForm.cut_day} onChange={(e) => setEditCardForm({ ...editCardForm, cut_day: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Día límite de pago</label>
                <input required type="number" min="1" max="31" value={editCardForm.payment_due_day} onChange={(e) => setEditCardForm({ ...editCardForm, payment_due_day: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setEditingCard(null)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">Cancelar</button>
              <button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark text-white text-sm px-5 py-2 rounded-lg">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal editar plan ── */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <form onSubmit={handleUpdatePlan} className="bg-white border border-gray-200 rounded-xl p-6 w-[480px] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Editar plan</h3>
              <button type="button" onClick={() => setEditingPlan(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            {editingPlan.payments.some((p) => p.status === "PAGADO") && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Este plan tiene pagos realizados. Solo se puede editar el concepto.
              </p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-gray-500">Concepto</label>
                <input required value={editPlanForm.concept} onChange={(e) => setEditPlanForm({ ...editPlanForm, concept: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Monto total ($)</label>
                <input required type="number" step="0.01" min="0.01" value={editPlanForm.total_amount} onChange={(e) => setEditPlanForm({ ...editPlanForm, total_amount: e.target.value })} disabled={editingPlan.payments.some((p) => p.status === "PAGADO")} className={inputCls + (editingPlan.payments.some((p) => p.status === "PAGADO") ? " opacity-40 cursor-not-allowed" : "")} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Número de meses</label>
                <input required type="number" min="1" value={editPlanForm.num_installments} onChange={(e) => setEditPlanForm({ ...editPlanForm, num_installments: e.target.value })} disabled={editingPlan.payments.some((p) => p.status === "PAGADO")} className={inputCls + (editingPlan.payments.some((p) => p.status === "PAGADO") ? " opacity-40 cursor-not-allowed" : "")} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Tasa de interés anual</label>
                <input type="number" step="0.01" min="0" value={editPlanForm.annual_interest_rate} onChange={(e) => setEditPlanForm({ ...editPlanForm, annual_interest_rate: e.target.value })} disabled={editingPlan.payments.some((p) => p.status === "PAGADO")} className={inputCls + (editingPlan.payments.some((p) => p.status === "PAGADO") ? " opacity-40 cursor-not-allowed" : "")} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Fecha de compra</label>
                <input type="date" value={editPlanForm.purchase_date} onChange={(e) => setEditPlanForm({ ...editPlanForm, purchase_date: e.target.value })} disabled={editingPlan.payments.some((p) => p.status === "PAGADO")} className={inputCls + (editingPlan.payments.some((p) => p.status === "PAGADO") ? " opacity-40 cursor-not-allowed" : "")} />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setEditingPlan(null)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">Cancelar</button>
              <button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark text-white text-sm px-5 py-2 rounded-lg">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal editar préstamo ── */}
      {editingLoanId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <form onSubmit={handleUpdateLoan} className="bg-white border border-gray-200 rounded-xl p-6 w-[480px] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Editar préstamo</h3>
              <button type="button" onClick={() => { setEditingLoanId(null); setEditingLoanData(null); }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            {!editingLoanData ? (
              <p className="text-sm text-gray-400 text-center py-4">Cargando...</p>
            ) : (
              <>
                {(loanSummary?.payments ?? []).some((p) => p.loan_id === editingLoanId && p.status === "PAGADO") && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Este préstamo tiene pagos realizados. Solo se puede editar el concepto.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {(() => {
                    const hasPaid = (loanSummary?.payments ?? []).some((p) => p.loan_id === editingLoanId && p.status === "PAGADO");
                    return (
                      <>
                        <div className="col-span-2">
                          <label className="text-xs text-gray-500">Concepto</label>
                          <input required value={editLoanForm.concept} onChange={(e) => setEditLoanForm({ ...editLoanForm, concept: e.target.value })} className={inputCls} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Capital ($)</label>
                          <input required type="number" step="0.01" min="0.01" value={editLoanForm.capital} onChange={(e) => setEditLoanForm({ ...editLoanForm, capital: e.target.value })} disabled={hasPaid} className={inputCls + (hasPaid ? " opacity-40 cursor-not-allowed" : "")} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">CAT anual (%)</label>
                          <input required type="number" step="0.01" min="0.01" value={editLoanForm.cat_anual} onChange={(e) => setEditLoanForm({ ...editLoanForm, cat_anual: e.target.value })} disabled={hasPaid} className={inputCls + (hasPaid ? " opacity-40 cursor-not-allowed" : "")} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Plazo (meses)</label>
                          <input required type="number" min="1" value={editLoanForm.plazo_meses} onChange={(e) => setEditLoanForm({ ...editLoanForm, plazo_meses: e.target.value })} disabled={hasPaid} className={inputCls + (hasPaid ? " opacity-40 cursor-not-allowed" : "")} />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Fecha del préstamo</label>
                          <input type="date" value={editLoanForm.loan_date} onChange={(e) => setEditLoanForm({ ...editLoanForm, loan_date: e.target.value })} disabled={hasPaid} className={inputCls + (hasPaid ? " opacity-40 cursor-not-allowed" : "")} />
                        </div>
                      </>
                    );
                  })()}
                </div>
              </>
            )}
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => { setEditingLoanId(null); setEditingLoanData(null); }} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">Cancelar</button>
              <button type="submit" disabled={!editingLoanData} className="bg-brand-blue hover:bg-brand-blue-dark text-white text-sm px-5 py-2 rounded-lg disabled:opacity-50">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal confirmar eliminación ── */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 w-96 space-y-4">
            <h3 className="font-semibold">Confirmar eliminación</h3>
            <p className="text-sm text-gray-600">
              {cancelTarget.hasPaid
                ? `"${cancelTarget.concept}" tiene pagos realizados. Se marcará como cancelado y ya no aparecerá en vistas futuras, pero el historial de pagos se conservará.`
                : `¿Eliminar "${cancelTarget.concept}"? Esta acción es permanente y no se puede deshacer.`}
            </p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setCancelTarget(null)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">Cancelar</button>
              <button type="button" onClick={handleConfirmCancel} className="bg-red-600 hover:bg-red-700 text-white text-sm px-5 py-2 rounded-lg">
                {cancelTarget.hasPaid ? "Cancelar registro" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
