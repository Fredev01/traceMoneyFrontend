export interface ExpenseResponse {
  id: string;
  amount: number;
  description: string;
  category_id: string;
  category_name: string | null;
  tag: "FIJO" | "VARIABLE" | "HORMIGA";
  payment_method: "EFECTIVO" | "DEBITO" | "CREDITO" | "TRANSFERENCIA";
  expense_date: string;
  created_at: string;
}

export interface CategoryResponse {
  id: string;
  name: string;
  parent_id: string | null;
  color: string;
}

export interface IncomeResponse {
  id: string;
  amount: number;
  source: string;
  note: string | null;
  income_date: string;
  created_at: string;
}

export interface CreditCard {
  id: string;
  bank_name: string;
  credit_limit: number;
  cut_day: number;
  payment_due_day: number;
  color: string;
}

export interface PaymentDetail {
  payment_id: string;
  plan_id: string;
  concept: string;
  bank_name: string;
  amount: number;
  due_date: string;
  status: "PENDIENTE" | "PAGADO";
  paid_amount: number | null;
  month_number: number;
  num_installments: number;
}

export interface InstallmentDetail {
  payment_id: string;
  month_number: number;
  amount: number;
  due_date: string;
  status: "PENDIENTE" | "PAGADO";
  paid_amount: number | null;
}

export interface ActivePlan {
  plan_id: string;
  concept: string;
  bank_name: string;
  total_amount: number;
  num_installments: number;
  purchase_date: string;
  payments: InstallmentDetail[];
  interest_rate: number;
  credit_card_id: string;
  status: string;
}

export interface LoanDetail {
  loan_id: string;
  concept: string;
  capital: number;
  cat_anual: number;
  plazo_meses: number;
  loan_date: string;
  bank_name: string;
  card_id: string;
  status: string;
}

export interface UpdatePlanPayload {
  concept: string;
  total_amount?: number;
  num_installments?: number;
  annual_interest_rate?: number;
  purchase_date?: string;
}

export interface UpdateLoanPayload {
  concept: string;
  capital?: number;
  cat_anual?: number;
  plazo_meses?: number;
  loan_date?: string;
}

export interface MonthDebtSummary {
  year: number;
  month: number;
  payments: PaymentDetail[];
  total: number;
}

export interface LoanPaymentDetail {
  payment_id: string;
  loan_id: string;
  concept: string;
  bank_name: string;
  month_number: number;
  cuota: number;
  interes: number;
  abono_capital: number;
  saldo_final: number;
  due_date: string;
  status: "PENDIENTE" | "PAGADO";
  paid_amount: number | null;
}

export interface MonthLoanSummary {
  year: number;
  month: number;
  payments: LoanPaymentDetail[];
  total: number;
}

export interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  total: number;
  percentage: number;
  color: string;
}

export interface TagBreakdown {
  tag: string;
  total: number;
  percentage: number;
}

export interface MonthlyBalancePoint {
  year: number;
  month: number;
  total_income: number;
  total_expenses: number;
  total_debt_payments: number;
  net_balance: number;
}

export interface DebtSummaryItem {
  plan_id: string;
  concept: string;
  bank_name: string;
  total_amount: number;
  remaining_balance: number;
  paid_percentage: number;
  next_payment_amount: number | null;
  next_payment_date: string | null;
}

export interface DashboardSummary {
  year: number;
  month: number;
  total_income: number;
  total_expenses: number;
  total_debt_payments: number;
  net_balance: number;
  total_active_debt: number;
  category_breakdown: CategoryBreakdown[];
  tag_breakdown: TagBreakdown[];
  monthly_history: MonthlyBalancePoint[];
  active_debts: DebtSummaryItem[];
}
