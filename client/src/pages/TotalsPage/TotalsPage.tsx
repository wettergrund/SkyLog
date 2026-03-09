import { useTotals } from '../../hooks/useTotals';
import { formatTime } from '../../utils/formatTime';
import type { TotalsItem } from '../../types/totals';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import styles from './TotalsPage.module.css';

function formatValue(item: TotalsItem, usesHHMM: boolean): string {
  switch (item.numericType) {
    case 'Time':
      return formatTime(item.value, usesHHMM);
    case 'Integer':
      return String(Math.round(item.value));
    case 'Currency':
      return item.value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    default:
      return item.value.toFixed(1);
  }
}

function typeClass(numericType: string): string {
  switch (numericType) {
    case 'Time':     return styles.typeTime;
    case 'Currency': return styles.typeCurrency;
    case 'Integer':  return styles.typeInteger;
    default:         return styles.typeDecimal;
  }
}

export default function TotalsPage() {
  const { data, isLoading, isError, error } = useTotals();

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load totals'} />;
  if (!data) return null;

  const groups: Map<string, TotalsItem[]> = new Map();
  for (const item of data.totals) {
    const key = item.group ?? '';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.pageTitle}>Totals</h2>

      {groups.size === 0 && <p className={styles.empty}>No totals found.</p>}

      {[...groups.entries()].map(([groupName, items]) => (
        <div key={groupName} className={styles.group}>
          {groupName && <h3 className={styles.groupTitle}>{groupName}</h3>}
          <div className={styles.bentoGrid}>
            {items.map((item, i) => (
              <div key={i} className={`${styles.bentoCard} ${typeClass(item.numericType)}`}>
                <span className={styles.bentoLabel}>
                  {item.description}
                  {item.subDescription && (
                    <small className={styles.bentoSub}>{item.subDescription}</small>
                  )}
                </span>
                <span className={styles.bentoValue}>{formatValue(item, data.useHHMM)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
