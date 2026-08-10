export type AccountType = 'CASH' | 'BANK' | 'EWALLET' | 'CREDIT';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  createdAt: string;
  updatedAt: string;
}
