import { create } from "zustand";
import { api } from "@/lib/api";
import type { Account, AccountMovement, AccountStatusResponse } from "@/lib/types";

interface AccountsState {
  accounts: Account[];
  loading: boolean;
  fetchAccounts: () => Promise<void>;
  createAccount: (data: {
    account_type: string;
    bank_name: string;
    color: string;
    credit_limit?: number | null;
    cut_day?: number | null;
    payment_due_day?: number | null;
  }) => Promise<void>;
  updateAccount: (id: string, data: {
    bank_name?: string;
    color?: string;
    credit_limit?: number | null;
    cut_day?: number | null;
    payment_due_day?: number | null;
  }) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  assignCapital: (id: string, data: { amount: number; movement_date: string; note?: string | null }) => Promise<void>;
  transfer: (id: string, data: { target_account_id: string; amount: number; movement_date: string; note?: string | null }) => Promise<void>;
  getStatus: (id: string) => Promise<AccountStatusResponse>;
  getMovements: (id: string) => Promise<AccountMovement[]>;
}

export const useAccountsStore = create<AccountsState>((set, get) => ({
  accounts: [],
  loading: false,

  fetchAccounts: async () => {
    set({ loading: true });
    const data = await api.get<Account[]>("/accounts");
    set({ accounts: data, loading: false });
  },

  createAccount: async (data) => {
    await api.post("/accounts", data);
    await get().fetchAccounts();
  },

  updateAccount: async (id, data) => {
    await api.put(`/accounts/${id}`, data);
    await get().fetchAccounts();
  },

  deleteAccount: async (id) => {
    await api.delete(`/accounts/${id}`);
    await get().fetchAccounts();
  },

  assignCapital: async (id, data) => {
    await api.post(`/accounts/${id}/capital`, data);
    await get().fetchAccounts();
  },

  transfer: async (id, data) => {
    await api.post(`/accounts/${id}/transfer`, data);
    await get().fetchAccounts();
  },

  getStatus: (id) => api.get<AccountStatusResponse>(`/accounts/${id}/status`),

  getMovements: (id) => api.get<AccountMovement[]>(`/accounts/${id}/movements`),
}));
