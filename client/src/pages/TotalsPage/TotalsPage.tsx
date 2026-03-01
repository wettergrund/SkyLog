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

export default function TotalsPage() {
  const { data, isLoading, isError, error } = useTotals();

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load totals'} />;
  if (!data) return null;

  // Group totals by ti.group, preserving order
  const groups: Map<string, TotalsItem[]> = new Map();
  for (const item of data.totals) {
    const key = item.group ?? '';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  return (
    <div className={styles.page}>
      <h2>Totals</h2>

      {groups.size === 0 && <p>No totals found.</p>}

      {[...groups.entries()].map(([groupName, items]) => (
        <div key={groupName} className={styles.group}>
          {groupName && <h3 className={styles.groupTitle}>{groupName}</h3>}
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style={{ textAlign: 'right', width: '8rem' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td>
                    {item.description}
                    {item.subDescription && (
                      <span className={styles.sub}> — {item.subDescription}</span>
                    )}
                  </td>
                  <td className={styles.val}>{formatValue(item, data.useHHMM)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
