import { create } from "zustand";
import { api } from "@/lib/api";
import type { CategoryResponse, ExpenseResponse } from "@/lib/types";

type LastFetch =
  | { type: "week"; start: string; end: string }
  | { type: "month"; year: number; month: number }
  | null;

interface ExpensesState {
  expenses: ExpenseResponse[];
  categories: CategoryResponse[];
  loading: boolean;
  fetchByWeek: (weekStart: string, weekEnd: string) => Promise<void>;
  fetchByMonth: (year: number, month: number) => Promise<void>;
  fetchCategories: () => Promise<void>;
  createExpense: (data: {
    amount: number;
    description: string;
    category_id: string;
    tag: string;
    payment_method: string;
    expense_date: string;
    account_id?: string | null;
  }) => Promise<void>;
  updateExpense: (id: string, data: {
    amount: number;
    description: string;
    category_id: string;
    tag: string;
    payment_method: string;
    expense_date: string;
    account_id?: string | null;
  }) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

export const useExpensesStore = create<ExpensesState>((set, get) => {
  let _lastFetch: LastFetch = null;

  return {
    expenses: [],
    categories: [],
    loading: false,

    fetchByWeek: async (weekStart, weekEnd) => {
      _lastFetch = { type: "week", start: weekStart, end: weekEnd };
      set({ loading: true });
      const data = await api.get<ExpenseResponse[]>(
        `/expenses/week?week_start=${weekStart}&week_end=${weekEnd}`
      );
      set({ expenses: data, loading: false });
    },

    fetchByMonth: async (year, month) => {
      _lastFetch = { type: "month", year, month };
      set({ loading: true });
      const data = await api.get<ExpenseResponse[]>(
        `/expenses/month?year=${year}&month=${month}`
      );
      set({ expenses: data, loading: false });
    },

    fetchCategories: async () => {
      const data = await api.get<CategoryResponse[]>("/expenses/categories");
      set({ categories: data });
    },

    createExpense: async (data) => {
      await api.post("/expenses", data);
      if (_lastFetch?.type === "week") {
        await get().fetchByWeek(_lastFetch.start, _lastFetch.end);
      } else if (_lastFetch?.type === "month") {
        await get().fetchByMonth(_lastFetch.year, _lastFetch.month);
      }
    },

    updateExpense: async (id, data) => {
      await api.put(`/expenses/${id}`, data);
      if (_lastFetch?.type === "week") {
        await get().fetchByWeek(_lastFetch.start, _lastFetch.end);
      } else if (_lastFetch?.type === "month") {
        await get().fetchByMonth(_lastFetch.year, _lastFetch.month);
      }
    },

    deleteExpense: async (id) => {
      await api.delete(`/expenses/${id}`);
      if (_lastFetch?.type === "week") {
        await get().fetchByWeek(_lastFetch.start, _lastFetch.end);
      } else if (_lastFetch?.type === "month") {
        await get().fetchByMonth(_lastFetch.year, _lastFetch.month);
      }
    },
  };
});
