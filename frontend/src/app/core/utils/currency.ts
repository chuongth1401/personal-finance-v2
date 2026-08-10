const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export function formatVnd(amount: number): string {
  return vndFormatter.format(amount);
}

/** Compact form for chart axes/labels, e.g. 1_500_000 -> "1,5tr". */
export function formatVndCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    return `${sign}${trimTrailingZero(abs / 1_000_000)}tr`;
  }
  if (abs >= 1_000) {
    return `${sign}${trimTrailingZero(abs / 1_000)}k`;
  }
  return `${sign}${abs}`;
}

function trimTrailingZero(value: number): string {
  return value.toFixed(1).replace('.0', '').replace('.', ',');
}
