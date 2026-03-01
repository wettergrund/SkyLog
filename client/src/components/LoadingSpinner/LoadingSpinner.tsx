import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner() {
  return (
    <div className={styles.spinner} role="status" aria-label="Loading">
      <div className={styles.ring} />
    </div>
  );
}
