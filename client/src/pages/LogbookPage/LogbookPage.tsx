import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFlights } from '../../hooks/useFlights';
import { useDeleteFlight } from '../../hooks/UseDeleteFlight';
import { formatTime } from '../../utils/formatTime';
import type { SortDirection } from '../../types/flights';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import Pagination from '../../components/Pagination/Pagination';
import styles from './LogbookPage.module.css';


const PAGE_SIZE = 25;

interface Column {
  key: string;
  label: string;
  numeric?: boolean;
}

const COLUMNS: Column[] = [
    { key: 'id', label: 'Id' },
  { key: 'date', label: 'Date' },
  { key: 'tailNumber', label: 'Tail #' },
  { key: 'modelDisplay', label: 'Model' },
  { key: 'from', label: 'From' },
    { key: 'to', label: 'To' },
  { key: 'totalFlightTime', label: 'Total', numeric: true },
  { key: 'pic', label: 'PIC', numeric: true },
  { key: 'sic', label: 'SIC', numeric: true },
  { key: 'dual', label: 'Dual', numeric: true },
  { key: 'nighttime', label: 'Night', numeric: true },
  { key: 'crossCountry', label: 'XC', numeric: true },
  { key: 'imc', label: 'IMC', numeric: true },
  { key: 'approaches', label: 'Appr', numeric: true },
  { key: 'landings', label: 'Ldg', numeric: true },
					      { key: 'del', label: 'Delete'   },
];

function fmtNum(val: number, usesHHMM: boolean, isTime: boolean): string {
  if (val === 0) return '';
  if (isTime) return formatTime(val, usesHHMM);
  return String(val);
}

export default function LogbookPage() {

  const deleteFlightMutation = useDeleteFlight();

  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const skip = Number(searchParams.get('skip') ?? 0);
  const sortKey = searchParams.get('sortKey') ?? 'date';
  const sortDir = (searchParams.get('sortDir') ?? 'Descending') as SortDirection;

  const { data, isLoading, isError, error, isPlaceholderData } = useFlights({
    skip,
    limit: PAGE_SIZE,
    sortKey,
    sortDir,
  });
console.log(data?.flights[0])
  function deleteFlight(id: number){

    deleteFlightMutation.mutate(id);


  }

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
          <div className={`${styles.tableWrapper}${isPlaceholderData ? ` ${styles.stale}` : ''}`}>
            <table>
              <thead>
                <tr>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className={styles.sortable}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                      {sortKey === col.key && (
                        <span className={styles.sortIcon}>
                          {sortDir === 'Ascending' ? '▲' : '▼'}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.flights.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className={styles.dim}>
                      No flights found.
                    </td>
                  </tr>
                ) : (
                  data.flights.map((f) => (
                    <tr key={f.id}>
                                        <td>{f.id}</td>
                      <td>{f.date.slice(0, 10)}</td>
                      <td>{f.tailNumber}</td>
                      <td>{f.modelDisplay}</td>
                      <td>{f.from}</td>
                      <td>{f.to}</td>
                      <td className={styles.num}>{fmtNum(f.totalFlightTime, usesHHMM, true)}</td>
                      <td className={styles.num}>{fmtNum(f.pic, usesHHMM, true)}</td>
                      <td className={styles.num}>{fmtNum(f.sic, usesHHMM, true)}</td>
                      <td className={styles.num}>{fmtNum(f.dual, usesHHMM, true)}</td>
                      <td className={styles.num}>{fmtNum(f.nighttime, usesHHMM, true)}</td>
                      <td className={styles.num}>{fmtNum(f.crossCountry, usesHHMM, true)}</td>
                      <td className={styles.num}>{fmtNum(f.imc, usesHHMM, true)}</td>
                      <td className={styles.num}>{fmtNum(f.approaches, false, false)}</td>
                      <td className={styles.num}>{fmtNum(f.landings, false, false)}</td>
                      <td className={styles.num}>

                                      <button
                type="button"
                className={styles.addAircraftBtn}
                onClick={() => deleteFlight(f.id)}
        
              >
                Del
              </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            totalCount={data.totalCount}
            skip={skip}
            limit={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
