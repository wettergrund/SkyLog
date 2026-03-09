import { useCurrency } from '../../hooks/useCurrency';
import { statusToColor } from '../../utils/currencyColor';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import styles from './CurrencyPage.module.css';

const STATUS_LABELS: Record<string, string> = {
  OK: 'Current',
  GettingClose: 'Getting Close',
  NotCurrent: 'Not Current',
  NoDate: 'No Date',
};

const STATUS_CLASS: Record<string, string> = {
  OK: 'statusOk',
  GettingClose: 'statusWarning',
  NotCurrent: 'statusDanger',
  NoDate: 'statusNone',
};

export default function CurrencyPage() {
  const { data, isLoading, isError, error } = useCurrency();

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load currency'} />;
  if (!data) return null;

  return (
    <div className={styles.page}>
      <h2 className={styles.pageTitle}>Currency</h2>

      {data.length === 0 ? (
        <p className={styles.empty}>No currency items found.</p>
      ) : (
        <div className={styles.bentoGrid}>
          {data.map((item, i) => (
            <div
              key={i}
              className={`${styles.bentoCard} ${styles[STATUS_CLASS[item.status] ?? 'statusNone']}`}
            >
              <span className={styles.bentoLabel}>{item.attribute}</span>
              <span className={styles.bentoValue}>{item.value}</span>
              <div className={styles.bentoFooter}>
                <span
                  className={styles.statusDot}
                  style={{ background: statusToColor(item.status) }}
                />
                <span className={styles.statusText}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </span>
                {item.discrepancy && (
                  <span className={styles.discrepancy}>({item.discrepancy})</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
