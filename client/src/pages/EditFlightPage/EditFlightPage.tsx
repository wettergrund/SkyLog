import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { AirportResult } from '../../types/airports';
import { useQuery } from '@tanstack/react-query';
import { useGetFlight } from '../../hooks/useGetFlight';
import { useUpdateFlight } from '../../hooks/useUpdateFlight';
import { useUpdateAircraft } from '../../hooks/useUpdateAircraft';
import { useAircraft } from '../../hooks/useAircraft';
import { getCategoryClasses } from '../../api/aircraft';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import AirportInput from '../../components/AirportInput/AirportInput';
import styles from '../NewFlightPage/NewFlightPage.module.css';

const INSTANCE_TYPES = [
  { value: 'RealAircraft',         label: 'Real Aircraft' },
  { value: 'UncertifiedSimulator', label: 'Uncertified Simulator' },
  { value: 'CertifiedATD',         label: 'Certified ATD' },
  { value: 'CertifiedFTD',         label: 'Certified FTD' },
  { value: 'CertifiedSim',         label: 'Certified Sim' },
];

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export default function EditFlightPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const flightId = Number(id);

  const { data: flight, isLoading, isError } = useGetFlight(flightId);
  const { data: aircraftList } = useAircraft();
  const { data: categoryClasses } = useQuery({
    queryKey: ['categoryClasses'],
    queryFn: getCategoryClasses,
    staleTime: 10 * 60 * 1000,
  });
  const updateFlightMutation = useUpdateFlight();
  const updateAircraftMutation = useUpdateAircraft();

  // ── Flight form state ─────────────────────────────────────────────────────
  const [date, setDate] = useState('');
  const [blockOff, setBlockOff] = useState('');
  const [blockOn, setBlockOn] = useState('');
  const [selectedAircraftId, setSelectedAircraftId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fromAirport, setFromAirport] = useState<AirportResult | null>(null);
  const [toAirport, setToAirport] = useState<AirportResult | null>(null);
  const [totalFlightTime, setTotalFlightTime] = useState('');

  const distanceNm = useMemo(() => {
    if (!fromAirport?.latitude || !toAirport?.latitude) return null;
    if (fromAirport.icao === toAirport.icao) return null;
    const R = 3440.065;
    const lat1 = fromAirport.latitude  * Math.PI / 180;
    const lat2 = toAirport.latitude    * Math.PI / 180;
    const dLat = lat2 - lat1;
    const dLon = (toAirport.longitude! - fromAirport.longitude!) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }, [fromAirport, toAirport]);
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
  const [comment, setComment] = useState('');

  // ── Pre-populate fields once flight is loaded ─────────────────────────────
  const [populated, setPopulated] = useState(false);
  useEffect(() => {
    if (!flight || populated) return;
    setDate(flight.date.slice(0, 10));
    setBlockOff(flight.flightStart ? flight.flightStart.slice(11, 16) : '');
    setBlockOn(flight.flightEnd   ? flight.flightEnd.slice(11, 16)   : '');
    setSelectedAircraftId(String(flight.aircraftId));
    setFrom(flight.from ?? '');
    setTo(flight.to ?? '');
    setTotalFlightTime(flight.totalFlightTime > 0 ? String(flight.totalFlightTime) : '');
    setPic(flight.pic > 0 ? String(flight.pic) : '');
    setSic(flight.sic > 0 ? String(flight.sic) : '');
    setDual(flight.dual > 0 ? String(flight.dual) : '');
    setCfi(flight.cfi > 0 ? String(flight.cfi) : '');
    setCrossCountry(flight.crossCountry > 0 ? String(flight.crossCountry) : '');
    setNighttime(flight.nighttime > 0 ? String(flight.nighttime) : '');
    setImc(flight.imc > 0 ? String(flight.imc) : '');
    setSimulatedIFR(flight.simulatedIFR > 0 ? String(flight.simulatedIFR) : '');
    setGroundSim(flight.groundSim > 0 ? String(flight.groundSim) : '');
    setApproaches(flight.approaches > 0 ? String(flight.approaches) : '');
    setLandings(flight.landings > 0 ? String(flight.landings) : '');
    setFullStopLandings(flight.fullStopLandings > 0 ? String(flight.fullStopLandings) : '');
    setNightLandings(flight.nightLandings > 0 ? String(flight.nightLandings) : '');
    setComment(flight.comment ?? '');
    setPopulated(true);
  }, [flight, populated]);

  // ── Edit aircraft sub-form state ──────────────────────────────────────────
  const [editingAircraftId, setEditingAircraftId] = useState<number | null>(null);
  const [editManufacturer, setEditManufacturer] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editCategoryClassId, setEditCategoryClassId] = useState('');
  const [editInstanceType, setEditInstanceType] = useState('RealAircraft');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (editingAircraftId === null) return;
    const ac = aircraftList?.find((a) => a.aircraftId === editingAircraftId);
    if (!ac) return;
    setEditManufacturer(ac.manufacturer ?? '');
    setEditModel(ac.model ?? '');
    setEditCategoryClassId(String(ac.categoryClassId ?? ''));
    setEditInstanceType(ac.instanceType ?? 'RealAircraft');
    setEditError('');
  }, [editingAircraftId, aircraftList]);

  async function handleUpdateAircraft() {
    setEditError('');
    if (!editManufacturer.trim() || !editModel.trim() || !editCategoryClassId) {
      setEditError('All fields are required.');
      return;
    }
    try {
      await updateAircraftMutation.mutateAsync({
        id: editingAircraftId!,
        data: {
          manufacturerName: editManufacturer,
          modelName: editModel,
          categoryClassId: Number(editCategoryClassId),
          instanceType: editInstanceType,
        },
      });
      setEditingAircraftId(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update aircraft.');
    }
  }

  // ── Auto-calculate total from block times ─────────────────────────────────
  useEffect(() => {
    const offMatch = blockOff.match(/^(\d{1,2}):(\d{2})$/);
    const onMatch  = blockOn.match(/^(\d{1,2}):(\d{2})$/);
    if (!offMatch || !onMatch) return;
    let diffMin =
      (Number(onMatch[1]) * 60 + Number(onMatch[2])) -
      (Number(offMatch[1]) * 60 + Number(offMatch[2]));
    if (diffMin < 0) diffMin += 24 * 60;
    setTotalFlightTime((diffMin / 60).toFixed(1));
  }, [blockOff, blockOn]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const aircraftId = Number(selectedAircraftId);
    if (!aircraftId || !date || !totalFlightTime) return;

    try {
      await updateFlightMutation.mutateAsync({
        id: flightId,
        data: {
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
        },
      });
    } catch {
      // error is shown via updateFlightMutation.error
    }
  }

  const submitDisabled =
    updateFlightMutation.isPending ||
    !date ||
    !selectedAircraftId ||
    !totalFlightTime;

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage message="Failed to load flight." />;

  return (
    <div className={styles.page}>
      <h2 className={styles.pageTitle}>Edit Flight</h2>

      <form onSubmit={handleSubmit} noValidate>

        {/* ── Section 1: Aircraft picker ─────────────────────────────────── */}
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Aircraft</h3>

          <div className={styles.aircraftGrid}>
            {aircraftList?.map((ac) => (
              <div key={ac.aircraftId} className={styles.aircraftCardWrapper}>
                <button
                  type="button"
                  className={`${styles.aircraftCard} ${selectedAircraftId === String(ac.aircraftId) ? styles.aircraftCardSelected : ''}`}
                  onClick={() => { setSelectedAircraftId(String(ac.aircraftId)); setEditingAircraftId(null); }}
                >
                  <span className={styles.aircraftTail}>{ac.tailNumber}</span>
                  <span className={styles.aircraftModel}>{ac.model || ac.manufacturer}</span>
                  <span className={styles.aircraftCategory}>{ac.categoryClass}</span>
                </button>
                <button
                  type="button"
                  className={styles.aircraftEditBtn}
                  onClick={() => setEditingAircraftId(editingAircraftId === ac.aircraftId ? null : ac.aircraftId)}
                  aria-label={`Edit ${ac.tailNumber}`}
                >
                  <PencilIcon />
                </button>
              </div>
            ))}
          </div>

          {editingAircraftId !== null && (
            <div className={styles.subForm}>
              <h4 className={styles.subFormTitle}>
                Edit — {aircraftList?.find((a) => a.aircraftId === editingAircraftId)?.tailNumber}
              </h4>

              {editError && <ErrorMessage message={editError} />}

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="editManufacturer">Manufacturer *</label>
                  <input
                    id="editManufacturer"
                    type="text"
                    placeholder="Cessna"
                    value={editManufacturer}
                    onChange={(e) => setEditManufacturer(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="editModel">Model *</label>
                  <input
                    id="editModel"
                    type="text"
                    placeholder="172"
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="editCategoryClass">Category/Class *</label>
                  <select
                    id="editCategoryClass"
                    value={editCategoryClassId}
                    onChange={(e) => setEditCategoryClassId(e.target.value)}
                  >
                    <option value="">— Select —</option>
                    {categoryClasses?.map((cc) => (
                      <option key={cc.id} value={String(cc.id)}>{cc.catClass}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="editInstanceType">Instance Type</label>
                  <select
                    id="editInstanceType"
                    value={editInstanceType}
                    onChange={(e) => setEditInstanceType(e.target.value)}
                  >
                    {INSTANCE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.subFormActions}>
                <button type="button" className={styles.subFormCancelBtn} onClick={() => setEditingAircraftId(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.addAircraftBtn}
                  onClick={handleUpdateAircraft}
                  disabled={updateAircraftMutation.isPending}
                >
                  {updateAircraftMutation.isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── Section 2: Airline-ticket route card ──────────────────────── */}
        <section className={styles.ticket}>
          <div className={styles.ticketDate}>
            <label htmlFor="date" className={styles.ticketMetaLabel}>Date</label>
            <input
              id="date"
              type="date"
              className={styles.ticketDateInput}
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className={styles.ticketBody}>
            {/* Departure */}
            <div className={styles.ticketAirport}>
              <span className={styles.ticketAirportLabel}>Departure</span>
              <AirportInput
                className={styles.ticketIcao}
                value={from}
                onChange={setFrom}
                onSelect={setFromAirport}
              />
              <div className={styles.ticketBlockTime}>
                <BlockTimeField id="blockOff" label="Block off" value={blockOff} onChange={setBlockOff} />
              </div>
            </div>

            {/* Center connector */}
            <div className={styles.ticketConnector}>
              <div className={styles.ticketConnectorLine}>
                <div className={styles.ticketConnectorDot} />
                <div className={styles.ticketConnectorTrack} />
                <span className={styles.ticketPlane}>✈</span>
                <div className={styles.ticketConnectorTrack} />
                <div className={styles.ticketConnectorDot} />
              </div>
              {totalFlightTime && (
                <span className={styles.ticketDuration}>{totalFlightTime} h</span>
              )}
              {distanceNm !== null && (
                <span className={styles.ticketDistance}>{distanceNm} NM</span>
              )}
            </div>

            {/* Arrival */}
            <div className={styles.ticketAirport}>
              <span className={styles.ticketAirportLabel}>Arrival</span>
              <AirportInput
                className={styles.ticketIcao}
                value={to}
                onChange={setTo}
                onSelect={setToAirport}
              />
              <div className={styles.ticketBlockTime}>
                <BlockTimeField id="blockOn" label="Block on" value={blockOn} onChange={setBlockOn} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 3: Flight times ────────────────────────────────────── */}
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Flight Times</h3>

          <div className={styles.timePrimary}>
            <TimeField id="totalFlightTime" label="Total *" value={totalFlightTime} onChange={setTotalFlightTime} />
            <TimeField id="pic"             label="PIC"     value={pic}             onChange={setPic} />
          </div>

          <details className={styles.timeDetails}>
            <summary className={styles.timeDetailsSummary}>More time fields</summary>
            <div className={styles.timeGrid}>
              <TimeField id="sic"          label="SIC"           value={sic}          onChange={setSic} />
              <TimeField id="dual"         label="Dual"          value={dual}         onChange={setDual} />
              <TimeField id="cfi"          label="CFI"           value={cfi}          onChange={setCfi} />
              <TimeField id="crossCountry" label="Cross Country" value={crossCountry} onChange={setCrossCountry} />
              <TimeField id="nighttime"    label="Night"         value={nighttime}    onChange={setNighttime} />
              <TimeField id="imc"          label="IMC"           value={imc}          onChange={setImc} />
              <TimeField id="simulatedIFR" label="Sim IFR"       value={simulatedIFR} onChange={setSimulatedIFR} />
              <TimeField id="groundSim"    label="Ground Sim"    value={groundSim}    onChange={setGroundSim} />
            </div>
          </details>
        </section>

        {/* ── Section 4: Landings ────────────────────────────────────────── */}
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Landings</h3>

          <div className={styles.fieldRow}>
            <IntField id="landings"      label="Landings"   value={landings}         onChange={setLandings} />
            <IntField id="fullStop"      label="Full Stop"  value={fullStopLandings} onChange={setFullStopLandings} />
            <IntField id="nightLandings" label="Night Ldg"  value={nightLandings}    onChange={setNightLandings} />
            <IntField id="approaches"    label="Approaches" value={approaches}       onChange={setApproaches} />
          </div>
        </section>

        {/* ── Notes ──────────────────────────────────────────────────────── */}
        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label htmlFor="comment">Notes</label>
          <textarea
            id="comment"
            rows={2}
            placeholder="Optional notes about the flight…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {updateFlightMutation.isError && (
          <ErrorMessage
            message={
              updateFlightMutation.error instanceof Error
                ? updateFlightMutation.error.message
                : 'Failed to save flight.'
            }
          />
        )}

        <div className={styles.actions}>
          <div className={styles.actionsBtns}>
            <button type="button" className={styles.cancelBtn} onClick={() => navigate('/logbook')}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitDisabled}>
              {updateFlightMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
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
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        min="0"
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
    if (!raw.includes(':') && raw.length >= 2) {
      raw = raw.slice(0, 2) + ':' + raw.slice(2);
    }
    if (raw.length > 5) return;
    onChange(raw);
  }

  return (
    <div className={styles.blockField}>
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
    <div className={styles.field}>
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
