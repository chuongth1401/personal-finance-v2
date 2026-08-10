export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  /** ISO date, format yyyy-MM-dd */
  date: string;
  description: string;
  /** Always a positive integer VND amount; sign is derived from `type`. */
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId: string;
}
