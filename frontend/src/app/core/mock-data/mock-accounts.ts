import { Account } from '../models/account.model';

export const MOCK_ACCOUNTS: Account[] = [
  { id: 'acc-cash', name: 'Tiền mặt', type: 'cash', balance: 2_150_000 },
  { id: 'acc-vcb', name: 'Vietcombank', type: 'bank', balance: 48_320_000 },
  { id: 'acc-momo', name: 'Momo', type: 'ewallet', balance: 3_480_000 },
  { id: 'acc-vib', name: 'Thẻ tín dụng VIB', type: 'credit', balance: -4_650_000 },
];
