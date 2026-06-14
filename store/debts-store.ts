import { create } from "zustand";
import { api } from "@/lib/api";
import type { ActivePlan, CreditCard, LoanDetail, MonthDebtSummary, MonthLoanSummary, UpdateLoanPayload, UpdatePlanPayload } from "@/lib/types";

interface DebtsState {
  cards: CreditCard[];
  monthSummary: MonthDebtSummary | null;
  loanSummary: MonthLoanSummary | null;
  activePlans: ActivePlan[];
  loading: boolean;
  fetchCards: () => Promise<void>;
  fetchByMonth: (year: number, month: number) => Promise<void>;
  fetchLoansByMonth: (year: number, month: number) => Promise<void>;
  fetchActivePlans: () => Promise<void>;
  markPaymentsAsPaid: (planId: string, paymentIds: string[]) => Promise<void>;
  createCard: (data: Omit<CreditCard, "id">) => Promise<void>;
  updateCard: (id: string, data: Omit<CreditCard, "id">) => Promise<void>;
  createPlan: (data: {
    credit_card_id: string;
    concept: string;
    total_amount: number;
    num_installments: number;
    annual_interest_rate: number;
    purchase_date: string;
  }) => Promise<void>;
  createLoan: (data: {
    card_id: string;
    concept: string;
    capital: number;
    cat_anual: number;
    plazo_meses: number;
    loan_date: string;
  }) => Promise<void>;
  markAsPaid: (planId: string, paymentId: string, paidAmount?: number) => Promise<void>;
  markLoanPaymentAsPaid: (loanId: string, paymentId: string, paidAmount?: number) => Promise<void>;
  addExtraPayment: (planId: string, extraAmount: number) => Promise<void>;
  cancelPlan: (planId: string) => Promise<void>;
  updatePlan: (planId: string, data: UpdatePlanPayload) => Promise<void>;
  cancelLoan: (loanId: string) => Promise<void>;
  updateLoan: (loanId: string, data: UpdateLoanPayload) => Promise<void>;
  fetchLoanDetail: (loanId: string) => Promise<LoanDetail>;
}

export const useDebtsStore = create<DebtsState>((set, get) => {
  let _lastMonthFetch: { year: number; month: number } | null = null;

  return {
    cards: [],
    monthSummary: null,
    loanSummary: null,
    activePlans: [],
    loading: false,

    fetchCards: async () => {
      const data = await api.get<CreditCard[]>("/debts/cards");
      set({ cards: data });
    },

    fetchByMonth: async (year, month) => {
      _lastMonthFetch = { year, month };
      set({ loading: true });
      const data = await api.get<MonthDebtSummary>(`/debts/month?year=${year}&month=${month}`);
      set({ monthSummary: data, loading: false });
    },

    fetchLoansByMonth: async (year, month) => {
      const data = await api.get<MonthLoanSummary>(`/debts/loans/month?year=${year}&month=${month}`);
      set({ loanSummary: data });
    },

    fetchActivePlans: async () => {
      const data = await api.get<ActivePlan[]>("/debts/plans/active");
      set({ activePlans: data });
    },

    markPaymentsAsPaid: async (planId, paymentIds) => {
      await api.post(`/debts/plans/${planId}/payments/bulk-pay`, { payment_ids: paymentIds });
      await get().fetchActivePlans();
      if (_lastMonthFetch) {
        await get().fetchByMonth(_lastMonthFetch.year, _lastMonthFetch.month);
      }
    },

    createCard: async (data) => {
      await api.post("/debts/cards", data);
      await get().fetchCards();
    },

    updateCard: async (id, data) => {
      await api.put(`/debts/cards/${id}`, data);
      await get().fetchCards();
    },

    createPlan: async (data) => {
      await api.post("/debts/plans", data);
      if (_lastMonthFetch) {
        await get().fetchByMonth(_lastMonthFetch.year, _lastMonthFetch.month);
      }
    },

    createLoan: async (data) => {
      await api.post("/debts/loans", data);
      if (_lastMonthFetch) {
        await get().fetchLoansByMonth(_lastMonthFetch.year, _lastMonthFetch.month);
      }
    },

    markAsPaid: async (planId, paymentId, paidAmount) => {
      await api.post(`/debts/plans/${planId}/payments/${paymentId}/pay`, {
        paid_amount: paidAmount ?? null,
      });
      if (_lastMonthFetch) {
        await get().fetchByMonth(_lastMonthFetch.year, _lastMonthFetch.month);
      }
    },

    markLoanPaymentAsPaid: async (loanId, paymentId, paidAmount) => {
      await api.post(`/debts/loans/${loanId}/payments/${paymentId}/pay`, {
        paid_amount: paidAmount ?? null,
      });
      if (_lastMonthFetch) {
        await get().fetchLoansByMonth(_lastMonthFetch.year, _lastMonthFetch.month);
      }
    },

    addExtraPayment: async (planId, extraAmount) => {
      await api.post(`/debts/plans/${planId}/extra-payment`, { extra_amount: extraAmount });
      if (_lastMonthFetch) {
        await get().fetchByMonth(_lastMonthFetch.year, _lastMonthFetch.month);
      }
    },

    cancelPlan: async (planId) => {
      await api.delete(`/debts/plans/${planId}`);
      await get().fetchActivePlans();
      if (_lastMonthFetch) {
        await get().fetchByMonth(_lastMonthFetch.year, _lastMonthFetch.month);
      }
    },

    updatePlan: async (planId, data) => {
      await api.put(`/debts/plans/${planId}`, data);
      await get().fetchActivePlans();
      if (_lastMonthFetch) {
        await get().fetchByMonth(_lastMonthFetch.year, _lastMonthFetch.month);
      }
    },

    cancelLoan: async (loanId) => {
      await api.delete(`/debts/loans/${loanId}`);
      if (_lastMonthFetch) {
        await get().fetchLoansByMonth(_lastMonthFetch.year, _lastMonthFetch.month);
      }
    },

    updateLoan: async (loanId, data) => {
      await api.put(`/debts/loans/${loanId}`, data);
      if (_lastMonthFetch) {
        await get().fetchLoansByMonth(_lastMonthFetch.year, _lastMonthFetch.month);
      }
    },

    fetchLoanDetail: async (loanId) => {
      return await api.get<LoanDetail>(`/debts/loans/${loanId}`);
    },
  };
});
