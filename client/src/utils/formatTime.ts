/**
 * Format a decimal hours value.
 * When usesHHMM is true: renders as "H:MM" (e.g. 1.5 → "1:30").
 * Otherwise: renders as a decimal string rounded to 1 decimal (e.g. 1.5 → "1.5").
 */
export function formatTime(val: number, usesHHMM: boolean): string {
  if (usesHHMM) {
    const totalMinutes = Math.round(val * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}:${String(m).padStart(2, '0')}`;
  }
  return val.toFixed(1);
}
