type DateLike = string | number | Date | null | undefined;
type BerlinParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const localDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function formatNumber(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

function parseNaiveParts(value: string): BerlinParts | null {
  const match = value
    .trim()
    .match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/i
    );
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4] ?? "0"),
    minute: Number(match[5] ?? "0"),
    second: Number(match[6] ?? "0"),
  };
}

function partsToStoredString(parts: BerlinParts): string {
  return [
    `${formatNumber(parts.year, 4)}-${formatNumber(parts.month)}-${formatNumber(parts.day)}`,
    `${formatNumber(parts.hour)}:${formatNumber(parts.minute)}:${formatNumber(parts.second)}`,
  ].join("T");
}

function formatterPartsToObject(parts: Intl.DateTimeFormatPart[]): BerlinParts {
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

function berlinPartsFromDate(date: Date): BerlinParts {
  return formatterPartsToObject(localDateTimeFormatter.formatToParts(date));
}

function partsToLocalDate(parts: BerlinParts): Date {
  return new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    0
  );
}

function partsToStableFormatDate(parts: BerlinParts): Date {
  return new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      0
    )
  );
}

function asDate(value: DateLike): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const raw = value.trim();
  if (!raw) return null;

  const naive = parseNaiveParts(raw);
  if (naive) return partsToLocalDate(naive);

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseStoredDateTime(value: DateLike): Date | null {
  return asDate(value);
}

export function toStoredDateTimeString(value: DateLike): string {
  if (typeof value === "string") {
    const naive = parseNaiveParts(value);
    if (naive) return partsToStoredString(naive);
  }

  const date = asDate(value);
  if (!date) return "";
  return partsToStoredString(berlinPartsFromDate(date));
}

export function compareStoredDateTimes(a: DateLike, b: DateLike): number {
  const aDate = asDate(a);
  const bDate = asDate(b);
  if (aDate && bDate) return aDate.getTime() - bDate.getTime();
  return String(a ?? "").localeCompare(String(b ?? ""));
}

export function formatInBerlin(
  value: DateLike,
  options: Intl.DateTimeFormatOptions
): string {
  const parts =
    typeof value === "string" ? parseNaiveParts(value) : null;
  const date = parts
    ? partsToStableFormatDate(parts)
    : value instanceof Date || typeof value === "number"
      ? partsToStableFormatDate(berlinPartsFromDate(new Date(value)))
      : asDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat(undefined, {
    timeZone: "UTC",
    ...options,
  }).format(date);
}

export function formatDateInBerlin(value: DateLike): string {
  return formatInBerlin(value, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatTimeInBerlin(value: DateLike): string {
  return formatInBerlin(value, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDateTimeInBerlin(
  value: DateLike,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return formatInBerlin(value, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...options,
  });
}

export function storedDateKey(value: DateLike): string {
  const date = asDate(value);
  if (!date) return "";
  const parts = berlinPartsFromDate(date);
  return `${formatNumber(parts.year, 4)}-${formatNumber(parts.month)}-${formatNumber(parts.day)}`;
}

export function storedHalfHourSlot(value: DateLike): string {
  const date = asDate(value);
  if (!date) return "";
  const parts = berlinPartsFromDate(date);
  return `${formatNumber(parts.hour)}:${parts.minute < 30 ? "00" : "30"}`;
}

export function normalizeDateTimeLocalValue(value: string): string {
  const parts = parseNaiveParts(value);
  if (!parts) return "";
  return partsToStoredString(parts);
}

export function toDateTimeLocalValue(value: DateLike): string {
  const stored = toStoredDateTimeString(value);
  if (!stored) return "";
  return stored.slice(0, 16);
}

export function buildStoredDateTime(dateKey: string, slot: string): string {
  return normalizeDateTimeLocalValue(`${dateKey}T${slot}`);
}

export function addMinutesToStoredDateTime(value: DateLike, minutes: number): string {
  const stored = toStoredDateTimeString(value);
  if (!stored) return "";
  const parts = parseNaiveParts(stored);
  if (!parts) return "";
  const shifted = new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute + minutes,
      parts.second
    )
  );
  return partsToStoredString({
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
  });
}
