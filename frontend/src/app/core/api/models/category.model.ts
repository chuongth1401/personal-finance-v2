export type CategoryKind = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  userId: string;
  name: string;
  kind: CategoryKind;
  color: string;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}
