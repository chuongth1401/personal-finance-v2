export type AccountType = 'cash' | 'bank' | 'ewallet' | 'credit';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
}
