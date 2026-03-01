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

export default function CurrencyPage() {
  const { data, isLoading, isError, error } = useCurrency();

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load currency'} />;
  if (!data) return null;

  return (
    <div className={styles.page}>
      <h2>Currency</h2>

      {data.length === 0 ? (
        <p>No currency items found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Requirement</th>
              <th>Expires / Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr key={i}>
                <td>{item.attribute}</td>
                <td>{item.value}</td>
                <td
                  className={styles.statusCell}
                  style={{ color: statusToColor(item.status) }}
                >
                  {STATUS_LABELS[item.status] ?? item.status}
                  {item.discrepancy && (
                    <span className={styles.discrepancy}>({item.discrepancy})</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
