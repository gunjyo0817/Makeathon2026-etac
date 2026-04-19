import {
  formatDateInBerlin,
  formatTimeInBerlin,
  parseStoredDateTime,
  storedDateKey,
} from "@/lib/dateTime";

export function timeAgo(iso: string): string {
  const date = parseStoredDateTime(iso);
  if (!date) return "";
  const diff = Date.now() - date.getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

export function formatTime(iso: string): string {
  return formatTimeInBerlin(iso);
}

export function formatDate(iso: string): string {
  return formatDateInBerlin(iso);
}

export function isToday(iso: string): boolean {
  return storedDateKey(iso) === storedDateKey(new Date());
}
