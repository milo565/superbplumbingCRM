import { format, parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

export const TIMEZONE = "Australia/Brisbane";

export function formatDate(value?: Date | string | null, fallback = "—") {
  if (!value) return fallback;
  const date = typeof value === "string" ? parseISO(value) : value;
  return formatInTimeZone(date, TIMEZONE, "dd/MM/yyyy");
}

export function formatDateTime(value?: Date | string | null, fallback = "—") {
  if (!value) return fallback;
  const date = typeof value === "string" ? parseISO(value) : value;
  return formatInTimeZone(date, TIMEZONE, "dd/MM/yyyy h:mm a");
}

export function formatTime(value?: Date | string | null, fallback = "—") {
  if (!value) return fallback;
  const date = typeof value === "string" ? parseISO(value) : value;
  return formatInTimeZone(date, TIMEZONE, "h:mm a");
}

export function formatMoney(value?: number | null, fallback = "$0.00") {
  if (value == null || Number.isNaN(value)) return fallback;
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value);
}

export function formatPhone(value?: string | null) {
  if (!value) return "—";
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("61")) {
    digits = `0${digits.slice(2)}`;
  }
  if (digits.length === 9 && digits.startsWith("4")) {
    digits = `0${digits}`;
  }
  if (digits.length === 10 && digits.startsWith("04")) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }
  return value;
}

export function telHref(value?: string | null) {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("61")) {
    return `tel:+${digits}`;
  }
  if (digits.length === 10 && digits.startsWith("0")) {
    return `tel:+61${digits.slice(1)}`;
  }
  if (digits.length === 9 && digits.startsWith("4")) {
    return `tel:+61${digits}`;
  }
  return `tel:${value.replace(/\s/g, "")}`;
}

export function mapsHref(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function formatAddress(parts: {
  street: string;
  suburb: string;
  state?: string;
  postcode: string;
}) {
  return `${parts.street}, ${parts.suburb} ${parts.state ?? "QLD"} ${parts.postcode}`;
}

export function localNow() {
  return toZonedTime(new Date(), TIMEZONE);
}

export function startOfLocalDay(date = new Date()) {
  const zoned = toZonedTime(date, TIMEZONE);
  zoned.setHours(0, 0, 0, 0);
  return zoned;
}

export function formatShortDate(date: Date) {
  return format(toZonedTime(date, TIMEZONE), "EEE d MMM");
}

export function localDayRange(date = new Date()) {
  const zoned = toZonedTime(date, TIMEZONE);
  const startLocal = new Date(zoned);
  startLocal.setHours(0, 0, 0, 0);
  const endLocal = new Date(startLocal);
  endLocal.setDate(endLocal.getDate() + 1);
  return {
    start: fromZonedTime(startLocal, TIMEZONE),
    end: fromZonedTime(endLocal, TIMEZONE),
  };
}

export const brisbaneDayRange = localDayRange;
/** @deprecated use localDayRange — Gold Coast uses Australia/Brisbane */
export const melbourneDayRange = localDayRange;
