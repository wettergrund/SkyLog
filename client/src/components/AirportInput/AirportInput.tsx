import { useState, useEffect, useRef } from 'react';
import { searchAirports } from '../../api/airports';
import type { AirportResult } from '../../types/airports';
import styles from './AirportInput.module.css';

interface AirportInputProps {
  value: string;
  onChange: (icao: string) => void;
  onSelect?: (airport: AirportResult | null) => void;
  className?: string;
  placeholder?: string;
}

export default function AirportInput({
  value,
  onChange,
  onSelect,
  className,
  placeholder = 'ICAO',
}: AirportInputProps) {
  const [results, setResults] = useState<AirportResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedAirport, setSelectedAirport] = useState<AirportResult | null>(null);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the selected hint if value is manually cleared
  useEffect(() => {
    if (!value) {
      setSelectedAirport(null);
      setResults([]);
      setOpen(false);
      onSelect?.(null);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  function runSearch(q: string) {
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    searchAirports(q).then((data) => {
      if (data.length === 1) {
        selectResult(data[0]);
        return;
      }
      setResults(data);
      setOpen(data.length > 0);
      setActiveIndex(-1);
    }).catch(() => {
      setResults([]);
      setOpen(false);
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const upper = e.target.value.toUpperCase();
    onChange(upper);
    setSelectedAirport(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(upper), 200);
  }

  function selectResult(result: AirportResult) {
    onChange(result.icao);
    setSelectedAirport(result);
    onSelect?.(result);
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleBlur() {
    if (!selectedAirport && value.length >= 4 && results.length > 0) {
      selectResult(results[0]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      selectResult(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setResults([]);
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  // Close on click outside
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <input
        type="text"
        className={className}
        placeholder={placeholder}
        maxLength={7}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
        spellCheck={false}
      />
      {open && results.length > 0 && (
        <ul className={styles.dropdown} role="listbox">
          {results.map((r, i) => (
            <li
              key={r.icao}
              role="option"
              aria-selected={i === activeIndex}
              className={`${styles.dropdownItem} ${i === activeIndex ? styles.dropdownItemActive : ''}`}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent input blur before click fires
                selectResult(r);
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className={styles.dropdownIcao}>{r.icao}</span>
              <span className={styles.dropdownName}>
                {r.name}{r.municipality ? ` (${r.municipality})` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
      {selectedAirport && !open && (
        <p className={styles.hint}>{selectedAirport.name}</p>
      )}
    </div>
  );
}
