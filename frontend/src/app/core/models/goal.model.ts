export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  /** ISO date, format yyyy-MM-dd */
  deadline: string;
  color: string;
}
