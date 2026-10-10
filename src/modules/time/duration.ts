/**
 * Parse a free-text duration into minutes.
 * Accepts: "1.5" (hours), "1:30", "90m", "2h", "1h30m", "1h 30m", "1.25h".
 * Returns null for anything unparseable, zero, or over 24h.
 */
export function parseDuration(input: string): number | null {
  const s = input.trim().toLowerCase().replace(/\s+/g, '');
  if (!s) return null;

  let minutes: number | null = null;

  if (/^\d+(\.\d+)?$/.test(s) || /^\.\d+$/.test(s)) {
    minutes = parseFloat(s) * 60; // bare number = hours
  } else if (/^\d+:\d{1,2}$/.test(s)) {
    const [h, m] = s.split(':').map(Number);
    if (m >= 60) return null;
    minutes = h * 60 + m;
  } else {
    const match = s.match(/^(?:(\d+(?:\.\d+)?)h)?(?:(\d+)m)?$/);
    if (match && (match[1] || match[2])) {
      minutes = (match[1] ? parseFloat(match[1]) * 60 : 0) + (match[2] ? parseInt(match[2], 10) : 0);
    }
  }

  if (minutes === null) return null;
  minutes = Math.round(minutes);
  if (minutes <= 0 || minutes > 24 * 60) return null;
  return minutes;
}

/** 90 -> "1h 30m", 60 -> "1h", 45 -> "45m" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

/** 90 -> "1.50" — decimal hours for totals and exports */
export function formatHours(minutes: number): string {
  return (minutes / 60).toFixed(2);
}
