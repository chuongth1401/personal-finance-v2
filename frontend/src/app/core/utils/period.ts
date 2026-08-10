export interface MonthPeriod {
  /** Period key, format yyyy-MM. */
  key: string;
  /** Short Vietnamese label, e.g. "Th 8". */
  label: string;
}

export function periodKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function currentPeriodKey(): string {
  return periodKey(new Date());
}

/** Last `count` months (oldest first), including the current month. */
export function lastMonths(count: number, from = new Date()): MonthPeriod[] {
  const months: MonthPeriod[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(from.getFullYear(), from.getMonth() - i, 1);
    months.push({ key: periodKey(d), label: `Th ${d.getMonth() + 1}` });
  }
  return months;
}
