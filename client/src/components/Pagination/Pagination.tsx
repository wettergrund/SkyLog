import styles from './Pagination.module.css';

interface Props {
  totalCount: number;
  skip: number;
  limit: number;
  onPageChange: (newSkip: number) => void;
}

export default function Pagination({ totalCount, skip, limit, onPageChange }: Props) {
  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const hasPrev = skip > 0;
  const hasNext = skip + limit < totalCount;

  return (
    <div className={styles.pagination}>
      <button
        className={styles.btn}
        disabled={!hasPrev}
        onClick={() => onPageChange(Math.max(0, skip - limit))}
      >
        &laquo; Prev
      </button>
      <span className={styles.info}>
        Page {currentPage} of {totalPages} &mdash; {totalCount} flights
      </span>
      <button
        className={styles.btn}
        disabled={!hasNext}
        onClick={() => onPageChange(skip + limit)}
      >
        Next &raquo;
      </button>
    </div>
  );
}
