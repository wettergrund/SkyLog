import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAircraft } from '../../hooks/useAircraft';
import { useHideAircraft } from '../../hooks/useHideAircraft';
import { useUpdateAircraft } from '../../hooks/useUpdateAircraft';
import { useCreateAircraft } from '../../hooks/useCreateAircraft';
import { getCategoryClasses } from '../../api/aircraft';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import styles from './HangarPage.module.css';

const INSTANCE_TYPES = [
  { value: 'RealAircraft',         label: 'Real Aircraft' },
  { value: 'UncertifiedSimulator', label: 'Uncertified Simulator' },
  { value: 'CertifiedATD',         label: 'Certified ATD' },
  { value: 'CertifiedFTD',         label: 'Certified FTD' },
  { value: 'CertifiedSim',         label: 'Certified Sim' },
];

function GearIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function HangarPage() {
  const { data: aircraftList, isLoading } = useAircraft();
  const hideAircraftMutation = useHideAircraft();
  const updateAircraftMutation = useUpdateAircraft();
  const createAircraftMutation = useCreateAircraft();
  const { data: categoryClasses } = useQuery({
    queryKey: ['categoryClasses'],
    queryFn: getCategoryClasses,
    staleTime: 10 * 60 * 1000,
  });

  // ── Card menu state ────────────────────────────────────────────────────────
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  useEffect(() => {
    if (menuOpenId === null) return;
    function close() { setMenuOpenId(null); }
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpenId]);

  // ── Edit form state ────────────────────────────────────────────────────────
  const [editingAircraftId, setEditingAircraftId] = useState<number | null>(null);
  const [editManufacturer, setEditManufacturer] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editCategoryClassId, setEditCategoryClassId] = useState('');
  const [editInstanceType, setEditInstanceType] = useState('RealAircraft');
  const [editError, setEditError] = useState('');

  // ── Add form state ─────────────────────────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTailNumber, setNewTailNumber] = useState('');
  const [newManufacturer, setNewManufacturer] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newCategoryClassId, setNewCategoryClassId] = useState('');
  const [newInstanceType, setNewInstanceType] = useState('RealAircraft');
  const [addError, setAddError] = useState('');

  function startEdit(id: number) {
    const ac = aircraftList?.find(a => a.aircraftId === id);
    if (!ac) return;
    setEditManufacturer(ac.manufacturer ?? '');
    setEditModel(ac.model ?? '');
    setEditCategoryClassId(String(ac.categoryClassId ?? ''));
    setEditInstanceType(ac.instanceType ?? 'RealAircraft');
    setEditError('');
    setShowAddForm(false);
    setEditingAircraftId(id);
  }

  function toggleAddForm() {
    setShowAddForm(prev => !prev);
    setEditingAircraftId(null);
    setNewTailNumber('');
    setNewManufacturer('');
    setNewModel('');
    setNewCategoryClassId('');
    setNewInstanceType('RealAircraft');
    setAddError('');
  }

  async function handleAdd() {
    setAddError('');
    if (!newTailNumber.trim() || !newManufacturer.trim() || !newModel.trim() || !newCategoryClassId) {
      setAddError('All fields are required.');
      return;
    }
    try {
      await createAircraftMutation.mutateAsync({
        tailNumber: newTailNumber.trim(),
        manufacturerName: newManufacturer.trim(),
        modelName: newModel.trim(),
        categoryClassId: Number(newCategoryClassId),
        instanceType: newInstanceType,
      });
      setShowAddForm(false);
      setNewTailNumber('');
      setNewManufacturer('');
      setNewModel('');
      setNewCategoryClassId('');
      setNewInstanceType('RealAircraft');
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add aircraft.');
    }
  }

  async function handleSave() {
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

  const visibleAircraft = (aircraftList ?? []).filter(ac => !ac.hideFromSelection);
  const hiddenAircraft  = (aircraftList ?? []).filter(ac =>  ac.hideFromSelection);
  const totalCount = (aircraftList ?? []).length;
  const hiddenCount = hiddenAircraft.length;
  const editingAc = aircraftList?.find(a => a.aircraftId === editingAircraftId);

  function renderCard(ac: typeof visibleAircraft[number]) {
    const menuOpen = menuOpenId === ac.aircraftId;
    return (
      <div
        key={ac.aircraftId}
        className={`${styles.card} ${editingAircraftId === ac.aircraftId ? styles.cardEditing : ''}`}
      >
        <button
          type="button"
          className={`${styles.gearBtn} ${menuOpen ? styles.gearBtnOpen : ''}`}
          onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpen ? null : ac.aircraftId); }}
          aria-label={`Options for ${ac.tailNumber}`}
          aria-haspopup="true"
          aria-expanded={menuOpen}
        >
          <GearIcon />
        </button>

        {menuOpen && (
          <div className={styles.cardMenu} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.cardMenuItem}
              onClick={() => { setMenuOpenId(null); editingAircraftId === ac.aircraftId ? setEditingAircraftId(null) : startEdit(ac.aircraftId); }}
            >
              {editingAircraftId === ac.aircraftId ? 'Close edit' : 'Edit'}
            </button>
            <button
              type="button"
              className={styles.cardMenuItem}
              onClick={() => { setMenuOpenId(null); hideAircraftMutation.mutate({ id: ac.aircraftId, hide: !ac.hideFromSelection }); }}
              disabled={hideAircraftMutation.isPending}
            >
              {ac.hideFromSelection ? 'Show' : 'Hide'}
            </button>
          </div>
        )}

        {ac.defaultImage
          ? <img src={ac.defaultImage} alt={ac.tailNumber} className={styles.cardImage} />
          : <div className={styles.cardNoImage} />
        }
        <span className={styles.tailNumber}>{ac.tailNumber}</span>
        <span className={styles.model}>
          {(ac.model === 'Unknown' || !ac.model) && (ac.manufacturer === 'Unknown' || !ac.manufacturer)
            ? '—'
            : `${ac.model} · ${ac.manufacturer}`}
        </span>
        <span className={styles.categoryClass}>{ac.categoryClass}</span>
        {(ac.totalHours ?? 0) > 0 && (
          <span className={styles.totalHours}>{ac.totalHours!.toFixed(1)} hrs</span>
        )}
      </div>
    );
  }

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
        <p className={styles.loading}>Loading aircraft… </p>
      ) : (
        <>
          <div className={styles.grid}>
            {visibleAircraft.map(renderCard)}

            {/* Add aircraft card */}
            <button
              type="button"
              className={`${styles.card} ${styles.cardAdd} ${showAddForm ? styles.cardEditing : ''}`}
              onClick={toggleAddForm}
              aria-label="Add new aircraft"
            >
              <span className={styles.addIcon}>+</span>
              <span className={styles.addLabel}>Add Aircraft</span>
            </button>
          </div>

          {hiddenAircraft.length > 0 && (
            <details className={styles.hiddenSection}>
              <summary className={styles.hiddenSummary}>
                {hiddenCount} hidden aircraft
              </summary>
              <div className={`${styles.grid} ${styles.hiddenGrid}`}>
                {hiddenAircraft.map(renderCard)}
              </div>
            </details>
          )}

          {editingAircraftId !== null && editingAc && (
            <div className={styles.editForm}>
              <h3 className={styles.editFormTitle}>Edit — {editingAc.tailNumber}</h3>

              {editError && <ErrorMessage message={editError} />}

              <div className={styles.editFormFields}>
                <div className={styles.editField}>
                  <label htmlFor="editManufacturer">Manufacturer</label>
                  <input
                    id="editManufacturer"
                    type="text"
                    placeholder="Cessna"
                    value={editManufacturer}
                    onChange={(e) => setEditManufacturer(e.target.value)}
                  />
                </div>
                <div className={styles.editField}>
                  <label htmlFor="editModel">Model</label>
                  <input
                    id="editModel"
                    type="text"
                    placeholder="172"
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
                  />
                </div>
                <div className={styles.editField}>
                  <label htmlFor="editCategoryClass">Category / Class</label>
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
                <div className={styles.editField}>
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

              <div className={styles.editFormActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setEditingAircraftId(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.saveBtn}
                  onClick={handleSave}
                  disabled={updateAircraftMutation.isPending}
                >
                  {updateAircraftMutation.isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {showAddForm && (
            <div className={styles.editForm}>
              <h3 className={styles.editFormTitle}>Add New Aircraft</h3>

              {addError && <ErrorMessage message={addError} />}

              <div className={styles.editFormFields}>
                <div className={styles.editField}>
                  <label htmlFor="newTailNumber">Tail Number</label>
                  <input
                    id="newTailNumber"
                    type="text"
                    placeholder="SE-ABC"
                    value={newTailNumber}
                    onChange={(e) => setNewTailNumber(e.target.value)}
                  />
                </div>
                <div className={styles.editField}>
                  <label htmlFor="newManufacturer">Manufacturer</label>
                  <input
                    id="newManufacturer"
                    type="text"
                    placeholder="Cessna"
                    value={newManufacturer}
                    onChange={(e) => setNewManufacturer(e.target.value)}
                  />
                </div>
                <div className={styles.editField}>
                  <label htmlFor="newModel">Model</label>
                  <input
                    id="newModel"
                    type="text"
                    placeholder="172"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                  />
                </div>
                <div className={styles.editField}>
                  <label htmlFor="newCategoryClass">Category / Class</label>
                  <select
                    id="newCategoryClass"
                    value={newCategoryClassId}
                    onChange={(e) => setNewCategoryClassId(e.target.value)}
                  >
                    <option value="">— Select —</option>
                    {categoryClasses?.map((cc) => (
                      <option key={cc.id} value={String(cc.id)}>{cc.catClass}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.editField}>
                  <label htmlFor="newInstanceType">Instance Type</label>
                  <select
                    id="newInstanceType"
                    value={newInstanceType}
                    onChange={(e) => setNewInstanceType(e.target.value)}
                  >
                    {INSTANCE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.editFormActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.saveBtn}
                  onClick={handleAdd}
                  disabled={createAircraftMutation.isPending}
                >
                  {createAircraftMutation.isPending ? 'Adding…' : 'Add Aircraft'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
