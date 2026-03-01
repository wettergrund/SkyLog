import { useState, useEffect } from 'react';
import { useAircraft } from '../../hooks/useAircraft';
import { useCreateFlight } from '../../hooks/useCreateFlight';
import styles from './QuickAddFlight.module.css';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function blockTimeDiff(off: string, on: string): string | null {
  const offMatch = off.match(/^(\d{1,2}):(\d{2})$/);
  const onMatch  = on.match(/^(\d{1,2}):(\d{2})$/);
  if (!offMatch || !onMatch) return null;
  let diffMin =
    (Number(onMatch[1]) * 60 + Number(onMatch[2])) -
    (Number(offMatch[1]) * 60 + Number(offMatch[2]));
  if (diffMin < 0) diffMin += 24 * 60;
  return (diffMin / 60).toFixed(1);
}

function BlockInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value.replace(/[^\d:]/g, '');
    if (!raw.includes(':') && raw.length >= 2) {
      raw = raw.slice(0, 2) + ':' + raw.slice(2);
    }
    if (raw.length > 5) return;
    onChange(raw);
  }
  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      maxLength={5}
      value={value}
      onChange={handleChange}
      className={styles.input}
    />
  );
}

function SaveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function QuickAddFlight() {
  const { data: aircraftList, isLoading: aircraftLoading } = useAircraft();
  const createFlightMutation = useCreateFlight();

  const [date,               setDate]               = useState(todayIso());
  const [blockOff,           setBlockOff]           = useState('');
  const [blockOn,            setBlockOn]            = useState('');
  const [selectedAircraftId, setSelectedAircraftId] = useState('');
  const [from,               setFrom]               = useState('');
  const [to,                 setTo]                 = useState('');
  const [totalFlightTime,    setTotalFlightTime]    = useState('');

  useEffect(() => {
    const calc = blockTimeDiff(blockOff, blockOn);
    if (calc !== null) setTotalFlightTime(calc);
  }, [blockOff, blockOn]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const aircraftId = Number(selectedAircraftId);
    if (!aircraftId || !date || !totalFlightTime) return;
    try {
      await createFlightMutation.mutateAsync({
        date,
        aircraftId,
        from: from || undefined,
        to:   to   || undefined,
        totalFlightTime: Number(totalFlightTime),
      });
      setDate(todayIso());
      setBlockOff('');
      setBlockOn('');
      setFrom('');
      setTo('');
      setTotalFlightTime('');
    } catch {
      // mutation error shown via button state
    }
  }

  const submitDisabled =
    createFlightMutation.isPending ||
    !date ||
    !selectedAircraftId ||
    !totalFlightTime  
    ;

  // Grid row: 15 cells matching LogbookPage COLUMNS + delete column
  // 1:date  2:aircraft  3:—  4:from  5:to  6:total  7:blockOff  8:blockOn  9-14:—  15:save
  return (
    <form className={`${styles.row}${createFlightMutation.isError ? ` ${styles.rowError}` : ''}`}
      onSubmit={handleSubmit} noValidate
    >
      {/* 1 — date */}
      <div className={styles.cell}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={styles.input}
        />
      </div>
            {/* 7 — blockOff (PIC col) */}
      <div className={styles.cell}>
        <BlockInput placeholder="Off" value={blockOff} onChange={setBlockOff} />
      </div>

      {/* 8 — blockOn (SIC col) */}
      <div className={styles.cell}>
        <BlockInput placeholder="On" value={blockOn} onChange={setBlockOn} />
      </div>


      {/* 2 — aircraft (Tail # col) */}
      <div className={styles.cell}>
        <select
          value={selectedAircraftId}
          onChange={(e) => setSelectedAircraftId(e.target.value)}
          disabled={aircraftLoading}
          className={styles.input}
        >
          <option value="">—</option>
          {aircraftList?.map((ac) => (
            <option key={ac.aircraftId} value={String(ac.aircraftId)}>
              {ac.tailNumber}
            </option>
          ))}
        </select>
      </div>
{/* <div className={styles.cell} /> */}
      {/* 3 — model col, unused */}
      <div className={styles.cell} />

      {/* 4 — from */}
      <div className={styles.cell}>
        <input
          type="text"
          placeholder="From"
          value={from}
          onChange={(e) => setFrom(e.target.value.toUpperCase())}
          className={styles.input}
        />
      </div>

      {/* 5 — to */}
      <div className={styles.cell}>
        <input
          type="text"
          placeholder="To"
          value={to}
          onChange={(e) => setTo(e.target.value.toUpperCase())}
          className={styles.input}
        />
      </div>

      {/* 6 — total */}
      <div className={styles.cell}>
        <input
          type="number"
          min="0"
          step="0.1"
          placeholder="0.0"
          value={totalFlightTime}
          onChange={(e) => setTotalFlightTime(e.target.value)}
          className={`${styles.input} ${styles.numInput}`}
        />
      </div>


      {/* 9–14 — unused cols */}
      {/* <div className={styles.cell} /> */}
      <div className={styles.cell} />
      <div className={styles.cell} />
      <div className={styles.cell} />
      <div className={styles.cell} />
      <div className={styles.cell} />
      <div className={styles.cell} />
      <div className={styles.cell} />
      <div className={styles.cell} />

      {/* 15 — save (del col) */}
      <div className={styles.cell}>
        <button
          type="submit"
          className={styles.saveBtn}
          disabled={submitDisabled}
          aria-label="Save flight"
          title={createFlightMutation.isError ? 'Save failed — try again' : 'Save flight'}
        >
          {createFlightMutation.isPending ? '…' : <SaveIcon />}
        </button>
      </div>
    </form>
  );
}
