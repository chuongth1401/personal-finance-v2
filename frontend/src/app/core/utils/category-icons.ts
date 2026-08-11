/** Bộ icon rút gọn cho danh mục thu/chi - khớp tên icon (kebab-case) của Lucide. */
export type CategoryIconKey =
  | 'utensils'
  | 'car'
  | 'shopping-bag'
  | 'receipt'
  | 'film'
  | 'heart-pulse'
  | 'home'
  | 'graduation-cap'
  | 'banknote'
  | 'gift'
  | 'wallet'
  | 'piggy-bank'
  | 'briefcase'
  | 'tag';

export const CATEGORY_ICON_OPTIONS: { value: CategoryIconKey; label: string }[] = [
  { value: 'tag', label: 'Thẻ (mặc định)' },
  { value: 'utensils', label: 'Ăn uống' },
  { value: 'car', label: 'Di chuyển' },
  { value: 'shopping-bag', label: 'Mua sắm' },
  { value: 'receipt', label: 'Hoá đơn' },
  { value: 'film', label: 'Giải trí' },
  { value: 'heart-pulse', label: 'Sức khoẻ' },
  { value: 'home', label: 'Nhà ở' },
  { value: 'graduation-cap', label: 'Giáo dục' },
  { value: 'banknote', label: 'Lương' },
  { value: 'gift', label: 'Thưởng' },
  { value: 'wallet', label: 'Ví' },
  { value: 'piggy-bank', label: 'Tiết kiệm' },
  { value: 'briefcase', label: 'Công việc' },
];

export function isCategoryIconKey(value: string | null): value is CategoryIconKey {
  return CATEGORY_ICON_OPTIONS.some((opt) => opt.value === value);
}
