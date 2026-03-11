import { useAircraft } from '../../hooks/useAircraft';
import { useHideAircraft } from '../../hooks/useHideAircraft';
import styles from './HangarPage.module.css';

export default function HangarPage() {
  const { data: aircraftList, isLoading } = useAircraft();
  const hideAircraftMutation = useHideAircraft();

  const totalCount = aircraftList?.length ?? 0;
  const hiddenCount = aircraftList?.filter(ac => ac.hideFromSelection).length ?? 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.pageTitle}>Hangar</h2>
        {aircraftList && (
          <p className={styles.subtitle}>
            {totalCount} aircraft{hiddenCount > 0 ? ` · ${hiddenCount} hidden` : ''}
          </p>
        )}
      </div>

      {isLoading ? (
        <p className={styles.loading}>Loading aircraft…</p>
      ) : !aircraftList || aircraftList.length === 0 ? (
        <p className={styles.empty}>No aircraft in your hangar.</p>
      ) : (
        <div className={styles.grid}>
          {aircraftList.map((ac) => (
            <div
              key={ac.aircraftId}
              className={`${styles.card} ${ac.hideFromSelection ? styles.cardHidden : ''}`}
            >
              {ac.hideFromSelection && (
                <span className={styles.hiddenBadge}>Hidden</span>
              )}
              {ac.defaultImage
                ? <img src={ac.defaultImage} alt={ac.tailNumber} className={styles.cardImage} />
                : <div className={styles.cardNoImage} />
              }
              <span className={styles.tailNumber}>{ac.tailNumber}</span>
              <span className={styles.model}>{ac.model} · {ac.manufacturer}</span>
              <span className={styles.categoryClass}>{ac.categoryClass}</span>
              <button
                type="button"
                className={`${styles.toggleBtn} ${ac.hideFromSelection ? styles.toggleBtnHidden : styles.toggleBtnActive}`}
                onClick={() => hideAircraftMutation.mutate({ id: ac.aircraftId, hide: !ac.hideFromSelection })}
                disabled={hideAircraftMutation.isPending}
              >
                {ac.hideFromSelection ? 'Hidden' : 'Active'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
