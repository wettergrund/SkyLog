import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAircraft } from '../../hooks/useAircraft';
import { useCreateAircraft } from '../../hooks/useCreateAircraft';
import { useCreateFlight } from '../../hooks/useCreateFlight';

import { getCategoryClasses } from '../../api/aircraft';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import styles from './NewFlightPage.module.css';

const NEW_AIRCRAFT_SENTINEL = '__new__';

const INSTANCE_TYPES = [
  { value: 'RealAircraft', label: 'Real Aircraft' },
  { value: 'UncertifiedSimulator', label: 'Uncertified Simulator' },
  { value: 'CertifiedATD', label: 'Certified ATD' },
  { value: 'CertifiedFTD', label: 'Certified FTD' },
  { value: 'CertifiedSim', label: 'Certified Sim' },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NewFlightPage() {
  const navigate = useNavigate();

  // ── Aircraft data ─────────────────────────────────────────────────────────
  const { data: aircraftList, isLoading: aircraftLoading } = useAircraft();
  const { data: categoryClasses } = useQuery({
    queryKey: ['categoryClasses'],
    queryFn: getCategoryClasses,
    staleTime: 10 * 60 * 1000,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createAircraftMutation = useCreateAircraft();

  const createFlightMutation = useCreateFlight();

  // ── Flight form state ─────────────────────────────────────────────────────
  const [date, setDate] = useState(todayIso());
  const [blockOff, setBlockOff] = useState('');
  const [blockOn, setBlockOn] = useState('');
  const [selectedAircraftId, setSelectedAircraftId] = useState('');
  // const [route, setRoute] = useState('');
    const [from, setFrom] = useState('');
      const [to, setTo] = useState('');
  const [totalFlightTime, setTotalFlightTime] = useState('');

  // ── Auto-calculate total from block times ────────────────────────────────
  useEffect(() => {
    const offMatch = blockOff.match(/^(\d{1,2}):(\d{2})$/);
    const onMatch  = blockOn.match(/^(\d{1,2}):(\d{2})$/);
    if (!offMatch || !onMatch) return;
    let diffMin =
      (Number(onMatch[1]) * 60 + Number(onMatch[2])) -
      (Number(offMatch[1]) * 60 + Number(offMatch[2]));
    if (diffMin < 0) diffMin += 24 * 60; // overnight
    setTotalFlightTime((diffMin / 60).toFixed(1));
  }, [blockOff, blockOn]);

  const [pic, setPic] = useState('');
  const [sic, setSic] = useState('');
  const [dual, setDual] = useState('');
  const [cfi, setCfi] = useState('');
  const [crossCountry, setCrossCountry] = useState('');
  const [nighttime, setNighttime] = useState('');
  const [imc, setImc] = useState('');
  const [simulatedIFR, setSimulatedIFR] = useState('');
  const [groundSim, setGroundSim] = useState('');
  const [approaches, setApproaches] = useState('');
  const [landings, setLandings] = useState('');
  const [fullStopLandings, setFullStopLandings] = useState('');
  const [nightLandings, setNightLandings] = useState('');
  const [holdingProcedures, setHoldingProcedures] = useState(false);
  const [comment, setComment] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // ── New aircraft sub-form state ───────────────────────────────────────────
  const [tailNumber, setTailNumber] = useState('');
  const [manufacturerName, setManufacturerName] = useState('');
  const [modelName, setModelName] = useState('');
  const [categoryClassId, setCategoryClassId] = useState('');
  const [instanceType, setInstanceType] = useState('RealAircraft');
  const [aircraftError, setAircraftError] = useState('');

  const showNewAircraftForm = selectedAircraftId === NEW_AIRCRAFT_SENTINEL;

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleAddAircraft(e: React.FormEvent) {
    e.preventDefault();
    setAircraftError('');

    if (!tailNumber.trim() || !manufacturerName.trim() || !modelName.trim() || !categoryClassId) {
      setAircraftError('All aircraft fields are required.');
      return;
    }

    try {
      const aircraft = await createAircraftMutation.mutateAsync({
        tailNumber,
        manufacturerName,
        modelName,
        categoryClassId: Number(categoryClassId),
        instanceType,
      });
      setSelectedAircraftId(String(aircraft.aircraftId));
      setTailNumber('');
      setManufacturerName('');
      setModelName('');
      setCategoryClassId('');
      setInstanceType('RealAircraft');
    } catch (err) {
      setAircraftError(err instanceof Error ? err.message : 'Failed to add aircraft.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const aircraftId = Number(selectedAircraftId);
    if (!aircraftId || !date || !totalFlightTime) return;

    try {
      await createFlightMutation.mutateAsync({
        date,
        aircraftId,
        from: from || undefined,
        to: to || undefined,
        comment: comment || undefined,
        totalFlightTime: Number(totalFlightTime),
        pic: pic ? Number(pic) : undefined,
        sic: sic ? Number(sic) : undefined,
        dual: dual ? Number(dual) : undefined,
        cfi: cfi ? Number(cfi) : undefined,
        crossCountry: crossCountry ? Number(crossCountry) : undefined,
        nighttime: nighttime ? Number(nighttime) : undefined,
        imc: imc ? Number(imc) : undefined,
        simulatedIFR: simulatedIFR ? Number(simulatedIFR) : undefined,
        groundSim: groundSim ? Number(groundSim) : undefined,
        approaches: approaches ? Number(approaches) : undefined,
        landings: landings ? Number(landings) : undefined,
        fullStopLandings: fullStopLandings ? Number(fullStopLandings) : undefined,
        nightLandings: nightLandings ? Number(nightLandings) : undefined,
        holdingProcedures: holdingProcedures || undefined,
        isPublic: isPublic || undefined,
      });
      navigate('/logbook');
    } catch {
      // error is shown via createFlightMutation.error
    }
  }

  const submitDisabled =
    createFlightMutation.isPending ||
    !date ||
    !selectedAircraftId ||
    selectedAircraftId === NEW_AIRCRAFT_SENTINEL ||
    !totalFlightTime;

  return (
    <div className={styles.page}>
      <h2>Log a Flight</h2>

      <form onSubmit={handleSubmit} noValidate>

        {/* ── Section 1: Flight basics ─────────────────────────────────────── */}
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Flight Basics</h3>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="date">Date *</label>
              <input
                id="date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <BlockTimeField id="blockOff" label="Block Off" value={blockOff} onChange={setBlockOff} />
            <BlockTimeField id="blockOn"  label="Block On"  value={blockOn}  onChange={setBlockOn} />
            <div className={styles.field}>
              <label htmlFor="aircraft">Aircraft *</label>
              <select
                id="aircraft"
                required
                value={selectedAircraftId}
                onChange={(e) => setSelectedAircraftId(e.target.value)}
                disabled={aircraftLoading}
              >
                <option value="">-- Select aircraft --</option>
                {aircraftList?.map((ac) => (
                  <option key={ac.aircraftId} value={String(ac.aircraftId)}>
                    {ac.tailNumber}{ac.model ? ` — ${ac.model}` : ''}
                  </option>
                ))}
                <option value={NEW_AIRCRAFT_SENTINEL}>+ New aircraft</option>
              </select>
            </div>

            <div className={`${styles.field} ${styles.fieldWide}`}>
              <label htmlFor="route">From</label>
              <input
                id="route"
                type="text"
                placeholder="ESOW"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
                        <div className={`${styles.field} ${styles.fieldWide}`}>
              <label htmlFor="route">To</label>
              <input
                id="route"
                type="text"
                placeholder="ESSA"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>

          {/* Inline new aircraft sub-form */}
          {showNewAircraftForm && (
            <div className={styles.subForm}>
              <h4 className={styles.subFormTitle}>New Aircraft</h4>

              {aircraftError && <ErrorMessage message={aircraftError} />}

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="tailNumber">Tail Number *</label>
                  <input
                    id="tailNumber"
                    type="text"
                    placeholder="N12345"
                    value={tailNumber}
                    onChange={(e) => setTailNumber(e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="manufacturer">Manufacturer *</label>
                  <input
                    id="manufacturer"
                    type="text"
                    placeholder="Cessna"
                    value={manufacturerName}
                    onChange={(e) => setManufacturerName(e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="model">Model *</label>
                  <input
                    id="model"
                    type="text"
                    placeholder="172"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="categoryClass">Category/Class *</label>
                  <select
                    id="categoryClass"
                    value={categoryClassId}
                    onChange={(e) => setCategoryClassId(e.target.value)}
                  >
                    <option value="">-- Select --</option>
                    {categoryClasses?.map((cc) => (
                      <option key={cc.id} value={String(cc.id)}>
                        {cc.catClass}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label htmlFor="instanceType">Instance Type</label>
                  <select
                    id="instanceType"
                    value={instanceType}
                    onChange={(e) => setInstanceType(e.target.value)}
                  >
                    {INSTANCE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                className={styles.addAircraftBtn}
                onClick={handleAddAircraft}
                disabled={createAircraftMutation.isPending}
              >
                {createAircraftMutation.isPending ? 'Adding…' : 'Add Aircraft'}
              </button>
            </div>
          )}
        </section>

        {/* ── Section 2: Flight times ──────────────────────────────────────── */}
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Flight Times</h3>
          <div className={styles.timeGrid}>
            <TimeField id="totalFlightTime" label="Total *" value={totalFlightTime} onChange={setTotalFlightTime} />
            <TimeField id="pic"             label="PIC"     value={pic}             onChange={setPic} />
            <TimeField id="sic"             label="SIC"     value={sic}             onChange={setSic} />
            <TimeField id="dual"            label="Dual"    value={dual}            onChange={setDual} />
            <TimeField id="cfi"             label="CFI"     value={cfi}             onChange={setCfi} />
            <TimeField id="crossCountry"    label="Cross Country" value={crossCountry} onChange={setCrossCountry} />
            <TimeField id="nighttime"       label="Night"   value={nighttime}       onChange={setNighttime} />
            <TimeField id="imc"             label="IMC"     value={imc}             onChange={setImc} />
            <TimeField id="simulatedIFR"    label="Sim IFR" value={simulatedIFR}    onChange={setSimulatedIFR} />
            <TimeField id="groundSim"       label="Ground Sim" value={groundSim}    onChange={setGroundSim} />
          </div>
        </section>

        {/* ── Section 3: Landings & notes ──────────────────────────────────── */}
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Landings &amp; Notes</h3>

          <div className={styles.fieldRow}>
            <IntField id="landings"        label="Landings"    value={landings}        onChange={setLandings} />
            <IntField id="fullStop"        label="Full Stop"   value={fullStopLandings} onChange={setFullStopLandings} />
            <IntField id="nightLandings"   label="Night Ldg"   value={nightLandings}   onChange={setNightLandings} />
            <IntField id="approaches"      label="Approaches"  value={approaches}      onChange={setApproaches} />
          </div>

          <div className={styles.checkRow}>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={holdingProcedures}
                onChange={(e) => setHoldingProcedures(e.target.checked)}
              />
              Holding Procedures
            </label>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              Public Flight
            </label>
          </div>

          <div className={styles.field}>
            <label htmlFor="comment">Comment</label>
            <textarea
              id="comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </section>

        {createFlightMutation.isError && (
          <ErrorMessage
            message={
              createFlightMutation.error instanceof Error
                ? createFlightMutation.error.message
                : 'Failed to save flight.'
            }
          />
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={() => navigate('/logbook')}>
            Cancel
          </button>
          <button type="submit" className={styles.submitBtn} disabled={submitDisabled}>
            {createFlightMutation.isPending ? 'Saving…' : 'Save Flight'}
          </button>
        </div>

      </form>
    </div>
  );
}

// ── Small reusable field components ──────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}

function TimeField({ id, label, value, onChange }: FieldProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        min="0"
        // step="0.1"
        placeholder="0.0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function BlockTimeField({ id, label, value, onChange }: FieldProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value.replace(/[^\d:]/g, '');
    // Auto-insert colon after two digits
    if (!raw.includes(':') && raw.length >= 2) {
      raw = raw.slice(0, 2) + ':' + raw.slice(2);
    }
    if (raw.length > 5) return;
    onChange(raw);
  }

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder="HH:MM"
        maxLength={5}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
}

function IntField({ id, label, value, onChange }: FieldProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        min="0"
        step="1"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
