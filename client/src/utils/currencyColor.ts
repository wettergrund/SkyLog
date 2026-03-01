import type { CurrencyState } from '../types/currency';

const STATUS_COLORS: Record<CurrencyState, string> = {
  OK: 'green',
  GettingClose: 'blue',
  NotCurrent: 'red',
  NoDate: 'inherit',
};

export function statusToColor(status: CurrencyState): string {
  return STATUS_COLORS[status] ?? 'inherit';
}
