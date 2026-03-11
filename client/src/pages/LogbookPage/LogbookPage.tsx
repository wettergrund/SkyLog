import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFlights } from '../../hooks/useFlights';
import { useDeleteFlight } from '../../hooks/useDeleteFlight';
import { formatTime } from '../../utils/formatTime';
import type { SortDirection } from '../../types/flights';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import Pagination from '../../components/Pagination/Pagination';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import styles from './LogbookPage.module.css';

const PAGE_SIZE = 25;

interface Column {
  key: string;
  label: string;
  numeric?: boolean;
}

const COLUMNS: Column[] = [
  { key: 'date',            label: 'Date'  },
    { key: 'blockoff',            label: ''  },
      { key: 'blockon',            label: ''  },
  { key: 'tailNumber',      label: 'Tail #' },
  { key: 'modelDisplay',    label: 'Model' },
  { key: 'from',            label: 'From'  },
  { key: 'to',              label: 'To'    },
  { key: 'totalFlightTime', label: 'Total',  numeric: true },
  { key: 'pic',             label: 'PIC',    numeric: true },
  { key: 'sic',             label: 'SIC',    numeric: true },
  { key: 'dual',            label: 'Dual',   numeric: true },
  { key: 'nighttime',       label: 'Night',  numeric: true },
  { key: 'crossCountry',    label: 'XC',     numeric: true },
  { key: 'imc',             label: 'IMC',    numeric: true },
  { key: 'approaches',      label: 'Appr',   numeric: true },
  { key: 'landings',        label: 'Ldg',    numeric: true },
];

function fmtBlockTime(iso: string | null): string {
  if (!iso) return '';
  // ISO: "2025-08-14T14:38:00" → slice chars 11–15 → "14:38"
  return iso.slice(11, 16);
}

function fmtNum(val: number, usesHHMM: boolean, isTime: boolean): string {
  if (val === 0) return '';
  if (isTime) return formatTime(val, usesHHMM);
  return String(val);
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export default function LogbookPage() {
  const deleteFlightMutation = useDeleteFlight();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const skip    = Number(searchParams.get('skip')    ?? 0);
  const sortKey = searchParams.get('sortKey')        ?? 'date';
  const sortDir = (searchParams.get('sortDir')       ?? 'Descending') as SortDirection;

  const { data, isLoading, isError, error, isPlaceholderData } = useFlights({
    skip,
    limit: PAGE_SIZE,
    sortKey,
    sortDir,
  });

  function handleSort(key: string) {
    const newDir: SortDirection =
      sortKey === key && sortDir === 'Descending' ? 'Ascending' : 'Descending';
    setSearchParams({ skip: '0', sortKey: key, sortDir: newDir });
  }

  function handlePageChange(newSkip: number) {
    setSearchParams({ skip: String(newSkip), sortKey, sortDir });
  }

  const usesHHMM = user?.usesHHMM ?? false;

  return (
    <div className={styles.page}>
      <h2>Logbook</h2>

      {isLoading && <LoadingSpinner />}
      {isError && <ErrorMessage message={error instanceof Error ? error.message : 'Failed to load flights'} />}

      {data && (
        <>
          <div className={`${styles.card}${isPlaceholderData ? ` ${styles.stale}` : ''}`}>
            <div className={styles.gridWrapper}>

              {/* Header */}
              <div className={styles.headerRow}>
                {COLUMNS.map((col) => (
                  <div
                    key={col.key}
                    className={`${styles.headerCell}${col.numeric ? ` ${styles.num}` : ''}`}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span className={styles.sortIcon}>
                        {sortDir === 'Ascending' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                ))}
                <div className={styles.headerCell} />
              </div>

              {/* Rows */}
              {data.flights.length === 0 ? (
                <div className={styles.emptyRow}>No flights found.</div>
              ) : (
                data.flights.map((f) => (
                  <div key={f.id} className={styles.dataRow} onClick={() => navigate(`/flights/${f.id}/edit`)}>
                    <div className={`${styles.cell} ${styles.cellDate}`}>{f.date.slice(0, 10)}</div>
                    <div className={`${styles.cell} ${styles.cellStart}`}>{fmtBlockTime(f.flightStart)}</div>
                    <div className={`${styles.cell} ${styles.cellEnd}`}>{fmtBlockTime(f.flightEnd)}</div>
                    <div className={`${styles.cell} ${styles.cellTail}`}>{f.tailNumber}</div>
                    <div className={`${styles.cell} ${styles.cellModel}`}>{f.modelDisplay}</div>
                    <div className={`${styles.cell} ${styles.cellFrom}`}>{f.from}</div>
                    <div className={`${styles.cell} ${styles.cellTo}`}>{f.to}</div>
                    <div className={`${styles.cell} ${styles.num} ${styles.cellTotal}`}>{fmtNum(f.totalFlightTime, usesHHMM, true)}</div>
                    <div className={`${styles.cell} ${styles.num} ${styles.cellPic}`}>{fmtNum(f.pic,             usesHHMM, true)}</div>
                    <div className={`${styles.cell} ${styles.num} ${styles.cellSic}`}>{fmtNum(f.sic,             usesHHMM, true)}</div>
                    <div className={`${styles.cell} ${styles.num} ${styles.cellDual}`}>{fmtNum(f.dual,           usesHHMM, true)}</div>
                    <div className={`${styles.cell} ${styles.num} ${styles.cellNight}`}>{fmtNum(f.nighttime,     usesHHMM, true)}</div>
                    <div className={`${styles.cell} ${styles.num} ${styles.cellXc}`}>{fmtNum(f.crossCountry,     usesHHMM, true)}</div>
                    <div className={`${styles.cell} ${styles.num} ${styles.cellImc}`}>{fmtNum(f.imc,             usesHHMM, true)}</div>
                    <div className={`${styles.cell} ${styles.num} ${styles.cellAppr}`}>{fmtNum(f.approaches,     false,    false)}</div>
                    <div className={`${styles.cell} ${styles.num} ${styles.cellLdg}`}>{fmtNum(f.landings,        false,    false)}</div>
                    <div className={`${styles.cell} ${styles.delCell}`}>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={() => navigate(`/flights/${f.id}/edit`)}
                        aria-label="Edit flight"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={(e) => { e.stopPropagation(); setPendingDeleteId(f.id); }}
                        aria-label="Delete flight"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))
              )}

            </div>
          </div>

          <Pagination
            totalCount={data.totalCount}
            skip={skip}
            limit={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {pendingDeleteId !== null && (
        <ConfirmModal
          message="Delete this flight? This cannot be undone."
          onConfirm={() => {
            deleteFlightMutation.mutate(pendingDeleteId);
            setPendingDeleteId(null);
          }}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </div>
  );
}
