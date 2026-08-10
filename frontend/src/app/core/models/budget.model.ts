export interface Budget {
  id: string;
  categoryId: string;
  /** Integer VND spending limit for the period. */
  limit: number;
  /** Period key, format yyyy-MM. */
  period: string;
}
