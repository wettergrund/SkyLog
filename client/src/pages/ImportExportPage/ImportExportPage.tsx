import { useRef, useState } from 'react';
import { importFlights, exportFlights } from '../../api/flights';
import type { ImportResult } from '../../types/flights';
import styles from './ImportExportPage.module.css';

export default function ImportExportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setResult(null);
    setImportError(null);
  }

  async function handleImport() {
    if (!selectedFile) return;
    setImporting(true);
    setResult(null);
    setImportError(null);

    try {
      const res = await importFlights(selectedFile);
      setResult(res);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleDownloadExample() {
    const header = 'Date,TailNumber,From,To,TotalFlightTime,PIC,SIC,Dual,CFI,CrossCountry,Night,IMC,SimulatedIFR,GroundSim,Approaches,Landings,FullStopLandings,NightLandings,HobbsStart,HobbsEnd,EngineStart,EngineEnd,FlightStart,FlightEnd,HoldingProcedures,IsPublic,Comment';
    const example = '2024-06-15,SE-ABC,ESSA,ESGG,1.5,1.5,,,,,0.3,,,,,1,1,,,,2024-06-15T08:00:00,2024-06-15T09:30:00,,,false,false,VFR cruise';
    const csv = `${header}\n${example}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flights_example.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleExport() {
    setExporting(true);
    setExportError(null);

    try {
      await exportFlights();
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className={styles.page}>
      <h2>Import / Export</h2>

      {/* ── Import ────────────────────────────────────────────────────────── */}
      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Import Flights</h3>
        <p className={styles.hint}>
          Upload a CSV file to bulk-import flights. Flights that already exist
          (same departure, destination, and block-off/on times) will be skipped.
        </p>

        <div className={styles.csvSpec}>
          <div className={styles.csvSpecHeader}>
            <p className={styles.csvSpecTitle}>Expected columns</p>
            <button className={styles.ghostBtn} onClick={handleDownloadExample}>
              Download example CSV
            </button>
          </div>
          <code className={styles.csvColumns}>
            Date, TailNumber, From, To, TotalFlightTime, PIC, SIC, Dual, CFI,
            CrossCountry, Night, IMC, SimulatedIFR, GroundSim, Approaches, Landings,
            FullStopLandings, NightLandings, HobbsStart, HobbsEnd,
            EngineStart, EngineEnd, FlightStart, FlightEnd,
            HoldingProcedures, IsPublic, Comment
          </code>
          <p className={styles.csvNote}>
            Only <strong>Date</strong>, <strong>TailNumber</strong>, and{' '}
            <strong>TotalFlightTime</strong> are required. All other columns are optional.
            If a tail number is not in your hangar it will be created automatically
            with a placeholder model that you can update later.
          </p>
        </div>

        <div className={styles.uploadRow}>
          <label className={styles.fileLabel}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className={styles.fileInput}
              onChange={handleFileChange}
            />
            <span className={styles.fileLabelText}>
              {selectedFile ? selectedFile.name : 'Choose CSV file…'}
            </span>
          </label>

          <button
            className={styles.primaryBtn}
            onClick={handleImport}
            disabled={!selectedFile || importing}
          >
            {importing ? 'Importing…' : 'Import'}
          </button>
        </div>

        {importError && (
          <div className={styles.errorBox}>{importError}</div>
        )}

        {result && (
          <div className={styles.resultBox}>
            <div className={styles.resultStats}>
              <span className={styles.statGood}>{result.imported} imported</span>
              <span className={styles.statNeutral}>{result.skipped} skipped</span>
            </div>
            {result.errors.length > 0 && (
              <ul className={styles.errorList}>
                {result.errors.map((e, i) => (
                  <li key={i} className={styles.errorItem}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* ── Export ────────────────────────────────────────────────────────── */}
      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Export Flights</h3>
        <p className={styles.hint}>
          Download all your flights as a CSV file. The file can be re-imported
          into SkyLog or opened in any spreadsheet application.
        </p>

        <button
          className={styles.primaryBtn}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Exporting…' : 'Download CSV'}
        </button>

        {exportError && (
          <div className={styles.errorBox}>{exportError}</div>
        )}
      </section>
    </div>
  );
}
