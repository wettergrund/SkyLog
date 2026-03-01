export type NumericType = 'Decimal' | 'Integer' | 'Time' | 'Currency';

export interface TotalsItem {
  description: string;
  value: number;
  numericType: NumericType;
  group: string;
  subDescription: string | null;
  query: string | null;
}

export interface TotalsResponse {
  grouped: boolean;
  useHHMM: boolean;
  totals: TotalsItem[];
}
