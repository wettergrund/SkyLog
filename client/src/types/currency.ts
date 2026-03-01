export type CurrencyState = 'OK' | 'GettingClose' | 'NotCurrent' | 'NoDate';

export interface CurrencyItem {
  attribute: string;
  value: string;
  status: CurrencyState;
  discrepancy: string | null;
  query: string | null;
}
